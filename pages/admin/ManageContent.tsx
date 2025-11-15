import React, { useState, useEffect } from 'react';
import Card from '../../components/Card.tsx';
import QuestionRenderer from '../../components/QuestionRenderer.tsx';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';
import { PastPaper, StudyGuide, PastQuestion } from '../../types.ts';
import apiService from '../../services/apiService.ts';


type ContentType = 'papers' | 'guides';

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
            // Basic validation
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
            
            {/* Step 1: Upload */}
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
            
            {/* Step 2: Set Answers */}
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
            
            {/* Step 3: Upload Images */}
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

            {/* Step 4: Confirm */}
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

// --- Manage Questions Modal ---
interface ManageQuestionsProps {
    paper: PastPaper;
    onClose: () => void;
    onUpdate: (updatedPaper: PastPaper) => void;
}
const ManageQuestionsModal: React.FC<ManageQuestionsProps> = ({ paper, onClose, onUpdate }) => {
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const handleBulkUploadComplete = (newQuestions: PastQuestion[]) => {
        const upload = async () => {
            try {
                const updatedPaper = {
                    ...paper,
                    questions: [...paper.questions, ...newQuestions],
                };
                const savedPaper = await apiService<PastPaper>(`/admin/papers/${paper.id}`, {
                    method: 'PUT',
                    body: updatedPaper
                });
                onUpdate(savedPaper);
                setShowBulkUpload(false);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to upload questions');
            }
        };
        upload();
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                     <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Manage Questions</h2>
                        <p className="text-slate-500 dark:text-slate-400">{paper.subject} - {paper.exam} {paper.year}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white text-3xl">&times;</button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <button onClick={() => setShowBulkUpload(prev => !prev)} className="flex items-center gap-2 bg-green-100 text-green-800 font-bold py-2 px-4 rounded-lg hover:bg-green-200 dark:bg-green-500/20 dark:text-green-200 dark:hover:bg-green-500/30">
                           <UploadIcon/> Bulk Upload
                        </button>
                         <button className="bg-slate-100 text-slate-800 font-bold py-2 px-4 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600" disabled>Add Single Question</button>
                    </div>
                    
                    {showBulkUpload && <BulkUploadWizard paper={paper} onComplete={handleBulkUploadComplete} onCancel={() => setShowBulkUpload(false)} />}
                    
                    <div className="mt-4 border-t dark:border-slate-700 pt-4 space-y-3">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">Existing Questions ({paper.questions.length})</h3>
                        {paper.questions.length > 0 ? paper.questions.map((q, i) => (
                            <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 border dark:border-slate-700 rounded-md">
                               <div className="flex items-start gap-2">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{i + 1}.</span>
                                    <div className="flex-1">
                                        <QuestionRenderer
                                            question={q}
                                            className="font-semibold text-slate-700 dark:text-slate-300"
                                            imageClassName="max-w-sm"
                                        />
                                        <div className="mt-2 pl-5 space-y-1">
                                            {Object.keys(q.options).map((key) => {
                                                const option = q.options[key];
                                                const isCorrect = key === q.answer;
                                                return (
                                                    <div key={key} className={`text-sm flex items-start gap-2 p-2 rounded ${isCorrect ? 'bg-green-100 dark:bg-green-500/20' : ''}`}>
                                                        <span className={`font-bold ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>{key}.</span>
                                                        <div className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-slate-700 dark:text-slate-300'}>
                                                            <MarkdownRenderer content={option.text} />
                                                            {option.diagram && <img src={option.diagram} alt={`Option ${key}`} className="mt-1 max-w-[150px] h-auto rounded border dark:border-slate-600" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-slate-500 dark:text-slate-400 text-center py-4">No questions yet.</p>}
                    </div>
                </div>
            </Card>
        </div>
    )
};


// --- Paper Modal ---
interface PaperModalProps {
    paper: PastPaper | null;
    onSave: (paper: PastPaper) => void;
    onClose: () => void;
}
const PaperModal: React.FC<PaperModalProps> = ({ paper, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<PastPaper>>({
        subject: '', exam: 'JAMB', year: new Date().getFullYear(), ...paper
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'year' ? Number(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paperToSave = { questions: paper?.questions || [], ...formData } as PastPaper;
        onSave(paperToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{paper ? 'Edit Paper' : 'Add New Paper'}</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Exam</label>
                        <input type="text" name="exam" value={formData.exam} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Year</label>
                        <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg">Save Paper</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- Guide Modal ---
interface GuideModalProps {
    guide: StudyGuide | null;
    onSave: (guide: StudyGuide) => void;
    onClose: () => void;
}
const GuideModal: React.FC<GuideModalProps> = ({ guide, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<StudyGuide>>({
        title: '', subject: '', content: '', ...guide
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const guideToSave = { createdAt: new Date().toISOString().split('T')[0], ...formData } as StudyGuide;
        onSave(guideToSave);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{guide ? 'Edit Guide' : 'Add New Guide'}</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Content (Markdown)</label>
                        <textarea name="content" value={formData.content} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md h-40 bg-slate-100 dark:bg-slate-700" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onClose} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg">Save Guide</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


const ManageContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ContentType>('papers');
    const [papers, setPapers] = useState<PastPaper[]>([]);
    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
    const [editingPaper, setEditingPaper] = useState<PastPaper | null>(null);
    
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [editingGuide, setEditingGuide] = useState<StudyGuide | null>(null);
    
    const [managingPaper, setManagingPaper] = useState<PastPaper | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [papersData, guidesData] = await Promise.all([
                    apiService<PastPaper[]>('/data/papers'),
                    apiService<StudyGuide[]>('/data/guides'),
                ]);
                setPapers(papersData);
                setGuides(guidesData);
            } catch (error) {
                console.error("Failed to fetch content", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Paper Handlers ---
    const openPaperModal = (paper: PastPaper | null) => { setEditingPaper(paper); setIsPaperModalOpen(true); };
    const closePaperModal = () => { setEditingPaper(null); setIsPaperModalOpen(false); };
    const handleSavePaper = (paperToSave: PastPaper) => {
        const save = async () => {
            try {
                let savedPaper: PastPaper;
                if (paperToSave.id) {
                    savedPaper = await apiService<PastPaper>(`/admin/papers/${paperToSave.id}`, {
                        method: 'PUT',
                        body: paperToSave
                    });
                    setPapers(papers.map(p => p.id === paperToSave.id ? savedPaper : p));
                } else {
                    savedPaper = await apiService<PastPaper>('/admin/papers', {
                        method: 'POST',
                        body: paperToSave
                    });
                    setPapers([savedPaper, ...papers]);
                }
                closePaperModal();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to save paper');
            }
        };
        save();
    };
    const handleDeletePaper = (paperId: string) => {
        if (window.confirm('Are you sure you want to delete this paper?')) {
            const del = async () => {
                try {
                    await apiService(`/admin/papers/${paperId}`, { method: 'DELETE' });
                    setPapers(prev => prev.filter(p => p.id !== paperId));
                } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to delete paper');
                }
            };
            del();
        }
    };
     const handleUpdatePaper = (updatedPaper: PastPaper) => {
        const update = async () => {
            try {
                const savedPaper = await apiService<PastPaper>(`/admin/papers/${updatedPaper.id}`, {
                    method: 'PUT',
                    body: updatedPaper
                });
                setPapers(prev => prev.map(p => p.id === updatedPaper.id ? savedPaper : p));
                setManagingPaper(savedPaper);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to update paper');
            }
        };
        update();
    };

    // --- Guide Handlers ---
    const openGuideModal = (guide: StudyGuide | null) => { setEditingGuide(guide); setIsGuideModalOpen(true); };
    const closeGuideModal = () => { setEditingGuide(null); setIsGuideModalOpen(false); };
    const handleSaveGuide = (guideToSave: StudyGuide) => {
        const save = async () => {
            try {
                let savedGuide: StudyGuide;
                if (guideToSave.id) {
                    savedGuide = await apiService<StudyGuide>(`/admin/guides/${guideToSave.id}`, {
                        method: 'PUT',
                        body: guideToSave
                    });
                    setGuides(guides.map(g => g.id === guideToSave.id ? savedGuide : g));
                } else {
                    savedGuide = await apiService<StudyGuide>('/admin/guides', {
                        method: 'POST',
                        body: guideToSave
                    });
                    setGuides([savedGuide, ...guides]);
                }
                closeGuideModal();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to save guide');
            }
        };
        save();
    };
    const handleDeleteGuide = (guideId: string) => {
        if (window.confirm('Are you sure you want to delete this guide?')) {
            const del = async () => {
                try {
                    await apiService(`/admin/guides/${guideId}`, { method: 'DELETE' });
                    setGuides(prev => prev.filter(g => g.id !== guideId));
                } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to delete guide');
                }
            };
            del();
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Manage Content</h1>

            <div className="flex border-b dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('papers')} 
                    className={`py-2 px-6 font-semibold ${activeTab === 'papers' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Past Papers
                </button>
                 <button 
                    onClick={() => setActiveTab('guides')} 
                    className={`py-2 px-6 font-semibold ${activeTab === 'guides' ? 'border-b-2 border-primary text-primary' : 'text-slate-500 dark:text-slate-400'}`}
                >
                    Study Guides
                </button>
            </div>
            
            {activeTab === 'papers' ? (
                <ManagePapers 
                    papers={papers}
                    isLoading={isLoading}
                    onAdd={() => openPaperModal(null)}
                    onEdit={openPaperModal}
                    onDelete={handleDeletePaper}
                    onManageQuestions={setManagingPaper}
                />
            ) : (
                <ManageGuides 
                    guides={guides}
                    isLoading={isLoading}
                    onAdd={() => openGuideModal(null)}
                    onEdit={openGuideModal}
                    onDelete={handleDeleteGuide}
                />
            )}
            
            {isPaperModalOpen && <PaperModal paper={editingPaper} onSave={handleSavePaper} onClose={closePaperModal} />}
            {isGuideModalOpen && <GuideModal guide={editingGuide} onSave={handleSaveGuide} onClose={closeGuideModal} />}
            {managingPaper && <ManageQuestionsModal paper={managingPaper} onClose={() => setManagingPaper(null)} onUpdate={handleUpdatePaper} />}
        </div>
    );
};


interface ManagePapersProps {
    papers: PastPaper[];
    isLoading: boolean;
    onAdd: () => void;
    onEdit: (paper: PastPaper) => void;
    onDelete: (id: string) => void;
    onManageQuestions: (paper: PastPaper) => void;
}
const ManagePapers: React.FC<ManagePapersProps> = ({ papers, isLoading, onAdd, onEdit, onDelete, onManageQuestions }) => {
    return (
         <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Past Papers ({papers.length})</h2>
                <button onClick={onAdd} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-accent w-full md:w-auto">Add New Paper</button>
            </div>
             <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Subject</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Exam</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Year</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300"># of Questions</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">Loading papers...</td></tr>
                        ) : (
                            papers.map(paper => (
                                <tr key={paper.id} className="border-b dark:border-slate-700 last:border-b-0">
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100 break-words">{paper.subject}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{paper.exam}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{paper.year}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{paper.questions.length}</td>
                                    <td className="p-4 flex gap-4">
                                        <button onClick={() => onManageQuestions(paper)} className="font-semibold text-green-600 dark:text-green-400 hover:underline">Questions</button>
                                        <button onClick={() => onEdit(paper)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(paper.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}

interface ManageGuidesProps {
    guides: StudyGuide[];
    isLoading: boolean;
    onAdd: () => void;
    onEdit: (guide: StudyGuide) => void;
    onDelete: (id: string) => void;
}
const ManageGuides: React.FC<ManageGuidesProps> = ({ guides, isLoading, onAdd, onEdit, onDelete }) => {
    return (
        <Card>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Study Guides ({guides.length})</h2>
                <button onClick={onAdd} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-accent w-full md:w-auto">Add New Guide</button>
            </div>
             <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Subject</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Created At</th>
                            <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                         {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">Loading guides...</td></tr>
                        ) : (
                            guides.map(guide => (
                                <tr key={guide.id} className="border-b dark:border-slate-700 last:border-b-0">
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100 break-words">{guide.title}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 break-words">{guide.subject}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{guide.createdAt}</td>
                                    <td className="p-4 flex gap-4">
                                        <button onClick={() => onEdit(guide)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                                        <button onClick={() => onDelete(guide.id)} className="font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


export default ManageContent;