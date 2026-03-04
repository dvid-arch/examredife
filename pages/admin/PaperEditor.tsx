import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import QuestionRenderer from '../../components/QuestionRenderer.tsx';
import { PastPaper, PastQuestion } from '../../types.ts';
import TopicSelector from '../../components/admin/TopicSelector.tsx';
import apiService from '../../services/apiService.ts';

// --- Icons ---
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const JsonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;

// --- Bulk Upload Wizard Component ---
interface BulkUploadWizardProps {
    paper: PastPaper;
    onComplete: (newQuestions: PastQuestion[]) => void;
    onCancel: () => void;
}
const BulkUploadWizard: React.FC<BulkUploadWizardProps> = ({ paper, onComplete, onCancel }) => {
    type WizardStep = 'upload' | 'answers' | 'images' | 'confirm';

    const [step, setStep] = useState<WizardStep>('upload');
    const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [requiredImages, setRequiredImages] = useState<string[]>([]);
    const [imageData, setImageData] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== 'application/json') {
            setError('Please upload a valid JSON file.');
            return;
        }
        setError(null);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!Array.isArray(data)) {
                throw new Error('JSON must be an array of question objects.');
            }
            if (!data[0] || !data[0].question_text || !data[0].options) {
                throw new Error('JSON structure is invalid. Missing required fields.');
            }

            setParsedQuestions(data);
            const images = data.map(q => q.image_reference).filter(Boolean);
            setRequiredImages([...new Set(images)]);
            setStep('answers');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to parse JSON file.');
        }
    };

    const handleAnswerChange = (qNum: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [qNum]: answer }));
    };

    const handleImageChange = (filename: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImageData(prev => ({ ...prev, [filename]: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const goToNextStep = () => {
        if (step === 'answers') {
            if (requiredImages.length > 0) {
                setStep('images');
            } else {
                setStep('confirm');
            }
        } else if (step === 'images') {
            setStep('confirm');
        }
    };

    const handleConfirm = () => {
        const newQuestions: PastQuestion[] = parsedQuestions.map((q, index) => {
            const finalOptions: { [key: string]: { text: string } } = {};
            for (const key in q.options) {
                if (typeof q.options[key] === 'string') {
                    finalOptions[key] = { text: q.options[key] };
                }
            }

            return {
                id: `${paper.id}-q-${paper.questions.length + index}`,
                question: q.question_text,
                options: finalOptions,
                answer: answers[q.question_number],
                questionDiagram: q.image_reference ? imageData[q.image_reference] : undefined,
            };
        });
        onComplete(newQuestions);
    };

    const allAnswersSet = parsedQuestions.length > 0 && parsedQuestions.length === Object.keys(answers).length;
    const allImagesSet = requiredImages.length === Object.keys(imageData).length;

    return (
        <div className="mt-4 border-t dark:border-slate-700 pt-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Bulk Upload Questions Wizard</h3>

            {step === 'upload' && (
                <div className="mt-4 p-6 border-2 border-dashed dark:border-slate-600 rounded-lg text-center bg-slate-50 dark:bg-slate-800/50">
                    <JsonIcon />
                    <h4 className="font-semibold mt-2 text-slate-800 dark:text-slate-200">Upload a JSON file</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">File must be an array of question objects following the required format.</p>
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-200 dark:file:border-slate-600 dark:file:hover:bg-slate-600"
                    />
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}

            {step === 'answers' && (
                <div className="mt-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Step 2: Set Correct Answers</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Select the correct answer for each question.</p>
                    <div className="space-y-4 max-h-96 overflow-y-auto p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        {parsedQuestions.map(q => (
                            <div key={q.question_number} className="p-3 bg-white dark:bg-slate-700/50 border dark:border-slate-600 rounded">
                                <p className="font-semibold text-slate-800 dark:text-slate-200">{q.question_number}. {q.question_text}</p>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    {Object.keys(q.options).map(key => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name={`q-${q.question_number}`} value={key} onChange={() => handleAnswerChange(q.question_number, key)} className="text-primary focus:ring-primary dark:bg-slate-800 dark:border-slate-500" />
                                            <span className="text-slate-700 dark:text-slate-300">{key}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={goToNextStep} disabled={!allAnswersSet} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Next</button>
                </div>
            )}

            {step === 'images' && (
                <div className="mt-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Step 3: Upload Required Images</h4>
                    <div className="space-y-3 mt-2">
                        {requiredImages.map(filename => (
                            <div key={filename} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 border rounded-md bg-white dark:bg-slate-700/50 dark:border-slate-600">
                                <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{filename}</span>
                                {imageData[filename] ? <CheckCircleIcon /> :
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(filename, e)}
                                        className="text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary/20 dark:text-slate-300 dark:file:bg-slate-700 dark:file:text-slate-200 dark:file:border-slate-600 dark:file:hover:bg-slate-600"
                                    />}
                            </div>
                        ))}
                    </div>
                    <button onClick={goToNextStep} disabled={!allImagesSet} className="mt-4 bg-primary text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Next</button>
                </div>
            )}

            {step === 'confirm' && (
                <div className="mt-4">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Step 4: Confirm Upload</h4>
                    <p className="text-slate-600 dark:text-slate-300">You are about to add <span className="font-bold text-slate-800 dark:text-slate-100">{parsedQuestions.length}</span> questions and <span className="font-bold text-slate-800 dark:text-slate-100">{requiredImages.length}</span> images to <span className="font-bold text-slate-800 dark:text-slate-100">{paper.subject} {paper.year}</span>.</p>
                    <div className="flex gap-4 mt-4">
                        <button onClick={onCancel} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                        <button onClick={handleConfirm} className="bg-primary text-white font-bold py-2 px-5 rounded-lg">Confirm & Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- QuestionEditForm Component ---
interface QuestionEditFormProps {
    question: PastQuestion;
    paperId: string;
    onSave: (updatedQuestion: PastQuestion) => void;
    onCancel: () => void;
}
const QuestionEditForm: React.FC<QuestionEditFormProps> = ({ question, paperId, onSave, onCancel }) => {
    const [qText, setQText] = useState(question.question);
    const [qOptions, setQOptions] = useState<{ [key: string]: { text: string } }>(question.options || {});
    const [qAnswer, setQAnswer] = useState(question.answer);
    const [qExplanation, setQExplanation] = useState(question.explanation || '');
    const [qImage, setQImage] = useState(question.questionDiagram || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleOptionChange = (key: string, value: string) => {
        setQOptions(prev => ({
            ...prev,
            [key]: { ...prev[key], text: value }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updated = await apiService<PastQuestion>(`/admin/papers/${paperId}/questions/${question.id}`, {
                method: 'PUT',
                body: {
                    question: qText,
                    options: qOptions,
                    answer: qAnswer,
                    explanation: qExplanation,
                    image: qImage,
                }
            });
            onSave(updated);
        } catch (err: any) {
            alert(`Failed to update question: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 mb-4">
            <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">Edit Question ({question.id})</h4>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Question Text (Markdown)</label>
                <textarea
                    value={qText}
                    onChange={e => setQText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Options</label>
                <div className="space-y-3">
                    {Object.entries(qOptions).map(([key, opt]) => (
                        <div key={key} className="flex items-center gap-3">
                            <span className="font-bold w-6 text-center text-slate-600 dark:text-slate-400">{key}:</span>
                            <textarea
                                value={opt.text}
                                onChange={e => handleOptionChange(key, e.target.value)}
                                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary min-h-[60px]"
                            />
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                                <input
                                    type="radio"
                                    name={`correct-${question.id}`}
                                    checked={qAnswer === key}
                                    onChange={() => setQAnswer(key)}
                                    className="text-primary focus:ring-primary"
                                />
                                Correct
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Explanation (Markdown)</label>
                <textarea
                    value={qExplanation}
                    onChange={e => setQExplanation(e.target.value)}
                    placeholder="Provide an explanation for the correct answer..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Image URL (Optional)</label>
                <input
                    type="text"
                    value={qImage}
                    onChange={e => setQImage(e.target.value)}
                    placeholder="Enter image URL or Base64 string..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-2 outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary hover:bg-accent text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-slate-400"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// --- QuestionTaggingRow Component ---
interface QuestionTaggingRowProps {
    question: PastQuestion;
    subject: string;
    availableTopics: { slug: string; label: string }[];
    onSave: (topics: string[]) => Promise<void>;
}
const QuestionTaggingRow: React.FC<QuestionTaggingRowProps> = ({ question, subject, availableTopics, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedTopics, setSelectedTopics] = useState<string[]>(question.topics || []);
    const [isSaving, setIsSaving] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const handleToggle = (slug: string) => {
        setSelectedTopics(prev =>
            prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
        );
    };

    const handleAiSuggest = async () => {
        if (availableTopics.length === 0) {
            alert('No topics available for this subject to suggest from.');
            return;
        }
        setIsAiLoading(true);
        try {
            const result = await apiService<{ suggestedTopics: string[] }>('/ai/suggest-question-topics', {
                method: 'POST',
                body: {
                    questionText: question.question,
                    questionOptions: question.options,
                    correctAnswer: question.answer,
                    availableTopics: availableTopics.slice(0, 100),
                    subject
                }
            });
            setSelectedTopics(result.suggestedTopics);
        } catch (err: any) {
            alert(`AI suggestion failed: ${err.message || 'Unknown error'}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleConfirm = async () => {
        setIsSaving(true);
        try {
            await onSave(selectedTopics);
            setIsEditing(false);
        } catch (err: any) {
            alert(`Failed to save tags: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mt-3 pt-3 border-t dark:border-slate-700 transition-all duration-300">
            {!isEditing ? (
                <div className="flex items-center justify-between gap-3 group">
                    <div className="flex flex-wrap gap-1.5 flex-1 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-100 dark:border-slate-700 min-h-[36px] items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Topics:</span>
                        {selectedTopics.length > 0 ? selectedTopics.map(slug => (
                            <span key={slug} className="text-[10px] bg-white dark:bg-slate-700 text-primary dark:text-primary-light px-2 py-0.5 rounded-md font-bold shadow-sm border border-slate-100 dark:border-slate-600">
                                {availableTopics.find(t => t.slug === slug)?.label || slug}
                            </span>
                        )) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">Untagged</span>
                        )}
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-light hover:bg-primary/5 px-3 py-1.5 rounded-lg border border-transparent hover:border-primary/20 transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.171V17h2.829l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit Tags
                    </button>
                </div>
            ) : (
                <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex-1">
                        <TopicSelector
                            availableTopics={availableTopics}
                            selectedTopics={selectedTopics}
                            onToggle={handleToggle}
                            onAiSuggest={handleAiSuggest}
                            isAiLoading={isAiLoading}
                        />
                    </div>
                    <div className="md:w-32 flex md:flex-col justify-end gap-2">
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setSelectedTopics(question.topics || []);
                            }}
                            className="flex-1 md:flex-none text-xs font-bold px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSaving}
                            className="flex-1 md:flex-none text-xs font-black bg-primary text-white px-4 py-2 rounded-lg shadow-lg shadow-primary/20 hover:bg-accent transition-all active:scale-95 disabled:bg-slate-400 disabled:shadow-none"
                        >
                            {isSaving ? 'SAVING...' : 'SAVE TAGS'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main PaperEditor Component ---
const PaperEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [paper, setPaper] = useState<PastPaper | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [allTopicsMap, setAllTopicsMap] = useState<Record<string, { label: string; topics: { slug: string; label: string }[] }>>({});
    const [apiError, setApiError] = useState<string | null>(null);

    // Fetch the paper data
    useEffect(() => {
        const fetchPaper = async () => {
            if (!id) return;
            try {
                // Fetch papers list to find the one we need by ID
                const allPapers = await apiService<PastPaper[]>('/data/papers');
                const matchedPaper = allPapers.find(p => p.id === id || (p as any)._id === id);
                if (matchedPaper) {
                    setPaper(matchedPaper);
                } else {
                    setApiError('Paper not found');
                }
            } catch (err: any) {
                console.error("Failed to fetch paper", err);
                setApiError("Failed to fetch paper details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPaper();
    }, [id]);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await apiService<any>('/admin/topics');

                if (Array.isArray(data)) {
                    const map: any = {};
                    data.forEach((item: any) => { map[item.slug] = item; });
                    setAllTopicsMap(map);
                } else {
                    setAllTopicsMap(data);
                }
            } catch (err: any) {
                console.error("Failed to fetch topics", err);
            }
        };
        fetchTopics();
    }, []);

    const paperTopics = useMemo(() => {
        if (!paper) return [];
        const keys = Object.keys(allTopicsMap);
        if (keys.length === 0) return [];

        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedSubject = normalize(paper.subject);

        const manualMapping: Record<string, string> = {
            'useofenglish': 'english-language',
            'english': 'english-language',
            'maths': 'mathematics',
            'mathematics': 'mathematics',
            'crk': 'christian-religious-knowledge-crk',
            'irk': 'islamic-religious-knowledge-irk',
            'government': 'government',
            'accounting': 'accounts-principles-of-accounts',
            'accountsprinciplesofaccounts': 'accounts-principles-of-accounts',
            'principlesofaccounts': 'accounts-principles-of-accounts',
            'accounts': 'accounts-principles-of-accounts'
        };

        if (manualMapping[normalizedSubject]) {
            const mappedKey = manualMapping[normalizedSubject];
            if (allTopicsMap[mappedKey]) return allTopicsMap[mappedKey].topics;
        }

        let key = keys.find(k => normalize(k) === normalizedSubject);
        if (!key) {
            key = keys.find(k => {
                const normalizedKey = normalize(k);
                return normalizedSubject.includes(normalizedKey) || normalizedKey.includes(normalizedSubject);
            });
        }
        if (!key) {
            key = keys.find(k => normalize(allTopicsMap[k].label) === normalizedSubject);
        }

        if (key && allTopicsMap[key]) {
            return allTopicsMap[key].topics;
        }

        return [];
    }, [allTopicsMap, paper]);

    const handleTagUpdate = async (questionId: string, topics: string[]) => {
        if (!paper) return;
        const paperId = paper.id || (paper as any)._id;
        const result = await apiService<PastQuestion>(`/admin/papers/${paperId}/questions/${questionId}/tags`, {
            method: 'PUT',
            body: { topics }
        });

        const updatedPaper = {
            ...paper,
            questions: paper.questions.map(q => q.id === questionId ? { ...q, topics: result.topics } : q)
        };
        setPaper(updatedPaper);
    };

    const handleBulkUploadComplete = (newQuestions: PastQuestion[]) => {
        if (!paper) return;
        const upload = async () => {
            try {
                const updatedPaper = {
                    ...paper,
                    questions: [...paper.questions, ...newQuestions],
                };
                const paperId = paper.id || (paper as any)._id;
                const savedPaper = await apiService<PastPaper>(`/admin/papers/${paperId}`, {
                    method: 'PUT',
                    body: updatedPaper
                });
                setPaper(savedPaper);
                setShowBulkUpload(false);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to upload questions');
            }
        };
        upload();
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading paper editor...</div>;
    }

    if (apiError || !paper) {
        return (
            <div className="p-8">
                <button onClick={() => navigate('/admin/papers')} className="mb-4 text-slate-500 hover:text-slate-800 transition-colors">
                    &larr; Back to Papers
                </button>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{apiError || 'Paper not found.'}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate('/admin/papers')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        Back to Papers
                    </button>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Manage Questions</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">{paper.subject} - {paper.exam} {paper.year}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setShowBulkUpload(!showBulkUpload)} className="flex items-center justify-center gap-2 bg-green-100 text-green-800 font-bold py-2 px-6 rounded-lg hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30 transition-colors w-full md:w-auto">
                        <UploadIcon /> {showBulkUpload ? 'Cancel Upload' : 'Bulk Upload'}
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full max-w-5xl mx-auto space-y-6">
                {showBulkUpload && (
                    <Card className="border-2 border-green-500/20 dark:border-green-500/20 shadow-lg shadow-green-500/5">
                        <BulkUploadWizard paper={paper} onComplete={handleBulkUploadComplete} onCancel={() => setShowBulkUpload(false)} />
                    </Card>
                )}

                <Card className="shadow-md overflow-hidden !p-0 sm:!p-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-6 pb-4 border-b dark:border-slate-700 px-4 pt-4 sm:px-0 sm:pt-0">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Existing Questions</h3>
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black px-3 py-1 rounded-full text-sm">
                            {paper.questions.length} Total
                        </span>
                    </div>

                    <div className="space-y-0 sm:space-y-6 flex flex-col divide-y sm:divide-y-0 dark:divide-slate-700/50 divide-slate-200">
                        {paper.questions.length > 0 ? paper.questions.map((q, i) => {
                            const isEditing = editingQuestionId === q.id;

                            return (
                                <div key={q.id} className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 sm:border border-slate-200 dark:border-slate-700 sm:rounded-xl shadow-none sm:shadow-sm">
                                    {isEditing ? (
                                        <QuestionEditForm
                                            question={q}
                                            paperId={paper.id || (paper as any)._id}
                                            onSave={(updatedQuestion) => {
                                                const updatedPaper = {
                                                    ...paper,
                                                    questions: paper.questions.map(pq => pq.id === updatedQuestion.id ? updatedQuestion : pq)
                                                };
                                                setPaper(updatedPaper);
                                                setEditingQuestionId(null);
                                            }}
                                            onCancel={() => setEditingQuestionId(null)}
                                        />
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-3 sm:gap-4 relative">
                                                <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-base flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full font-bold text-slate-600 dark:text-slate-300 mt-1 sm:mt-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <QuestionRenderer
                                                            question={q}
                                                            className="font-semibold text-slate-800 dark:text-slate-200 text-base sm:text-lg mb-4 flex-1"
                                                            imageClassName="max-w-md rounded-lg mt-2 mb-4 border border-slate-200 dark:border-slate-600 shadow-sm"
                                                            correctAnswer={q.answer}
                                                        />
                                                        <button
                                                            onClick={() => setEditingQuestionId(q.id)}
                                                            className="ml-3 sm:ml-4 flex items-center gap-1.5 text-xs font-bold text-primary dark:text-primary-light hover:bg-primary/10 px-2 sm:px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/50 transition-all shadow-sm bg-white dark:bg-slate-800"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.171V17h2.829l8.38-8.379-2.83-2.828z" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                    </div>

                                                    <div className="p-3 mt-6 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-600 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Topic Tagging</span>
                                                            {paperTopics.length === 0 && (
                                                                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-md font-bold">
                                                                    No topics available for mapping
                                                                </span>
                                                            )}
                                                        </div>
                                                        <QuestionTaggingRow
                                                            question={q}
                                                            subject={paper.subject}
                                                            availableTopics={paperTopics}
                                                            onSave={(topics) => handleTagUpdate(q.id, topics)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )
                        }) : (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 font-medium">No questions have been added to this paper yet.</p>
                                <button onClick={() => setShowBulkUpload(true)} className="mt-4 text-primary font-bold hover:underline">
                                    Bulk upload questions to get started
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PaperEditor;
