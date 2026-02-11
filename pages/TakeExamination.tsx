import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt.ts';
import { ChallengeQuestion, QuizResult, PastPaper } from '../types.ts';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';

import apiService from '../services/apiService.ts';


const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const GUEST_QUESTION_LIMIT = 5;

const preparePracticeQuestions = (allPapers: PastPaper[], selections: { subject: string, year: 'random' | number }[], questionsPerSubject: number): ChallengeQuestion[] => {
    if (!selections || selections.length === 0) return [];

    const sortedSelections = [...selections].sort((a, b) => {
        if (a.subject === 'English') return -1;
        if (b.subject === 'English') return 1;
        return a.subject.localeCompare(b.subject);
    });

    let allQuestions: ChallengeQuestion[] = [];

    sortedSelections.forEach(({ subject, year }) => {
        let papersForSubject = allPapers.filter(paper => paper.subject === subject);

        if (year !== 'random') {
            papersForSubject = papersForSubject.filter(paper => paper.year === year);
            // Fallback: If no papers for specific year, use all papers for that subject
            // This prevents subjects from disappearing if the year is missing
            if (papersForSubject.length === 0) {
                papersForSubject = allPapers.filter(paper => paper.subject === subject);
            }
        }

        const questionsForSubject = papersForSubject
            .flatMap(paper => paper.questions)
            .map(q => ({ ...q, subject }));

        const shuffled = shuffleArray(questionsForSubject);
        allQuestions.push(...shuffled.slice(0, questionsPerSubject));
    });

    return allQuestions;
};

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};


