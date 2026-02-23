
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt.ts';
import Card from '../components/Card.tsx';

import { ChallengeQuestion } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import apiService from '../services/apiService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePastQuestions } from '../contexts/PastQuestionsContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';

// --- ICONS ---
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-4-4h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 4H5a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>;
const StopwatchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- CONSTANTS ---
const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 15;

// --- HELPERS ---
const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const SubjectSprintGame: React.FC = () => {
    const { user } = useAuth();
    const { addActivity } = useUserProgress();
    const { papers: allPapers, isLoading: isLoadingPapers, fetchPapers } = usePastQuestions();
    const [searchParams, setSearchParams] = useSearchParams();
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

    const [sessionId, setSessionId] = useState(`subject-sprint-${Date.now()}`);

    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | 'unanswered' | null>(null);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        fetchPapers();
    }, [fetchPapers]);

    const isAdmin = user?.role === 'admin';
    const allSubjectsFromPapers = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);

    // For non-admins: show only their preferred subjects + compulsory English
    const availableSubjects = useMemo(() => {
        if (isAdmin || !user?.preferredSubjects?.length) return allSubjectsFromPapers;
        return allSubjectsFromPapers.filter(s =>
            user.preferredSubjects!.includes(s) ||
            ['english', 'english language', 'use of english'].includes(s.toLowerCase())
        );
    }, [allSubjectsFromPapers, isAdmin, user?.preferredSubjects]);
    const isLoading = isLoadingPapers || isLoadingLeaderboard;

    const handleGameOver = async (finalScore: number) => {
        setGameState('results');
        try {
            addActivity({
                id: sessionId,
                title: 'Subject Sprint',
                path: '/games/subject-sprint',
                type: 'game',
                score: finalScore,
                subtitle: `${questions[0]?.subject || 'Multiple Subjects'} • ${QUESTIONS_PER_GAME} Questions`
            });
            await apiService('/data/leaderboard', {
                method: 'POST',
                body: {
                    name: user?.name || 'Anonymous',
                    score: finalScore,
                    totalQuestions: QUESTIONS_PER_GAME,
                    answers: userAnswers,
                    game: 'Subject Sprint',
                    date: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("Failed to post score to leaderboard:", error);
        }
    };

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(TIME_PER_QUESTION);
            setEndTime(Date.now() + (TIME_PER_QUESTION * 1000));
            setSelectedAnswer(null);
            setAnswerStatus(null);
        } else {
            handleGameOver(score);
        }
    };

    // Timestamp-based Timer Logic
    const [endTime, setEndTime] = useState<number | null>(null);

    useEffect(() => {
        if (gameState !== 'playing' || answerStatus) return;

        // If no endTime set but we are playing, set it (e.g. on mount/restore)
        if (!endTime) {
            setEndTime(Date.now() + (timeLeft * 1000));
            return;
        }

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                setAnswerStatus('unanswered');
                // Auto-advance is handled by effect or timeout, but we need to trigger it
            }
        }, 200); // Check more frequently for smooth UI

        // Sync immediately
        const immediateRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
        if (immediateRemaining !== timeLeft) {
            setTimeLeft(immediateRemaining);
        }

        return () => clearInterval(timer);
    }, [gameState, endTime, answerStatus, timeLeft]);

    // Handle Time Run Out specifically to trigger next question
    useEffect(() => {
        if (timeLeft === 0 && !answerStatus && gameState === 'playing') {
            setAnswerStatus('unanswered');
            const timeout = setTimeout(goToNextQuestion, 2000);
            return () => clearTimeout(timeout);
        }
    }, [timeLeft, answerStatus, gameState]);


    const startGame = (subject: string) => {
        const subjectQuestions = allPapers
            .filter(p => p.subject === subject)
            .flatMap(paper => paper.questions.map((q: any) => ({ ...q, subject })));

        const gameQuestions = shuffleArray(subjectQuestions).slice(0, QUESTIONS_PER_GAME);
        setQuestions(gameQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setUserAnswers({});
        setEndTime(null);
        setSelectedAnswer(null);
        setAnswerStatus(null);
        setGameState('playing');
        setEndTime(Date.now() + (TIME_PER_QUESTION * 1000));
    };

    const handleAnswerSelect = (optionKey: string) => {
        if (answerStatus) return;

        setSelectedAnswer(optionKey);
        const currentQuestion = questions[currentQuestionIndex];

        // Track the answer
        setUserAnswers(prev => ({ ...prev, [currentQuestion.id]: optionKey }));

        const isCorrect = optionKey === currentQuestion.answer;

        if (isCorrect) {
            setAnswerStatus('correct');
            setScore(prev => prev + 50 + (timeLeft * 10));
        } else {
            setAnswerStatus('incorrect');
        }

        setTimeout(goToNextQuestion, 2000);
    };

    const restartGame = () => {
        // usePrompt handles blocking during 'playing' state
        setSessionId(`subject-sprint-${Date.now()}`);
        setGameState('selection');
        setSearchParams({}, { replace: true });
    };

    // Sync game state with URL for back button support
    useEffect(() => {
        if (gameState === 'playing') {
            if (searchParams.get('playing') !== 'true') {
                setSearchParams({ playing: 'true' }, { replace: true });
            }
        } else {
            if (searchParams.get('playing') === 'true') {
                setSearchParams({}, { replace: true });
            }
        }
    }, [gameState, searchParams, setSearchParams]);

    // Handle back button specifically
    useEffect(() => {
        if (searchParams.get('playing') !== 'true' && gameState === 'playing') {
            // User clicked back button - reset to selection
            setGameState('selection');
        }
    }, [searchParams]);

    // Unified navigation guard
    usePrompt(gameState === 'playing', 'Are you sure you want to leave this game? Your progress will be lost.');

    const renderSelectionScreen = () => (
        <Card className="text-center p-6">
            <StopwatchIcon />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Subject Sprint</h1>
            <p className="text-slate-600 mt-2 mb-6 max-w-md mx-auto">Choose a subject and answer {QUESTIONS_PER_GAME} questions as fast as you can. The quicker you answer correctly, the more points you get!</p>

            {isLoading ? <p>Loading subjects...</p> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableSubjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => startGame(subject)}
                            className={`p-4 bg-white border-2 rounded-lg font-semibold text-slate-700 hover:border-primary hover:bg-primary-light hover:text-primary transition-all duration-200 ${user?.preferredSubjects?.includes(subject) ? 'border-primary bg-primary-light/30' : 'border-gray-200'
                                }`}
                        >
                            {subject}
                            {user?.preferredSubjects?.includes(subject) && (
                                <span className="block text-[10px] text-primary mt-1">⭐ Target Subject</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </Card>
    );

    const renderPlayingScreen = () => {
        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion) return null;

        return (
            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-semibold text-slate-600">{currentQuestion.subject} - Question {currentQuestionIndex + 1}/{questions.length}</div>
                        <div className="text-lg font-bold text-primary">Score: {score}</div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / TIME_PER_QUESTION) * 100}%` }}
                        ></div>
                    </div>

                    <div className="min-h-[6rem] text-xl font-semibold text-slate-800 mb-6">
                        <MarkdownRenderer content={currentQuestion.question} />
                    </div>

                    <div className="space-y-3">
                        {Object.keys(currentQuestion.options).map(key => {
                            const value = currentQuestion.options[key];
                            const isSelected = selectedAnswer === key;
                            const isCorrect = currentQuestion.answer === key;

                            let buttonClass = 'bg-white border-gray-200 hover:bg-gray-50';
                            if (answerStatus) {
                                if (isCorrect) {
                                    buttonClass = 'bg-green-100 border-green-500 text-green-800 animate-pulse-success';
                                } else if (isSelected) {
                                    buttonClass = 'bg-red-100 border-red-500 text-red-800';
                                }
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleAnswerSelect(key)}
                                    disabled={!!answerStatus}
                                    className={`w-full text-left p-3 rounded-lg border-2 flex items-start gap-3 transition-all duration-200 disabled:cursor-not-allowed ${buttonClass}`}
                                >
                                    <span className="font-bold">{key}.</span>
                                    <div className="flex-1">
                                        <MarkdownRenderer content={value.text} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Card>
        );
    };

    const renderResultsScreen = () => {
        const correctAnswers = questions.filter(q => {
            // This is tricky because we don't store the user's answers. 
            // We'll have to infer from score, which is imperfect.
            // A better approach would be to store answers. Let's assume for now we just show score.
        }).length;

        return (
            <Card className="text-center p-8">
                <TrophyIcon />
                <h1 className="text-3xl font-bold text-slate-800 mt-4">Sprint Complete!</h1>
                <p className="text-slate-600 mt-2">Your final score is:</p>
                <p className="text-7xl font-extrabold text-primary my-6">{score}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={restartGame} className="font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light transition-colors">
                        Play Another Subject
                    </button>
                    <Link to="/games" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                        Back to Games
                    </Link>
                </div>
            </Card>
        );
    };


    return (
        <div className="max-w-4xl mx-auto">
            {gameState === 'selection' && renderSelectionScreen()}
            {gameState === 'playing' && renderPlayingScreen()}
            {gameState === 'results' && renderResultsScreen()}
        </div>
    );
};

export default SubjectSprintGame;
