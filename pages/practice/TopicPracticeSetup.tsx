import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { ChallengeQuestion, StudyGuide } from '../../types.ts';

const TopicPracticeSetup: React.FC = () => {
    const { subject, topicSlug } = useParams<{ subject: string, topicSlug: string }>();
    const navigate = useNavigate();

    const [displayTitle, setDisplayTitle] = useState(topicSlug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || '');
    const [questionCount, setQuestionCount] = useState(10);
    const [mode, setMode] = useState<'study' | 'practice' | 'mock'>('practice');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableQuestions, setAvailableQuestions] = useState<ChallengeQuestion[]>([]);

    useEffect(() => {
        const fetchContentAndQuestions = async () => {
            if (!topicSlug || !subject) return;
            setIsLoading(true);
            try {
                // 1. Fetch guide to get keywords for topic
                const guides = await apiService<StudyGuide[]>('/data/guides');
                const guide = guides.find(g => g.id.toLowerCase() === subject.toLowerCase());
                const topic = guide?.topics.find(t => t.id === topicSlug);

                let searchTopic = topic?.title || displayTitle;
                let currentTitle = topic?.title || displayTitle;

                setDisplayTitle(currentTitle);

                // 2. Search for questions
                console.log("Searching for questions for topic:", searchTopic);
                const results = await apiService<ChallengeQuestion[]>('/data/search-by-topic', {
                    method: 'POST',
                    body: {
                        subject,
                        topic: searchTopic
                    }
                });

                if (results.length === 0) {
                    setError('No specific questions found for this section yet. We are constantly updating our database!');
                }

                setAvailableQuestions(results);
            } catch (err) {
                console.error("Failed to fetch content/questions:", err);
                setError('Failed to load questions.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContentAndQuestions();
    }, [topicSlug, subject]);

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
                examTitle: `${displayTitle} Mastery Test`,
                isTopicTest: true,
                topicName: displayTitle,
                topicId: topicSlug,
                mode: mode,
                timestamp: Date.now(),
            },
            replace: true
        });

        sessionStorage.setItem('practiceStarted', 'true');
    };

    const modes = [
        {
            id: 'study',
            name: 'Study',
            icon: '📖',
            description: 'No timing, just show and hide answer for each question.'
        },
        {
            id: 'practice',
            name: 'Practice',
            icon: '🎯',
            description: 'Get timed, view result and get corrections.'
        },
        {
            id: 'mock',
            name: 'Mock',
            icon: '⌛',
            description: 'Get timed and view result with no corrections.'
        }
    ] as const;

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                <Link to="/study-guides" className="hover:text-primary transition-colors">Library</Link>
                <span>/</span>
                <Link to={`/study-guides/${subject?.toLowerCase()}`} className="hover:text-primary transition-colors capitalize">{subject}</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-white font-medium">{displayTitle}</span>
            </div>

            <Card className="overflow-hidden">
                <div className="bg-primary/10 p-8 text-center border-b border-primary/20">
                    <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
                        📝
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white capitalize">{displayTitle} Mastery Test</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">Test your knowledge on this syllabus topic with real past questions.</p>
                </div>

                <div className="p-8 space-y-10">
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
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-600 flex items-center justify-center text-sm">1</span>
                                    Question Count
                                </h2>
                                <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <input
                                        type="range"
                                        min="5"
                                        max={Math.min(subject === 'English' ? 100 : 50, availableQuestions.length)}
                                        step="5"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="bg-primary text-white text-2xl font-black rounded-xl px-4 py-2 min-w-[4rem] shadow-md text-center">
                                        {questionCount}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center">
                                    {availableQuestions.length} relevant questions found in the archive.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 flex items-center justify-center text-sm">2</span>
                                    Choose Mode
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {modes.map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMode(m.id)}
                                            className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${mode === m.id
                                                ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                                                : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl">{m.icon}</span>
                                                {mode === m.id && (
                                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white">{m.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                                                {m.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6">
                                <button
                                    onClick={handleStart}
                                    disabled={availableQuestions.length === 0}
                                    className="w-full bg-primary text-white font-black py-5 px-8 rounded-2xl text-xl hover:bg-accent transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] disabled:bg-slate-300 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {availableQuestions.length === 0 ? 'No Questions Found' : `Start ${mode.charAt(0).toUpperCase() + mode.slice(1)} Test`}
                                </button>
                                <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
                                    Your results will be tracked in the Performance section.
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
