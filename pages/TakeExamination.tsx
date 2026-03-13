import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt.ts';
import { ChallengeQuestion, QuizResult, PastPaper } from '../types.ts';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import { useEngagement } from '../contexts/EngagementContext.tsx';
import { evaluateNudgeTrigger, NUDGE_REGISTRY } from '../constants/engagementRules.ts';
import QuizResults from '../components/QuizResults.tsx';
import { useVisualViewport } from '../hooks/useVisualViewport.ts';

import apiService from '../services/apiService.ts';
import QuestionNavigation from '../components/QuestionNavigation.tsx';


const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const GUEST_QUESTION_LIMIT = 5;

const preparePracticeQuestions = (
    allPapers: PastPaper[],
    selections: { subject: string, year: 'random' | number, count?: number }[], // count is now optional per subject
    globalCount: number, // fallback
    keyword?: string
): ChallengeQuestion[] => {
    if (!selections || selections.length === 0) return [];

    const sortedSelections = [...selections].sort((a, b) => {
        if (a.subject === 'English') return -1;
        if (b.subject === 'English') return 1;
        return a.subject.localeCompare(b.subject);
    });

    let allQuestions: ChallengeQuestion[] = [];

    sortedSelections.forEach(({ subject, year, count: subjectCount }) => {
        let papersForSubject = allPapers.filter(paper => paper.subject === subject);

        if (year !== 'random') {
            papersForSubject = papersForSubject.filter(paper => paper.year === year);
            if (papersForSubject.length === 0) {
                papersForSubject = allPapers.filter(paper => paper.subject === subject);
            }
        }

        let questionsForSubject = papersForSubject
            .flatMap(paper => paper.questions)
            .map(q => ({ ...q, subject }));

        if (keyword) {
            const lowerKeyword = keyword.toLowerCase();
            questionsForSubject = questionsForSubject.filter(q =>
                (q.question || '').toLowerCase().includes(lowerKeyword) ||
                (q.options && Object.values(q.options).some(o => ((o as any).text || '').toLowerCase().includes(lowerKeyword)))
            );
        }

        // Determine count: explicit subject count > global defaults
        const countToUse = subjectCount || globalCount;

        // Safety Cap
        const limit = subject === 'English' ? 100 : 50;
        const finalCount = Math.min(countToUse, limit);

        const shuffled = shuffleArray(questionsForSubject);
        allQuestions.push(...shuffled.slice(0, finalCount));
    });

    return allQuestions;
};

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (h > 0) {
        return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
};


