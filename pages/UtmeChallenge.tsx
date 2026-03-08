import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt.ts';
import Card from '../components/Card.tsx';
import { LeaderboardScore, ChallengeQuestion, PastPaper } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePastQuestions } from '../contexts/PastQuestionsContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import useSEO from '../hooks/useSEO.ts';

import apiService from '../services/apiService.ts';


// --- ICONS ---
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const RefreshIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

// --- CONSTANTS ---
const CHALLENGE_DURATION_MINUTES = 30;
const QUESTIONS_PER_SUBJECT = 5;
const TOTAL_SUBJECTS = 4;
const TOTAL_QUESTIONS = QUESTIONS_PER_SUBJECT * TOTAL_SUBJECTS;

// --- HELPERS ---
const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const prepareChallengeQuestions = (allPapers: PastPaper[], subjects: string[]): ChallengeQuestion[] => {
    let challengeQuestions: ChallengeQuestion[] = [];
    subjects.forEach(subject => {
        const questionsForSubject = allPapers
            .filter(paper => paper.subject === subject)
            .flatMap(paper => paper.questions.map(q => ({ ...q, subject })));

        const shuffled = shuffleArray(questionsForSubject);
        challengeQuestions.push(...shuffled.slice(0, QUESTIONS_PER_SUBJECT));
    });
    return shuffleArray(challengeQuestions);
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

// --- MAIN COMPONENT ---
const UtmeChallenge: React.FC = () => {
    type GameState = 'lobby' | 'selecting' | 'playing' | 'results' | 'reviewing';

    const { isAuthenticated, user, requestLogin, requestUpgrade } = useAuth();
    const navigate = useNavigate();
    const { papers: allPapers, isLoading: isLoadingPapers, fetchPapers } = usePastQuestions();
    const [searchParams, setSearchParams] = useSearchParams();
    const { addActivity } = useUserProgress();
    const [gameState, setGameState] = useState<GameState>(
        (searchParams.get('step') as GameState) || 'lobby'
    );

    useSEO({
        title: "UTME Challenge",
        description: "Compete with others in a simulated UTME environment on the national leaderboard."
    });
    const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [finalScore, setFinalScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION_MINUTES * 60);
    const [scoreSaved, setScoreSaved] = useState(false);

    const sessionId = useMemo(() => {
        // Since challenge is always a fresh start from lobby, we can use a timestamp
        // But if we are already 'playing', we should keep the same ID for updates
        return `utme-challenge-${Date.now()}`;
    }, [gameState === 'playing']); // Re-generate if we transition to playing from lobby/selecting

    // Track activity when playing starts
    useEffect(() => {
        if (gameState === 'playing' && questions.length > 0) {
            addActivity({
                id: sessionId,
                title: 'UTME Challenge',
                subtitle: `${selectedSubjects.join(', ')} • 20 Questions`,
                path: '/challenge?step=playing',
                type: 'quiz',
                progress: Math.round((Object.keys(userAnswers).length / questions.length) * 100),
                state: { sessionId, selectedSubjects, questions, userAnswers, mode: 'mock' } // For resumption
            });
        }
    }, [gameState, questions.length, selectedSubjects, addActivity, userAnswers]);

    const fetchLeaderboard = useCallback(async () => {
        setIsLoadingLeaderboard(true);
        try {
            const leaderboardData = await apiService<LeaderboardScore[]>('/data/leaderboard');
            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error("Failed to fetch leaderboard", error);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboard();
        fetchPapers();
    }, [fetchLeaderboard, fetchPapers]);

    const isLoadingData = isLoadingPapers || isLoadingLeaderboard;

    const isAdmin = user?.role === 'admin';
    const allSubjectsFromPapers = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);

    // For non-admins: restrict to their 4 preferred subjects + compulsory English
    const availableSubjects = useMemo(() => {
        if (isAdmin || !user?.preferredSubjects?.length) return allSubjectsFromPapers;
        return allSubjectsFromPapers.filter(s =>
            user.preferredSubjects!.includes(s) ||
            ['english', 'english language', 'use of english'].includes(s.toLowerCase())
        );
    }, [allSubjectsFromPapers, isAdmin, user?.preferredSubjects]);

    const saveScoreToLeaderboard = useCallback(async (currentScore: number, answers: any) => {
        if (!isAuthenticated || !user) return;

        if (user.subscription === 'free') {
            requestUpgrade({
                title: "Join the Leaderboard!",
                message: "Want to save your score and compete with other students? Upgrade to ExamRedi Pro.",
                featureList: [
                    "Save your UTME Challenge high scores",
                    "See your name on the leaderboard",
                    "Track your ranking over time",
                    "Unlock all Pro features"
                ]
            });
            return;
        }

        const newScore = {
            name: user.name,
            score: currentScore,
            totalQuestions: TOTAL_QUESTIONS,
            answers: answers,
            date: Date.now(),
        };

        try {
            const updatedLeaderboard = await apiService<LeaderboardScore[]>('/data/leaderboard', { method: 'POST', body: newScore });
            setLeaderboard(updatedLeaderboard);
            setScoreSaved(true);
        } catch (error) {
            console.error("Failed to save score:", error);
        }
    }, [isAuthenticated, user, requestUpgrade]);

    const handleSubmit = useCallback(() => {
        if (gameState !== 'playing') return;
        let score = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.answer) {
                score++;
            }
        });
        setFinalScore(score);
        setGameState('results');

        // Auto-save for pro users
        if (isAuthenticated && user?.subscription === 'pro') {
            saveScoreToLeaderboard(score, userAnswers);
        }

        // Final journey update
        addActivity({
            id: sessionId,
            title: 'UTME Challenge',
            subtitle: `${selectedSubjects.join(', ')} • 20 Questions`,
            path: '/challenge',
            type: 'quiz',
            score: score,
            maxScore: questions.length,
            progress: 100,
            state: { sessionId, isRetake: true, mode: 'mock' }
        });
    }, [gameState, questions, userAnswers, isAuthenticated, user, saveScoreToLeaderboard, addActivity, selectedSubjects, sessionId]);

    // Refs for unmount auto-submission
    const handleSubmitRef = React.useRef(handleSubmit);
    const gameStateRef = React.useRef(gameState);
    const questionsRef = React.useRef(questions);
    const userAnswersRef = React.useRef(userAnswers);

    useEffect(() => {
        handleSubmitRef.current = handleSubmit;
        gameStateRef.current = gameState;
        questionsRef.current = questions;
        userAnswersRef.current = userAnswers;
    }, [handleSubmit, gameState, questions, userAnswers]);

    // Auto-submit on departure/unmount
    useEffect(() => {
        return () => {
            // Auto-submit even if no questions answered (Activity Feed requirement)
            if (gameStateRef.current === 'playing' && questionsRef.current.length > 0) {
                console.log("Auto-submitting challenge due to navigation away...");
                handleSubmitRef.current();
            }
        };
    }, []);

    // Timestamp-based Timer Logic
    const [endTime, setEndTime] = useState<number | null>(null);

    // Initialize/Reset Timer
    useEffect(() => {
        if (gameState === 'playing' && !endTime) {
            // 30 minutes for the challenge
            setEndTime(Date.now() + (CHALLENGE_DURATION_MINUTES * 60 * 1000));
        } else if (gameState !== 'playing') {
            setEndTime(null);
        }
    }, [gameState, endTime]);

    useEffect(() => {
        if (gameState === 'playing' && endTime) {
            const timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

                setTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                }
            }, 1000);

            // Immediate update
            setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

            return () => clearInterval(timer);
        }
    }, [gameState, endTime, handleSubmit]);

    const handleStartSelection = () => {
        setSearchParams({ step: 'selecting' }, { replace: true });
        setGameState('selecting');
    };

    const handleSubjectToggle = (subject: string) => {
        setSelectedSubjects(prev => {
            if (prev.includes(subject)) {
                return prev.filter(s => s !== subject);
            }
            if (prev.length < TOTAL_SUBJECTS) {
                return [...prev, subject];
            }
            return prev;
        });
    };

    const handleStartChallenge = () => {
        const preparedQuestions = prepareChallengeQuestions(allPapers, selectedSubjects);
        if (preparedQuestions.length < TOTAL_QUESTIONS) {
            alert("Not enough questions available for the selected subjects. Please try another combination.");
            return;
        }
        setQuestions(preparedQuestions);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setTimeLeft(CHALLENGE_DURATION_MINUTES * 60);
        setEndTime(null); // Will trigger new start
        setScoreSaved(false);
        setSearchParams({ step: 'playing' }, { replace: true });
        setGameState('playing');
    };

    const handleSelectOption = (questionId: string, optionKey: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    };


    const handleSaveScoreClick = (e: React.FormEvent) => {
        e.preventDefault();
        saveScoreToLeaderboard(finalScore, userAnswers);
    };


    const resetGame = () => {
        // usePrompt handles the blocking logic during 'playing' state
        setSelectedSubjects([]);
        setSearchParams({}, { replace: true });
        setGameState('lobby');
    };

    // Sync gameState with URL for back button support
    useEffect(() => {
        const urlStep = searchParams.get('step') as GameState || 'lobby';
        if (urlStep !== gameState) {
            setGameState(urlStep);
        }
    }, [searchParams]);

    // Unified navigation guard
    usePrompt(gameState === 'playing', 'Are you sure you want to leave this challenge? Your progress will be lost.');

    const scoreBySubject = useMemo(() => {
        return selectedSubjects.map(subject => {
            const subjectQuestions = questions.filter(q => q.subject === subject);
            const correct = subjectQuestions.filter(q => userAnswers[q.id] === q.answer).length;
            return { subject, score: correct, total: subjectQuestions.length };
        });
    }, [questions, userAnswers, selectedSubjects]);

    // --- GATING LOGIC ---
    if (!isLoadingData && !isAuthenticated) {
        return (
            <Card className="text-center p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto">
                <div className="mb-6">
                    <TrophyIcon />
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-4 mb-2">UTME Challenge</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Join the elite competition! Sign in to participate in the UTME Challenge and rank on the leaderboard.
                    </p>
                </div>
                <button
                    onClick={requestLogin}
                    className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-accent transition-colors mb-4 w-full"
                >
                    Sign In to Play
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account? <button onClick={requestLogin} className="text-primary hover:underline font-semibold">Join ExamRedi</button>
                </p>
            </Card>
        );
    }

    if (!isLoadingData && user?.subscription === 'free') {
        return (
            <Card className="text-center p-8 flex flex-col items-center justify-center h-full max-w-lg mx-auto">
                <div className="bg-yellow-50 text-yellow-600 rounded-full p-4 inline-block mb-6">
                    <TrophyIcon />
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">ExamRedi Pro Feature</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6 text-lg">
                    The <strong>UTME Challenge</strong> is an exclusive competition for our Pro members. Face the clock, prove your knowledge, and win your spot on the national leaderboard.
                </p>
                <button
                    onClick={() => requestUpgrade({
                        title: "Unlock UTME Challenge",
                        message: "Get access to the most realistic exam simulation and compete with students across the country.",
                        featureList: [
                            "Unlimited UTME Challenge Attempts",
                            "Secure Leaderboard Verification",
                            "Detailed Performance Analytics",
                            "Full Exam History Tracking"
                        ]
                    })}
                    className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors w-full"
                >
                    Upgrade to Pro
                </button>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-slate-500 hover:text-primary font-medium">
                    Back to Dashboard
                </button>
            </Card>
        );
    }

    // --- RENDER FUNCTIONS ---

    const renderLobby = () => (
        <div className="space-y-6">
            <Card className="text-center">
                <TrophyIcon />
                <h1 className="text-4xl font-bold text-slate-800 mt-4">UTME Challenge</h1>
                <p className="text-slate-600 mt-2">Test your knowledge against the clock in a simulated exam environment.</p>
                <button onClick={handleStartSelection} className="mt-6 w-full md:w-1/2 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition">
                    Start New Challenge
                </button>
            </Card>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">Top Scores</h2>
                    <button
                        onClick={fetchLeaderboard}
                        disabled={isLoadingLeaderboard}
                        className="p-2 text-primary hover:bg-primary-light rounded-full transition-colors disabled:opacity-50"
                        title="Refresh Leaderboard"
                    >
                        <RefreshIcon className={isLoadingLeaderboard ? 'animate-spin' : ''} />
                    </button>
                </div>
                {isLoadingData ? <p>Loading leaderboard...</p> : leaderboard.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-2">
                        {leaderboard.map((entry, index) => (
                            <li key={index} className="p-2 rounded-lg bg-gray-50 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-slate-700">{index + 1}. {entry.name}</span>
                                    <span className="text-sm text-slate-500 ml-2">({new Date(entry.date).toLocaleDateString()})</span>
                                </div>
                                <span className="font-bold text-primary">{entry.score}/{entry.totalQuestions}</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-slate-500 text-center py-4">No scores yet. Be the first!</p>
                )}
            </Card>
        </div>
    );

    const renderSubjectSelection = () => (
        <Card className="text-center">
            <h1 className="text-3xl font-bold text-slate-800">Select {TOTAL_SUBJECTS} Subjects</h1>
            <p className="text-slate-600 mt-2 mb-6">Choose the subjects you want to be tested on.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {availableSubjects.map(subject => (
                    <label key={subject} className={`p-3 border-2 rounded-lg cursor-pointer font-semibold transition-colors ${selectedSubjects.includes(subject) ? 'bg-primary-light border-primary text-primary' : 'bg-white border-gray-200 hover:border-primary-light'}`}>
                        <input type="checkbox" className="sr-only" onChange={() => handleSubjectToggle(subject)} checked={selectedSubjects.includes(subject)} />
                        {subject}
                    </label>
                ))}
            </div>
            <button onClick={handleStartChallenge} disabled={selectedSubjects.length !== TOTAL_SUBJECTS} className="w-full md:w-1/2 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                {`Begin Challenge (${selectedSubjects.length}/${TOTAL_SUBJECTS})`}
            </button>
        </Card>
    );

    const renderQuiz = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return <p>Loading questions...</p>;

        return (
            <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
                <div className="bg-white p-3 border-b shadow-sm rounded-t-lg flex justify-between items-center">
                    <h2 className="font-bold text-lg text-primary">UTME Challenge</h2>
                    <div className="flex items-center bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full"><ClockIcon /> {formatTime(timeLeft)}</div>
                </div>

                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
                    <p className="font-semibold text-slate-700 mb-2">Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS} <span className="text-sm text-slate-500">({currentQuestion.subject})</span></p>
                    <QuestionRenderer
                        question={currentQuestion}
                        className="text-lg text-slate-800 mb-4"
                    />
                    <div className="space-y-3">
                        {Object.keys(currentQuestion.options).map((key) => {
                            const value = currentQuestion.options[key];
                            return (
                                <div key={key} onClick={() => handleSelectOption(currentQuestion.id, key)} className={`p-3 rounded-lg border-2 flex items-start gap-3 transition-all cursor-pointer ${userAnswers[currentQuestion.id] === key ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold">{key}.</span>
                                            <div><MarkdownRenderer content={value.text} /></div>
                                        </div>
                                        {value.diagram && (
                                            <div className="mt-3 pl-6">
                                                <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-xs h-auto rounded-md border bg-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="bg-white p-4 border-t shadow-inner rounded-b-lg">
                    <div className="flex justify-between items-center">
                        <button onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="font-semibold py-2 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Previous</button>
                        <button onClick={handleSubmit} className="bg-primary text-white font-bold py-2 px-8 rounded-lg hover:bg-green-700">Submit</button>
                        <button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1} className="font-semibold py-2 px-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        )
    };

    const renderResults = () => {
        return (
            <div className="space-y-6">
                <Card className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Challenge Complete!</h1>
                    <p className="text-slate-600">Your Score:</p>
                    <p className="text-6xl font-extrabold text-primary my-4">{finalScore} <span className="text-4xl text-slate-500">/ {TOTAL_QUESTIONS}</span></p>

                    {isAuthenticated && !scoreSaved && (
                        <button onClick={handleSaveScoreClick} className="bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500">
                            {user?.subscription === 'pro' ? `Save Score as ${user.name}` : 'Save Score (Pro Only)'}
                        </button>
                    )}
                    {scoreSaved && <p className="text-green-600 font-semibold mt-4">Your score has been saved!</p>}
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Performance Breakdown</h2>
                    <div className="space-y-4">
                        {scoreBySubject.map(({ subject, score, total }) => (
                            <div key={subject}>
                                <div className="flex justify-between mb-1 font-semibold">
                                    <span className="text-slate-700">{subject}</span>
                                    <span className="text-primary">{score} / {total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-primary h-4 rounded-full" style={{ width: `${(score / total) * 100}%` }}></div></div>
                            </div>
                        ))}
                    </div>
                </Card>
                <div className="flex justify-center gap-4">
                    <button onClick={() => {
                        setSearchParams({ step: 'reviewing' }, { replace: true });
                        setGameState('reviewing');
                    }} className="font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light">Review Answers</button>
                    <button onClick={resetGame} className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700">Play Again</button>
                </div>
            </div>
        );
    };

    const renderReview = () => {
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div className="flex flex-col h-full max-h-[calc(100vh-120px)]">
                <div className="bg-white p-3 border-b shadow-sm rounded-t-lg flex justify-between items-center">
                    <h2 className="font-bold text-lg text-primary">Reviewing Answers</h2>
                    <button onClick={() => {
                        setSearchParams({ step: 'results' }, { replace: true });
                        setGameState('results');
                    }} className="flex items-center gap-2 font-semibold text-slate-600 hover:text-primary"><BackArrowIcon /> Back to Results</button>
                </div>
                <div className="flex-1 bg-gray-50 p-4 overflow-y-auto">
                    <p className="font-semibold text-slate-700 mb-2">Question {currentQuestionIndex + 1}/{TOTAL_QUESTIONS}</p>
                    <QuestionRenderer
                        question={currentQuestion}
                        className="text-lg text-slate-800 mb-4"
                    />
                    <div className="space-y-3">
                        {Object.keys(currentQuestion.options).map((key) => {
                            const value = currentQuestion.options[key];
                            const isSelected = userAnswers[currentQuestion.id] === key;
                            const isCorrect = key === currentQuestion.answer;
                            let optionClass = 'border-gray-300 bg-white';
                            if (isCorrect) optionClass = 'border-green-500 bg-green-100';
                            else if (isSelected) optionClass = 'border-red-500 bg-red-100';

                            return (
                                <div key={key} className={`p-3 rounded-lg border-2 flex items-start gap-3 transition-all cursor-default ${optionClass}`}>
                                    <div className="flex-1">
                                        <div className="flex items-start gap-2">
                                            <span className="font-bold">{key}.</span>
                                            <div><MarkdownRenderer content={value.text} /></div>
                                        </div>
                                        {value.diagram && (
                                            <div className="mt-3 pl-6">
                                                <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-xs h-auto rounded-md border bg-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="bg-white p-4 border-t shadow-inner rounded-b-lg flex justify-between items-center">
                    <button onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="font-semibold py-2 px-6 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Previous</button>
                    <button onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))} disabled={currentQuestionIndex === questions.length - 1} className="font-semibold py-2 px-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50">Next</button>
                </div>
            </div>
        );
    };

    switch (gameState) {
        case 'selecting': return renderSubjectSelection();
        case 'playing': return renderQuiz();
        case 'results': return renderResults();
        case 'reviewing': return renderReview();
        case 'lobby':
        default: return renderLobby();
    }
};

export default UtmeChallenge;