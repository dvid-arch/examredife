import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { ChallengeQuestion } from '../../types.ts';

const TopicPracticeSetup: React.FC = () => {
    const { subject, topicSlug } = useParams<{ subject: string, topicSlug: string }>();
    const navigate = useNavigate();
    const topicName = topicSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const [questionCount, setQuestionCount] = useState(10);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableQuestions, setAvailableQuestions] = useState<ChallengeQuestion[]>([]);

    useEffect(() => {
        const fetchQuestions = async () => {
            if (!topicName || !subject) return;
            setIsLoading(true);
            try {
                // 1. Get semantic keywords from AI
                const { keywords } = await apiService<{ keywords: string[] }>('/ai/topic-keywords', {
                    method: 'POST',
                    body: { topic: topicName, subject }
                });

                // 2. Perform batch search with these keywords
                const results = await apiService<ChallengeQuestion[]>('/data/search-batch', {
                    method: 'POST',
                    body: { keywords: keywords || [topicName], subject }
                });

                setAvailableQuestions(results);
            } catch (err) {
                console.error("Failed to fetch questions for topic:", err);
                setError('Failed to load questions for this topic.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [topicName, subject]);

    const handleStart = () => {
        if (availableQuestions.length === 0) return;

        // Shuffle and slice to get the desired count
        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, Math.min(questionCount, shuffled.length));

        sessionStorage.removeItem('practiceExited');
        sessionStorage.removeItem('practiceCompleted');

        navigate('/take-examination', {
            state: {
                questions: selectedQuestions,
                examTitle: `${topicName} Test`,
                isTopicTest: true,
                topicName: topicName,
                timestamp: Date.now(),
            },
        });

        sessionStorage.setItem('practiceStarted', 'true');
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <Link to="/study-guides" className="hover:text-primary transition-colors">Library</Link>
                <span>/</span>
                <Link to={`/study-guides/${subject?.toLowerCase()}`} className="hover:text-primary transition-colors capitalize">{subject}</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-white font-medium">{topicName}</span>
            </div>

            <Card className="overflow-hidden">
                <div className="bg-primary/10 p-8 text-center border-b border-primary/20">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                        📝
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">{topicName} Test</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Test your knowledge on this specific topic with real past questions.</p>
                </div>

                <div className="p-8 space-y-8">
                    {isLoading ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">Scanning past papers for relevant questions...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center">
                            <p className="text-red-700 dark:text-red-400">{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 text-primary font-bold hover:underline">Try Again</button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 text-center">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">How many questions?</h2>
                                <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <input
                                        type="range"
                                        min="5"
                                        max={Math.min(30, availableQuestions.length)}
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="bg-primary text-white text-2xl font-black rounded-xl px-4 py-2 min-w-[4rem] shadow-md">
                                        {questionCount}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                                    {availableQuestions.length} relevant questions found in the archive.
                                </p>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleStart}
                                    disabled={availableQuestions.length === 0}
                                    className="w-full bg-primary text-white font-black py-5 px-8 rounded-2xl text-xl hover:bg-accent transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {availableQuestions.length === 0 ? 'No Questions Found' : 'Start Topic Test'}
                                </button>
                                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                                    Your results will be tracked in the Performance section under this topic.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default TopicPracticeSetup;