const TakeExamination: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, requestLogin } = useAuth();
    const { showInstallBanner } = usePwaInstall();
    const { addActivity } = useUserProgress();
    const viewportHeight = useVisualViewport();
    const examHeight = viewportHeight.height;

    // Validate that the route was accessed properly with required state
    const validatePracticeState = useCallback((state: any) => {
        if (!state) return false;

        // Check for "isRetake" - if it's a retake, we don't care about the timestamp
        if (state.isRetake) return true;

        // Check if state is too old (only for fresh session transitions)
        const now = Date.now();
        const stateTimestamp = state.timestamp || 0;
        if (now - stateTimestamp > 5 * 60 * 1000) return false; // 5 minutes

        // Check for topic test state (questions passed directly)
        if (state.questions && Array.isArray(state.questions) && state.questions.length > 0) {
            return typeof state.examTitle === 'string';
        }

        // Check for standard mode state
        if (state.subjects && Array.isArray(state.subjects) && state.subjects.length > 0) {
            return typeof state.year !== 'undefined' && typeof state.examTitle === 'string';
        }

        // Check for custom mode state (per-subject count, no global questionsPerSubject)
        if (state.selections && Array.isArray(state.selections) && state.selections.length > 0) {
            return typeof state.examTitle === 'string';
        }

        return false;
    }, []);

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
    const [topicBreakdown, setTopicBreakdown] = useState<Record<string, { correct: number, total: number }>>({});

    const { activeNudge, triggerNudge } = useEngagement();

    const sessionId = useMemo(() => {
        if (location.state?.isRetake) return Date.now().toString();
        return location.state?.sessionId || Date.now().toString();
    }, [location.state?.sessionId, location.state?.isRetake]);

    const mode = location.state?.mode || 'practice';

    const subjects = useMemo(() => {
        if (!questions.length) return [];
        const orderedSubjects = questions.map(q => q.subject);
        return [...new Set(orderedSubjects)];
    }, [questions]);

    // Session Management & Cleanup
    useEffect(() => {
        const storedSessionId = sessionStorage.getItem('activeSessionId');

        // If this is a NEW session (ID mismatch), clear all legacy data
        if (storedSessionId !== sessionId) {
            console.log("New session detected. Clearing legacy storage.");
            sessionStorage.removeItem('practiceAnswers');
            sessionStorage.removeItem('practiceCompleted');
            sessionStorage.removeItem('practiceExited');
            sessionStorage.removeItem('practiceEndTime');
            sessionStorage.removeItem('practiceStarted');
            sessionStorage.setItem('activeSessionId', sessionId);
        }
    }, [sessionId]);

    // Load answers from sessionStorage or location state (resumption)
    useEffect(() => {
        // If we are retaking, do not load previous answers
        if (location.state?.isRetake) return;

        const savedData = sessionStorage.getItem('practiceAnswers');

        if (savedData) {
            try {
                const { sessionId: savedSessionId, answers } = JSON.parse(savedData);
                // Double check session ID match (redundant but safe)
                if (savedSessionId === sessionId) {
                    setUserAnswers(prev => ({ ...prev, ...answers }));
                }
            } catch (e) {
                console.error("Failed to parse saved answers", e);
            }
        } else if (location.state?.userAnswers && mode !== 'mock') {
            setUserAnswers(prev => ({ ...prev, ...location.state.userAnswers }));
        }
    }, [mode, location.state?.userAnswers, location.state?.isRetake, sessionId]);

    // Scrub userAnswers against current questions to remove ghosts
    useEffect(() => {
        if (questions.length > 0) {
            setUserAnswers(prev => {
                const validIds = new Set(questions.map(q => q.id));
                const filtered: { [key: string]: string } = {};
                let hasChanges = false;

                Object.entries(prev).forEach(([key, value]) => {
                    if (validIds.has(key)) {
                        filtered[key] = value;
                    } else {
                        hasChanges = true;
                    }
                });

                return hasChanges ? filtered : prev;
            });
        }
    }, [questions]);

    // Save answers to sessionStorage whenever they change
    useEffect(() => {
        if (Object.keys(userAnswers).length > 0) {
            sessionStorage.setItem('practiceAnswers', JSON.stringify({ sessionId, answers: userAnswers }));
        }
    }, [userAnswers, sessionId]);

    // Sync answers to recentActivity for resumption support (debounced) - Practice only
    useEffect(() => {
        if (!isFinished && questions.length > 0 && Object.keys(userAnswers).length > 0 && mode !== 'mock') {
            const timer = setTimeout(() => {
                addActivity({
                    id: sessionId,
                    title: location.state?.examTitle || 'Practice Session',
                    subtitle: `${subjects.join(', ')} • ${questions.length} Questions`,
                    path: location.pathname,
                    type: 'quiz',
                    state: {
                        ...location.state,
                        sessionId,
                        questions, // Persist exact questions for deterministic resumption
                        userAnswers // Save current answers for true resumption
                    }
                });
            }, 2000); // 2 second debounce to prevent spamming PUT requests

            return () => clearTimeout(timer);
        }
    }, [userAnswers, isFinished, questions, sessionId, subjects, location.pathname, location.state, addActivity, mode]);

    const examTitle = location.state?.examTitle;

    // Monitor for invalid access during navigation (back/forward) or initial load
    useEffect(() => {
        // If we are finished, we are allowed to stay (to view results)
        if (isFinished) return;

        // Check for "isRetake" flag from Study Journey to allow a fresh start
        if (location.state?.isRetake) {
            sessionStorage.removeItem('practiceCompleted');
            sessionStorage.removeItem('practiceExited');
            sessionStorage.removeItem('practiceEndTime');
            sessionStorage.removeItem('practiceAnswers');
            sessionStorage.setItem('practiceStarted', 'true'); // Set this to pass the validState check
        }

        const currentIsValid =
            sessionStorage.getItem('practiceStarted') === 'true' ||
            validatePracticeState(location.state);

        if (!currentIsValid) {
            navigate('/practice', { replace: true });
        }
    }, [location.state, navigate, isFinished, validatePracticeState]);

    // Check if access is valid for rendering content
    const isAccessIllegal = useMemo(() => {
        if (isFinished) return false; // Authorized if finished (viewing results)
        if (location.state?.isRetake) return false; // Always legal if retaking

        return !(
            sessionStorage.getItem('practiceStarted') === 'true' ||
            validatePracticeState(location.state)
        );
    }, [isFinished, location.state, validatePracticeState]);

    if (isAccessIllegal) {
        return null; // Redirect handled by effect
    }

    // Check if practice was already completed from sessionStorage
    useEffect(() => {
        if (sessionStorage.getItem('practiceCompleted') === 'true' && !isFinished) {
            navigate('/practice', { replace: true });
        }
    }, [navigate, isFinished]);



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
        setTopicBreakdown(topicBreakdown);
        setIsFinished(true);

        // Engagement Logic: Trigger nudges based on performance & usage
        if (isAuthenticated) {
            if (score / questions.length >= 0.85) {
                // High performer - 100k Challenge
                setTimeout(() => {
                    triggerNudge('utme-challenge-100k');
                }, 2000);
            }

            // Universal Pro Trigger for all free users
            if (user?.subscription === 'free') {
                setTimeout(() => {
                    triggerNudge('pro-success-stat');
                }, 4000); // Slight delay after the performance nudge if applicable
            }
        }
        sessionStorage.setItem('practiceCompleted', 'true');
        sessionStorage.removeItem('practiceStarted');
        sessionStorage.removeItem('practiceEndTime');
        sessionStorage.removeItem('practiceAnswers');

        if (location.state?.isTopicTest && location.state?.topicId) {
            sessionStorage.setItem('recentlyTestedTopic', location.state.topicId);
        }

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
                type: mode === 'mock' ? 'exam' : 'practice',
                completedAt: Date.now(),
            };
            try {
                await apiService('/data/performance', { method: 'POST', body: result });
            } catch (error) {
                console.error("Failed to save performance result:", error);
            }
        }

        // Update recent activity to mark as finished (allow retake)
        addActivity({
            id: sessionId,
            title: examTitle || 'Practice Session',
            subtitle: `${subjects.join(', ')} • ${questions.length} Questions`,
            path: location.pathname, // Keep same path for "Practice Again"
            type: 'quiz',
            score: score,
            maxScore: questions.length,
            state: {
                ...location.state,
                sessionId, // Persist sessionId so "Continue" works if needed
                isRetake: true,
                timestamp: Date.now() // Refresh timestamp for validation
            }
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

    // Auto-submit on departure/unmount - ONLY for Mock Exams
    useEffect(() => {
        return () => {
            // For mock exams, we auto-submit even if no questions answered (Activity Feed requirement)
            if (mode === 'mock' && !finishedRef.current && questions.length > 0) {
                console.log("Auto-submitting mock exam due to navigation away...");
                handleSubmitRef.current();
            }
        };
    }, [mode, questions.length]);

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
            } = (location.state as any) || {};

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
                    let practiceSelections: { subject: string, year: 'random' | number, count?: number }[] = [];

                    if (selections) {
                        practiceSelections = selections;
                    } else if (practiceSubjectsFromState && practiceSubjectsFromState.length > 0) {
                        // Standard Mode: 4 subjects, default to 60 for English, 40 for others? 
                        // Or just use the global default passed in (likely 40 or 50)
                        practiceSelections = practiceSubjectsFromState.map((subject: string) => ({
                            subject,
                            year: practiceYear || 'random',
                            count: subject === 'English' ? 60 : 40 // Default standard exam distribution if not specified
                        }));
                    }

                    if (practiceSelections.length > 0) {
                        // Pass undefined for numQuestions to select ALL
                        preparedQuestions = preparePracticeQuestions(papers, practiceSelections, numQuestions || 9999, (location.state as any)?.query);
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
                addActivity({
                    id: sessionId,
                    title: examTitle || 'Practice Session',
                    subtitle: `${preparedQuestions[0].subject} ${preparedQuestions.length > preparedQuestions.filter(q => q.subject === preparedQuestions[0].subject).length ? '+ More' : ''} • ${preparedQuestions.length} Questions`,
                    path: location.pathname,
                    type: 'quiz',
                    state: {
                        ...location.state,
                        sessionId,
                        questions: preparedQuestions // Persist questions immediately
                    }
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
    }, [location.state, sessionId, examTitle]);


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
                let durationSeconds = questions.length * 60; // 60s per question feedback
                if (location.state?.durationHours) {
                    durationSeconds = location.state.durationHours * 3600;
                }
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
            <QuizResults
                finalScore={finalScore}
                totalQuestions={totalQuestionsForSession}
                topicBreakdown={topicBreakdown}
                isAuthenticated={isAuthenticated}
                requestLogin={requestLogin}
            />
        );
    }

    return (
        <div
            className="relative flex flex-col bg-gray-50 font-sans text-gray-900 overflow-hidden w-full"
            style={{ height: examHeight }}
        >
            <header className="bg-white text-gray-800 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center shadow-sm flex-shrink-0 z-20 gap-2 h-16 sm:h-20">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-light flex-shrink-0 flex items-center justify-center text-primary font-bold text-sm sm:text-base">
                        {examTitle ? examTitle.charAt(0) : 'E'}
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-lg leading-tight truncate">{examTitle || 'Practice Session'}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wider hidden sm:block">{mode === 'study' ? 'Study Mode' : 'Timed Mode'}</div>
                    </div>
                </div>

                {mode !== 'study' && (
                    <div className="bg-orange-50 text-orange-700 font-bold text-sm sm:text-xl font-mono tracking-widest px-3 py-1 sm:px-6 sm:py-2 rounded-full border border-orange-100 shadow-sm whitespace-nowrap">
                        {formatTime(timeLeft)}
                    </div>
                )}

                <div className="relative group shrink-0">
                    <button
                        onClick={() => { if (window.confirm('Are you sure you want to submit?')) handleSubmit(); }}
                        disabled={!canSubmit}
                        className="bg-primary hover:bg-blue-700 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-full transition-all shadow-md shadow-blue-200 hover:shadow-lg disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed text-xs sm:text-base whitespace-nowrap flex items-center justify-center"
                        aria-describedby="submit-tooltip"
                    >
                        <span className="sm:inline hidden">Finish & Submit</span>
                        <span className="sm:hidden inline">Submit</span>
                    </button>
                    {!canSubmit && (
                        <div id="submit-tooltip" role="tooltip" className="absolute top-full right-0 mt-3 w-max px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-xl">
                            Answer at least one question to submit.
                            <div className="absolute -top-1 right-6 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative w-full">
                <main className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {subjects.length > 1 && (
                        <div className="flex-shrink-0 mb-4 sm:mb-6 overflow-x-auto py-3 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar w-[calc(100%+2rem)] sm:w-full">
                            <div className="flex items-center gap-2 min-w-max h-12">
                                {subjects.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => handleSubjectChange(subject)}
                                        className={`py-2 px-4 sm:px-5 rounded-full font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-sm border ${activeSubject === subject
                                            ? 'bg-primary text-white border-primary shadow-md transform scale-105'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        {subject}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 flex flex-col">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 flex-1 flex flex-col">
                            {currentQuestion ? (
                                <>
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                                        <div>
                                            <span className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-1 block">{activeSubject}</span>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-gray-800">Question {localQuestionIndex + 1}</span>
                                                <span className="text-gray-400 font-medium">/ {totalQuestionsInSubject}</span>
                                            </div>
                                        </div>
                                        <div className="hidden sm:block text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-lg">
                                            ID: {currentQuestion.id}
                                        </div>
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
                                        renderOptions={false}
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

                                    <div className="grid grid-cols-1 gap-3">
                                        {currentQuestion.options ? (
                                            Object.keys(currentQuestion.options).map((key) => {
                                                const value = currentQuestion.options[key];
                                                const isCorrect = key === currentQuestion.answer;
                                                const isSelected = userAnswers[currentQuestion.id] === key;

                                                let containerClass = 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50';
                                                let indicatorClass = 'border-gray-300 text-gray-400 group-hover:border-gray-400';

                                                if (mode === 'study' && showAnswer) {
                                                    if (isCorrect) {
                                                        containerClass = 'border-green-500 bg-green-50/50 ring-1 ring-green-500';
                                                        indicatorClass = 'border-green-500 bg-green-500 text-white';
                                                    } else if (isSelected) {
                                                        containerClass = 'border-red-300 bg-red-50/50';
                                                        indicatorClass = 'border-red-400 text-red-500';
                                                    }
                                                } else if (isFinished && mode !== 'mock') {
                                                    if (isCorrect) {
                                                        containerClass = 'border-green-500 bg-green-50/50';
                                                        indicatorClass = 'border-green-500 bg-green-500 text-white';
                                                    } else if (isSelected) {
                                                        containerClass = 'border-red-300 bg-red-50/50';
                                                        indicatorClass = 'border-red-400 text-red-500';
                                                    }
                                                } else if (isSelected) {
                                                    containerClass = 'border-primary bg-blue-50/50 ring-1 ring-primary';
                                                    indicatorClass = 'border-primary bg-primary text-white';
                                                }

                                                return (
                                                    <label
                                                        key={key}
                                                        className={`group relative p-4 rounded-2xl border-2 flex items-start gap-4 transition-all duration-200 ${!isFinished ? 'cursor-pointer' : ''} ${containerClass}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={currentQuestion.id}
                                                            value={key}
                                                            disabled={isFinished}
                                                            checked={isSelected}
                                                            onChange={() => handleSelectOption(currentQuestion.id, key)}
                                                            className="sr-only" // Hide default radio
                                                        />
                                                        {/* Custom Radio Indicator */}
                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all ${indicatorClass}`}>
                                                            {key}
                                                        </div>

                                                        <div className="flex-1 pt-1">
                                                            <div className="text-gray-800 text-base leading-relaxed"><MarkdownRenderer content={value.text} forceLightMode={true} /></div>
                                                            {value.diagram && (
                                                                <div className="mt-4">
                                                                    <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-xs h-auto rounded-xl border border-gray-100 bg-white shadow-sm" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Selection Checkmark (Optional, for extra polish) */}
                                                        {isSelected && (
                                                            <div className="absolute top-4 right-4 text-primary opacity-0 scale-50 transition-all sm:opacity-100 sm:scale-100">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </label>
                                                )
                                            })
                                        ) : (
                                            <div className="p-6 bg-yellow-50 text-yellow-800 rounded-2xl border border-yellow-100 flex items-center gap-3">
                                                <span className="text-2xl">⚠️</span>
                                                <span className="font-medium">Options data not available for this question.</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : <div className="p-12 text-center text-gray-400">Loading question...</div>}


                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                                <button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="group font-bold text-gray-500 py-3 px-6 rounded-full hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="font-bold text-white bg-primary py-3 px-8 rounded-full shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0 transition-all flex items-center gap-3"
                                >
                                    Next
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                                </button>
                            </div>

                        </div>
                    </div>
                </main>

                {/* Sidebar Navigation (Desktop) / Drawer (Mobile) */}
                <QuestionNavigation
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    userAnswers={userAnswers}
                    onJumpToQuestion={handleJumpToQuestion}
                    activeSubject={activeSubject}
                    onSubjectChange={handleSubjectChange}
                    subjects={subjects}
                    isFinished={isFinished}
                    guestAnswerLimitReached={guestAnswerLimitReached}
                    isAuthenticated={isAuthenticated}
                />
            </div>
        </div>
    );
};

export default TakeExamination;