const TakeExamination: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, requestLogin } = useAuth();
    const { showInstallBanner } = usePwaInstall();
    const { addActivity } = useUserProgress();

    // Validate that the route was accessed properly with required state
    const validatePracticeState = (state: any) => {
        if (!state) return false;

        // Check if state is too old
        const now = Date.now();
        const stateTimestamp = state.timestamp || 0;
        if (now - stateTimestamp > 5 * 60 * 1000) return false; // 5 minutes

        // Check for standard mode state
        if (state.subjects && Array.isArray(state.subjects) && state.subjects.length > 0) {
            return typeof state.year !== 'undefined' && typeof state.examTitle === 'string';
        }

        // Check for custom mode state
        if (state.selections && Array.isArray(state.selections) && state.selections.length > 0) {
            return typeof state.questionsPerSubject === 'number' && typeof state.examTitle === 'string';
        }

        return false;
    };

    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [activeSubject, setActiveSubject] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAnswer, setShowAnswer] = useState(false);

    const mode = location.state?.mode || 'practice';

    // Load answers from sessionStorage on mount
    useEffect(() => {
        const savedAnswers = sessionStorage.getItem('practiceAnswers');

        if (savedAnswers) {
            try {
                const parsed = JSON.parse(savedAnswers);
                setUserAnswers(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse saved answers", e);
            }
        }
    }, []);

    // Save answers to sessionStorage whenever they change
    useEffect(() => {
        if (Object.keys(userAnswers).length > 0) {
            sessionStorage.setItem('practiceAnswers', JSON.stringify(userAnswers));
        }
    }, [userAnswers]);

    const examTitle = location.state?.examTitle;

    // Monitor for invalid access during navigation (back/forward) or initial load
    useEffect(() => {
        // If we are finished, we are allowed to stay (to view results)
        if (isFinished) return;

        const currentIsValid =
            sessionStorage.getItem('practiceStarted') === 'true' &&
            validatePracticeState(location.state) &&
            sessionStorage.getItem('practiceExited') !== 'true' &&
            sessionStorage.getItem('practiceCompleted') !== 'true';

        if (!currentIsValid) {
            navigate('/practice', { replace: true });
        }
    }, [location.state, navigate, isFinished]);

    // Check if access is valid for rendering content
    // We re-calculate this here to gate the UI, but we allow 'isFinished' to override 'practiceCompleted' check
    const isAccessIllegal = useMemo(() => {
        if (isFinished) return false; // Authorized if finished (viewing results)

        const validState =
            sessionStorage.getItem('practiceStarted') === 'true' &&
            validatePracticeState(location.state) &&
            sessionStorage.getItem('practiceExited') !== 'true' &&
            sessionStorage.getItem('practiceCompleted') !== 'true';

        return !validState;
    }, [isFinished, location.state]);

    if (isAccessIllegal) {
        return null; // Redirect handled by effect
    }

    // Check if practice was already completed from sessionStorage
    useEffect(() => {
        if (sessionStorage.getItem('practiceCompleted') === 'true' && !isFinished) {
            navigate('/practice', { replace: true });
        }
    }, [navigate, isFinished]);

    const subjects = useMemo(() => {
        if (!questions.length) return [];
        const orderedSubjects = questions.map(q => q.subject);
        return [...new Set(orderedSubjects)];
    }, [questions]);

    const handleSubmit = useCallback(async () => {
        if (isFinished) return;

        let score = 0;
        const topicBreakdown: Record<string, { correct: number, total: number }> = {};
        const incorrectQuestions: string[] = [];

        questions.forEach(q => {
            const subjectKey = (location.state?.isTopicTest && location.state?.topicName)
                ? location.state.topicName
                : (q.subject || 'Unknown');

            if (!topicBreakdown[subjectKey]) {
                topicBreakdown[subjectKey] = { correct: 0, total: 0 };
            }
            topicBreakdown[subjectKey].total++;

            if (userAnswers[q.id] === q.answer) {
                score++;
                topicBreakdown[subjectKey].correct++;
            } else if (userAnswers[q.id] !== undefined) {
                incorrectQuestions.push(q.id);
            }
        });

        setFinalScore(score);
        setIsFinished(true);
        sessionStorage.setItem('practiceCompleted', 'true');
        sessionStorage.removeItem('practiceStarted');
        sessionStorage.removeItem('practiceEndTime');
        sessionStorage.removeItem('practiceAnswers');

        if (isAuthenticated && user) {
            if (user.subscription === 'free') {
                showInstallBanner();
            }
            const result = {
                paperId: location.state?.paperId || 'practice-session',
                exam: examTitle || 'Practice',
                subject: subjects.join(', '),
                year: location.state?.year || new Date().getFullYear(),
                score: score,
                totalQuestions: questions.length,
                userAnswers,
                topicBreakdown,
                incorrectQuestions,
                mode,
                completedAt: Date.now(),
            };
            try {
                await apiService('/data/performance', { method: 'POST', body: result });
            } catch (error) {
                console.error("Failed to save performance result:", error);
            }
        }

        // Update recent activity to mark as finished (remove resume state)
        addActivity({
            id: `practice-${examTitle || 'UTME'}`,
            title: examTitle || 'Practice Session',
            subtitle: `${subjects.join(', ')} • ${questions.length} Questions`,
            path: '/performance',
            type: 'quiz',
            score: score,
            maxScore: questions.length
        });

    }, [isFinished, questions, userAnswers, subjects, examTitle, isAuthenticated, user, showInstallBanner, addActivity, location.state]);

    // Track latest values in refs for unmount auto-submission
    const handleSubmitRef = React.useRef(handleSubmit);
    const userAnswersRef = React.useRef(userAnswers);
    const finishedRef = React.useRef(isFinished);

    useEffect(() => {
        handleSubmitRef.current = handleSubmit;
        userAnswersRef.current = userAnswers;
        finishedRef.current = isFinished;
    }, [handleSubmit, userAnswers, isFinished]);

    // Auto-submit on departure/unmount
    useEffect(() => {
        return () => {
            // Use refs to check latest state during unmount
            if (!finishedRef.current && questions.length > 0 && Object.keys(userAnswersRef.current).length > 0) {
                console.log("Auto-submitting due to navigation away...");
                handleSubmitRef.current();
            }
        };
    }, [questions.length]); // Only re-run if questions change, but primarily for unmount cleanup


    useEffect(() => {
        const fetchAndPrepare = async () => {
            // If already have questions (e.g. from restoredState), skip fetching
            if (questions.length > 0) return;

            // CRITICAL: Prevent re-initialization if practice was already exited or completed
            // This prevents timer reset when navigating forward after exit
            if (sessionStorage.getItem('practiceExited') === 'true' ||
                sessionStorage.getItem('practiceCompleted') === 'true') {
                setIsLoading(false);
                return;
            }

            const {
                subjects: practiceSubjectsFromState,
                year: practiceYear,
                questions: customQuestions,
                questionsPerSubject,
                selections
            } = location.state || {};

            let preparedQuestions: ChallengeQuestion[] = [];

            if (customQuestions && customQuestions.length > 0) {
                preparedQuestions = customQuestions;
            } else {
                try {
                    // Try to fetch from API first
                    let papers: PastPaper[] = [];
                    try {
                        const apiData = await apiService<PastPaper[]>('/data/papers');
                        papers = apiData;
                    } catch (e) {
                        console.error("Failed to fetch papers in TakeExamination", e);
                        papers = [];
                    }

                    const numQuestions = questionsPerSubject;
                    let practiceSelections: { subject: string, year: 'random' | number }[] = [];

                    if (selections) {
                        practiceSelections = selections;
                    } else if (practiceSubjectsFromState && practiceSubjectsFromState.length > 0) {
                        practiceSelections = practiceSubjectsFromState.map((subject: string) => ({
                            subject,
                            year: practiceYear || 'random',
                        }));
                    }

                    if (practiceSelections.length > 0) {
                        // Pass undefined for numQuestions to select ALL
                        preparedQuestions = preparePracticeQuestions(papers, practiceSelections, numQuestions || 9999);
                    }
                } catch (error) {
                    console.error("Failed to prepare questions:", error);
                }
            }

            if (preparedQuestions.length > 0) {
                // Ensure flag is set so refreshes work
                sessionStorage.setItem('practiceStarted', 'true');

                setQuestions(preparedQuestions);
                setActiveSubject(preparedQuestions[0].subject);

                // Add to recent activity for "Practice Again"
                const isCustom = examTitle?.includes('Custom');
                addActivity({
                    id: `practice-${examTitle || 'UTME'}`,
                    title: examTitle || 'Practice Session',
                    subtitle: `${preparedQuestions[0].subject} ${preparedQuestions.length > preparedQuestions.filter(q => q.subject === preparedQuestions[0].subject).length ? '+ More' : ''} • ${preparedQuestions.length} Questions`,
                    path: location.pathname,
                    type: 'quiz',
                    state: { ...location.state } // Store original init state
                });

                sessionStorage.removeItem('practiceCompleted');
            }
            setIsLoading(false);
        };

        if (location.state) {
            fetchAndPrepare();
        } else {
            setIsLoading(false);
        }
    }, [location.state]);


    // Timer Logic using Timestamp
    const [endTime, setEndTime] = useState<number | null>(null);

    // Initialize Timer on start
    useEffect(() => {
        if (questions.length > 0 && !isFinished && !endTime && mode !== 'study') {
            // Check session storage for existing end time (persistence)
            const storedEndTime = sessionStorage.getItem('practiceEndTime');
            if (storedEndTime) {
                const parsed = parseInt(storedEndTime, 10);
                if (parsed > Date.now()) {
                    setEndTime(parsed);
                } else {
                    // Timer expired while away
                    setEndTime(Date.now()); // Expire immediately
                }
            } else {
                // New timer
                const durationSeconds = questions.length * 60; // 60s per question
                const newEndTime = Date.now() + (durationSeconds * 1000);
                setEndTime(newEndTime);
                sessionStorage.setItem('practiceEndTime', newEndTime.toString());
            }
        }
    }, [questions, isFinished, endTime, mode]);

    useEffect(() => {
        if (questions.length > 0 && !isFinished && endTime) {
            const timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

                setTimeLeft(remaining);

                if (remaining <= 0) {
                    clearInterval(timer);
                    handleSubmit();
                }
            }, 1000);

            // Immediate update to avoid 1s delay
            setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));

            return () => clearInterval(timer);
        }
    }, [questions, isFinished, handleSubmit, endTime]);

    useEffect(() => {
        if (isFinished) {
            // Session completed, user can view results and navigate manually
            // Navigation protection prevents re-access via sessionStorage
        }
    }, [isFinished]);

    // Unified navigation guard
    usePrompt(!isFinished && questions.length > 0, 'Are you sure you want to leave this practice session? Your progress will be lost.');

    const subjectBoundaries = useMemo(() => {
        const boundaries: Record<string, { start: number, end: number }> = {};
        if (!questions.length || !subjects.length) return boundaries;

        subjects.forEach(subject => {
            const start = questions.findIndex(q => q.subject === subject);
            let end = start;
            for (let i = start; i < questions.length; i++) {
                if (questions[i].subject === subject) {
                    end = i;
                } else {
                    break;
                }
            }
            if (start !== -1) {
                boundaries[subject] = { start, end };
            }
        });
        return boundaries;
    }, [questions, subjects]);

    const { localQuestionIndex, totalQuestionsInSubject } = useMemo(() => {
        if (!activeSubject || !subjectBoundaries[activeSubject]) {
            if (subjects.length === 1) { // Custom practice with one subject
                return { localQuestionIndex: currentQuestionIndex, totalQuestionsInSubject: questions.length };
            }
            return { localQuestionIndex: 0, totalQuestionsInSubject: 0 };
        }

        const bounds = subjectBoundaries[activeSubject];
        const localIndex = currentQuestionIndex - bounds.start;
        const totalInSubject = bounds.end - bounds.start + 1;

        return { localQuestionIndex: localIndex, totalQuestionsInSubject: totalInSubject };
    }, [currentQuestionIndex, activeSubject, subjectBoundaries, questions.length, subjects]);

    const attemptedInSubject = useMemo(() => {
        if (!activeSubject || !subjectBoundaries[activeSubject]) {
            if (subjects.length === 1) { // Custom practice with one subject
                return Object.keys(userAnswers).length;
            }
            return 0;
        }

        const bounds = subjectBoundaries[activeSubject];
        const questionsForSubject = questions.slice(bounds.start, bounds.end + 1);

        let count = 0;
        for (const q of questionsForSubject) {
            if (userAnswers[q.id] !== undefined) {
                count++;
            }
        }
        return count;
    }, [activeSubject, subjectBoundaries, questions, userAnswers, subjects.length]);


    const handleSubjectChange = (subject: string) => {
        setActiveSubject(subject);
        const firstQuestionIndex = subjectBoundaries[subject]?.start;
        if (firstQuestionIndex !== undefined) {
            setCurrentQuestionIndex(firstQuestionIndex);
        }
    };

    // New Guest Logic: "All questions are opened... once user has answered 5... the rest are locked"
    const guestAnswerLimitReached = useMemo(() => {
        if (isAuthenticated) return false;
        return Object.keys(userAnswers).length >= GUEST_QUESTION_LIMIT;
    }, [isAuthenticated, userAnswers]);

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            const prevQuestion = questions[currentQuestionIndex - 1];
            if (prevQuestion.subject !== activeSubject) {
                setActiveSubject(prevQuestion.subject);
            }
            setCurrentQuestionIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    };

    const handleNextQuestion = () => {
        // Allow navigation always
        if (currentQuestionIndex < questions.length - 1) {
            const nextQuestion = questions[currentQuestionIndex + 1];
            if (nextQuestion.subject !== activeSubject) {
                setActiveSubject(nextQuestion.subject);
            }
            setCurrentQuestionIndex(prev => prev + 1);
            setShowAnswer(false);
        }
    };

    const handleSelectOption = (questionId: string, optionKey: string) => {
        if (isFinished) return;

        // Guest Limit Check:
        if (!isAuthenticated) {
            const isAlreadyAnswered = userAnswers[questionId] !== undefined;
            // If trying to answer a NEW question and limit is reached
            if (!isAlreadyAnswered && guestAnswerLimitReached) {
                setShowLoginPrompt(true);
                return;
            }
        }

        setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    };

    const handleJumpToQuestion = (index: number) => {
        const question = questions[index];
        if (!question) return;

        // Navigation is allowed for all, no checks here anymore
        if (question.subject !== activeSubject) {
            setActiveSubject(question.subject);
        }
        setCurrentQuestionIndex(index);
        setShowAnswer(false);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const canSubmit = Object.keys(userAnswers).length > 0;

    // For Guests: Total is the Limit (5) for score denominator display? 
    // Or should it be total questions in exam?
    // "You got 3/5" implies you answered 3 out of 5 allowed.
    const totalQuestionsForSession = isAuthenticated ? questions.length : GUEST_QUESTION_LIMIT;

    // Handle login prompt in useEffect to avoid state updates during render
    useEffect(() => {
        if (showLoginPrompt) {
            requestLogin();
            setShowLoginPrompt(false);
        }
    }, [showLoginPrompt, requestLogin]);


    if (isLoading) {
        return <div className="flex items-center justify-center h-full">Preparing your questions...</div>;
    }

    if (questions.length === 0 && !isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white p-12 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-slate-700">Could Not Prepare Exam</h1>
                    <p className="text-slate-500 mt-2">We couldn't find enough questions for your selection. Please try again.</p>
                    <Link to="/practice" className="mt-6 inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                        Go to Practice
                    </Link>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-gray-900 p-4">
                <div className="text-center bg-white dark:bg-gray-800 p-8 sm:p-12 rounded-lg shadow-xl max-w-lg w-full transition-colors duration-200">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Session Complete!</h1>
                    <p className="text-slate-600 dark:text-gray-300 mt-2">Here is your score:</p>
                    <p className="text-7xl font-extrabold text-primary my-6 dark:text-green-400">{finalScore} <span className="text-5xl text-slate-500 dark:text-gray-500">/ {totalQuestionsForSession}</span></p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/practice" replace className="font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light dark:hover:bg-gray-700 transition-colors">
                            New Practice
                        </Link>
                        <Link to="/performance" replace className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                            View Performance
                        </Link>
                    </div>
                    {!isAuthenticated && (
                        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                            <p className="text-slate-600 dark:text-gray-300 mb-3">Want to save this result and track your progress?</p>
                            <button onClick={requestLogin} className="bg-secondary text-white font-semibold py-2 px-5 rounded-lg hover:bg-blue-700 transition-colors">
                                Login to Save Score
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex flex-col h-screen bg-white font-sans light">
            <header className="bg-primary text-white p-3 flex justify-between items-center shadow-md flex-shrink-0">
                <div className="font-bold text-xl">{examTitle || 'ExamRedi Practice'}</div>
                {mode !== 'study' ? (
                    <div className="bg-orange-500 text-white font-bold text-lg tracking-wider px-4 py-1 rounded-full w-32 text-center">
                        {formatTime(timeLeft)}
                    </div>
                ) : (
                    <div className="bg-blue-500 text-white font-bold px-4 py-1 rounded-full text-sm uppercase tracking-widest">
                        Study Mode
                    </div>
                )}
                <div className="relative group">
                    <button
                        onClick={() => { if (window.confirm('Are you sure you want to submit?')) handleSubmit(); }}
                        disabled={!canSubmit}
                        className="bg-red-600 hover:bg-red-700 font-bold py-2 px-6 rounded-lg transition-colors text-sm disabled:bg-red-400 disabled:cursor-not-allowed"
                        aria-describedby="submit-tooltip"
                    >
                        Submit
                    </button>
                    {!canSubmit && (
                        <div id="submit-tooltip" role="tooltip" className="absolute bottom-full right-0 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                            Please answer at least one question to submit.
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
                    {subjects.length > 1 && (
                        <div className="border-b border-gray-200 bg-white flex-shrink-0 sticky top-0 z-10">
                            <div className="flex items-center -mb-px px-4 overflow-x-auto">
                                {subjects.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => handleSubjectChange(subject)}
                                        className={`py-3 px-4 font-semibold text-sm transition-colors whitespace-nowrap ${activeSubject === subject ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex-1 p-4">
                        <div className="max-w-4xl mx-auto">
                            {currentQuestion ? (
                                <>
                                    <div className="flex items-center gap-4">
                                        <p className="font-semibold text-slate-700 mb-2">
                                            {activeSubject}: Question {localQuestionIndex + 1}
                                            <span className="text-sm text-slate-500"> of {totalQuestionsInSubject}</span>
                                        </p>
                                    </div>
                                    {(() => {
                                        if (currentQuestion) {
                                            console.log('Current Question Debug:', {
                                                id: currentQuestion.id,
                                                subject: currentQuestion.subject,
                                                hasQuestionText: !!currentQuestion.question,
                                                hasOptions: !!currentQuestion.options,
                                                optionsKeys: currentQuestion.options ? Object.keys(currentQuestion.options) : []
                                            });
                                        }
                                        return null;
                                    })()}
                                    <QuestionRenderer
                                        question={currentQuestion}
                                        className="text-lg text-slate-800 mb-4 min-h-[40px]"
                                        forceLightMode={true}
                                    />

                                    {mode === 'study' && (
                                        <div className="mb-6 flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl">💡</span>
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Want to see the answer?</span>
                                            </div>
                                            <button
                                                onClick={() => setShowAnswer(!showAnswer)}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${showAnswer
                                                    ? 'bg-slate-200 text-slate-700'
                                                    : 'bg-primary text-white shadow-lg shadow-primary/20'
                                                    }`}
                                            >
                                                {showAnswer ? 'Hide Answer' : 'Show Answer'}
                                            </button>
                                        </div>
                                    )}

                                    {((isFinished && mode !== 'mock') || (mode === 'study' && showAnswer)) && currentQuestion.explanation && (
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <p className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-1">Explanation</p>
                                            <div className="text-blue-900"><MarkdownRenderer content={currentQuestion.explanation} forceLightMode={true} /></div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {currentQuestion.options ? (
                                            Object.keys(currentQuestion.options).map((key) => {
                                                const value = currentQuestion.options[key];
                                                const isCorrect = key === currentQuestion.answer;
                                                const isSelected = userAnswers[currentQuestion.id] === key;

                                                let borderClass = 'border-gray-200 bg-white hover:border-primary-light';

                                                if (mode === 'study' && showAnswer) {
                                                    if (isCorrect) borderClass = 'border-green-500 bg-green-50 ring-2 ring-green-500/20';
                                                    else if (isSelected) borderClass = 'border-red-400 bg-red-50';
                                                } else if (isFinished && mode !== 'mock') {
                                                    if (isCorrect) borderClass = 'border-green-500 bg-green-50';
                                                    else if (isSelected) borderClass = 'border-red-400 bg-red-50';
                                                } else if (isSelected) {
                                                    borderClass = 'border-primary bg-primary-light';
                                                }

                                                return (
                                                    <label key={key} className={`p-3 rounded-lg border-2 flex items-start gap-4 transition-all ${!isFinished ? 'cursor-pointer' : ''} ${borderClass}`}>
                                                        <input
                                                            type="radio"
                                                            name={currentQuestion.id}
                                                            value={key}
                                                            disabled={isFinished}
                                                            checked={isSelected}
                                                            onChange={() => handleSelectOption(currentQuestion.id, key)}
                                                            className="mt-1 h-5 w-5 text-primary focus:ring-primary border-gray-300 flex-shrink-0"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-2">
                                                                <span className="font-bold text-slate-800">{key}.</span>
                                                                <div className="text-slate-700"><MarkdownRenderer content={value.text} forceLightMode={true} /></div>
                                                            </div>
                                                            {value.diagram && (
                                                                <div className="mt-3">
                                                                    <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-xs h-auto rounded-md border bg-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                )
                                            })
                                        ) : (
                                            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
                                                Options data not available for this question.
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : <p>Loading question...</p>}


                            <div className="mt-8 flex justify-between items-center">
                                <button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="font-semibold text-white bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="font-semibold text-white bg-green-500 py-2 px-5 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </button>
                            </div>

                        </div>
                    </div>
                </main>

                <footer className="bg-white p-4 border-t shadow-inner flex-shrink-0 z-10">
                    <div className="max-w-4xl mx-auto">
                        <p className="font-semibold text-slate-600 text-sm mb-2">
                            Attempted {attemptedInSubject} / {totalQuestionsInSubject}
                        </p>
                        <div className="space-y-4">
                            {(() => {
                                const subject = activeSubject;
                                const bounds = subjectBoundaries[subject];
                                if (!bounds) return null;
                                const questionCount = bounds.end - bounds.start + 1;

                                return (
                                    <div key={subject}>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.from({ length: questionCount }).map((_, localIndex) => {
                                                const globalIndex = bounds.start + localIndex;
                                                const q = questions[globalIndex];
                                                if (!q) return null;

                                                const isCurrent = globalIndex === currentQuestionIndex;
                                                const isAnswered = userAnswers[q.id] !== undefined;

                                                // Guest logic: visual lock?
                                                // If we have answered 5 questions, UNANSWERED questions should perhaps look locked?
                                                // But the user said "all questions are opened... once... answered 5... rest are locked"
                                                // So if !isAnswered and limitReached, show lock.

                                                let isLocked = false;
                                                if (!isAuthenticated && guestAnswerLimitReached && !isAnswered) {
                                                    isLocked = true;
                                                }

                                                let buttonClass = 'border border-gray-300 text-slate-700 hover:bg-gray-100';

                                                if (isLocked) {
                                                    buttonClass = 'border border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60';
                                                } else if (isAnswered) {
                                                    buttonClass = 'bg-green-100 border-green-300 text-green-800';
                                                }

                                                if (isCurrent) {
                                                    buttonClass = 'bg-primary text-white border-green-700 ring-2 ring-offset-1 ring-primary';
                                                }

                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => handleJumpToQuestion(globalIndex)}
                                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-sm font-bold flex items-center justify-center transition-all duration-150 ${buttonClass}`}
                                                        aria-label={`Go to ${subject} question ${localIndex + 1}`}
                                                    >
                                                        {isLocked ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            localIndex + 1
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default TakeExamination;