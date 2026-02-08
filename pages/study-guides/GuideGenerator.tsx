import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import { generateStudyGuide } from '../../services/aiService.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useUserProgress } from '../../contexts/UserProgressContext.tsx';
import { useToasts } from '../../contexts/ToastContext.tsx';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';

const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const GuideGenerator: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, requestLogin, requestUpgrade, useAiCredit } = useAuth();
    const { addActivity } = useUserProgress();
    const { error: toastError, success } = useToasts();

    const [subject, setSubject] = useState('');
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedContent, setGeneratedContent] = useState('');

    // Load drafts
    useEffect(() => {
        const draftSubject = localStorage.getItem('guide_draft_subject');
        const draftTopic = localStorage.getItem('guide_draft_topic');
        if (draftSubject) setSubject(draftSubject);
        if (draftTopic) setTopic(draftTopic);
    }, []);

    const updateSubject = (val: string) => {
        setSubject(val);
        localStorage.setItem('guide_draft_subject', val);
    };

    const updateTopic = (val: string) => {
        setTopic(val);
        localStorage.setItem('guide_draft_topic', val);
    };

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
            toastError('Please provide both a subject and a topic.');
            return;
        }

        setIsLoading(true);
        setGeneratedContent('');

        try {
            const guideContent = await generateStudyGuide(subject, topic);
            setGeneratedContent(guideContent);
            await useAiCredit();

            addActivity({
                id: `guide-gen-${Date.now()}`,
                title: `AI: ${topic}`,
                path: '/study-guides/generator',
                type: 'guide'
            });

            // Clear drafts on success
            localStorage.removeItem('guide_draft_subject');
            localStorage.removeItem('guide_draft_topic');

        } catch (err) {
            toastError(err instanceof Error ? err.message : 'An error occurred during generation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/study-guides')}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-semibold"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Library
            </button>

            <Card className="bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-slate-900 border-primary/20">
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <GuideIcon />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">AI Guide Generator</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
                        Create expert-level study guides for any topic in seconds.
                        Powered by AI trained on educational materials.
                    </p>
                </div>

                <form onSubmit={handleGenerate} className="p-8 pt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">SUBJECT</label>
                            <input
                                value={subject}
                                onChange={(e) => updateSubject(e.target.value)}
                                placeholder="e.g. Chemistry"
                                className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary focus:ring-0 transition-all outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">TOPIC / THEME</label>
                            <input
                                value={topic}
                                onChange={(e) => updateTopic(e.target.value)}
                                placeholder="e.g. Periodic Table"
                                className="w-full p-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 focus:border-primary focus:ring-0 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Crafting your guide...
                            </>
                        ) : (
                            'Generate Master Guide'
                        )}
                    </button>

                    {user?.subscription === 'pro' && (
                        <p className="text-center text-xs text-slate-500 font-medium">
                            Remaining AI Credits: <span className="text-primary font-bold">{user.aiCredits}</span>
                        </p>
                    )}
                </form>
            </Card>

            {generatedContent && (
                <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8">
                        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4 mb-6">
                            <h2 className="text-2xl font-bold dark:text-white capitalize">{topic}</h2>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedContent);
                                    success('Copied to clipboard!');
                                }}
                                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                                Copy Content
                            </button>
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <MarkdownRenderer content={generatedContent} />
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default GuideGenerator;
