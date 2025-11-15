import React, { useState, useEffect } from 'react';
import Card from '../components/Card.tsx';
import { generateStudyGuide } from '../services/aiService.ts';
import { StudyGuide } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import apiService from '../services/apiService.ts';


// Loading spinner component
const Spinner = () => (
    <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

// Icon for the AI generator header
const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const GuideModal: React.FC<{ guide: StudyGuide, onClose: () => void }> = ({ guide, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
                <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{guide.title}</h2>
                        <p className="text-sm text-slate-500">{guide.subject}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <MarkdownRenderer content={guide.content.trim()} />
                </div>
            </div>
        </div>
    );
};

const AccordionItem: React.FC<{
    subject: string;
    guides: StudyGuide[];
    onGuideClick: (guide: StudyGuide) => void;
}> = ({ subject, guides, onGuideClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const subjectId = subject.replace(/\s+/g, '-');

    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                aria-expanded={isOpen}
                aria-controls={`accordion-content-${subjectId}`}
            >
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{subject}</h3>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 text-slate-600 dark:text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                id={`accordion-content-${subjectId}`}
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}
            >
                <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800/20">
                    <ul className="space-y-2">
                        {guides.map(guide => (
                            <li key={guide.id}>
                                <button
                                    onClick={() => onGuideClick(guide)}
                                    className="w-full text-left p-3 rounded text-slate-700 dark:text-slate-300 hover:bg-primary-light hover:text-primary dark:hover:bg-primary/20 transition-colors duration-200 flex items-center gap-3"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span>{guide.title}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const StudyGuides: React.FC = () => {
    const { isAuthenticated, user, requestLogin, requestUpgrade, useAiCredit } = useAuth();
    const [allStudyGuides, setAllStudyGuides] = useState<StudyGuide[]>([]);
    const [isGuidesLoading, setIsGuidesLoading] = useState(true);
    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [generatedGuide, setGeneratedGuide] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasGenerated, setHasGenerated] = useState(false);
    const [viewingGuide, setViewingGuide] = useState<StudyGuide | null>(null);

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const data: StudyGuide[] = await apiService('/data/guides');
                setAllStudyGuides(data);
            } catch (error) {
                console.error("Failed to fetch study guides", error);
            } finally {
                setIsGuidesLoading(false);
            }
        };
        fetchGuides();
    }, []);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isAuthenticated || !user) {
            requestLogin();
            return;
        }

        if (user.subscription === 'free') {
            requestUpgrade({
                title: "Unlock AI Guide Generator",
                message: "Create personalized study guides on any topic instantly with ExamRedi Pro.",
                featureList: [
                    "Generate unlimited custom study guides",
                    "Costs 1 AI Credit per guide",
                    "Perfect for difficult topics",
                    "Save time on note-taking"
                ]
            });
            return;
        }
        
        if (user.aiCredits <= 0) {
             requestUpgrade({
                title: "You're out of AI Credits",
                message: "You've used all your AI Credits for this month. Your credits will reset on your next billing cycle.",
                featureList: [
                    "AI Credits are used for premium generation tasks",
                    "Pro users get 10 credits each month",
                    "Upgrade to generate more content",
                ]
            });
            return;
        }

        if (!subject.trim() || !topic.trim()) {
            setError('Please provide both a subject and a topic.');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setGeneratedGuide('');
        setHasGenerated(true);

        try {
            const guideContent = await generateStudyGuide(subject, topic);
            setGeneratedGuide(guideContent);
            await useAiCredit(); // Deduct one credit and refetch user
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setGeneratedGuide('');
        } finally {
            setIsLoading(false);
        }
    };

    const guidesBySubject = allStudyGuides.reduce((acc, guide) => {
        if (!acc[guide.subject]) {
            acc[guide.subject] = [];
        }
        acc[guide.subject].push(guide);
        return acc;
    }, {} as Record<string, StudyGuide[]>);

    return (
        <div className="space-y-6">
            <Card>
                <div className="p-2">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">All Study Guides</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">Explore a collection of guides, organized by subject.</p>
                    {isGuidesLoading ? <p>Loading guides...</p> : (
                        <div className="space-y-4">
                            {Object.entries(guidesBySubject).sort(([subjectA], [subjectB]) => subjectA.localeCompare(subjectB)).map(([subject, guides]) => (
                                <AccordionItem
                                    key={subject}
                                    subject={subject}
                                    guides={guides}
                                    onGuideClick={setViewingGuide}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            <Card>
                <form onSubmit={handleGenerate} className="space-y-6 p-2">
                    <div className="text-center">
                         <div className="inline-block p-3 bg-primary-light dark:bg-primary/20 rounded-full mb-3">
                            <GuideIcon />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">AI Guide Generator</h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-2">Can't find what you need? Create a custom study guide on any topic.</p>
                         {user?.subscription === 'pro' && (
                            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-500/20 px-3 py-1 rounded-full inline-block mt-2">Costs 1 AI Credit</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                            <input
                                id="subject"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Biology"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="topic" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Topic</label>
                            <input
                                id="topic"
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="e.g., Photosynthesis"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-center pt-2">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full md:w-1/2 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? 'Generating...' : 'Generate Guide'}
                        </button>
                    </div>
                </form>
            </Card>

            {hasGenerated && (
                <Card className="mt-6">
                    <div className="p-4">
                        {isLoading && <Spinner />}
                        {error && <p className="text-red-500 text-center">{error}</p>}
                        {generatedGuide && (
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-3 mb-4 capitalize">{topic}</h2>
                                <MarkdownRenderer content={generatedGuide} />
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {viewingGuide && <GuideModal guide={viewingGuide} onClose={() => setViewingGuide(null)} />}
        </div>
    );
};

export default StudyGuides;