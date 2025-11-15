import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ChallengeQuestion, QuizResult, PastPaper } from '../types.ts';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';
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
    
    const [allPapers, setAllPapers] = useState<PastPaper[]>([]);
    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [activeSubject, setActiveSubject] = useState<string>('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const examTitle = location.state?.examTitle;

    const subjects = useMemo(() => {
        if (!questions.length) return [];
        const orderedSubjects = questions.map(q => q.subject);
        return [...new Set(orderedSubjects)];
    }, [questions]);
    
    const handleSubmit = useCallback(async () => {
        if (isFinished) return;
        
        const questionsForScoring = isAuthenticated ? questions : questions.slice(0, GUEST_QUESTION_LIMIT);

        let score = 0;
        questionsForScoring.forEach(q => {
            if (userAnswers[q.id] === q.answer) {
                score++;
            }
        });
        setFinalScore(score);
        setIsFinished(true);

        if (isAuthenticated && user) {
            if (user.subscription === 'free') {
                showInstallBanner();
            }
            const result: Omit<QuizResult, 'id'> = {
                paperId: 'practice-session',
                exam: examTitle || 'Practice',
                subject: subjects.join(', '),
                year: new Date().getFullYear(),
                score: score,
                totalQuestions: questions.length,
                userAnswers,
                completedAt: Date.now(),
            };
            try {
                await apiService('/data/performance', { method: 'POST', body: result });
            } catch (error) {
                console.error("Failed to save performance result:", error);
            }
        }

    }, [isFinished, questions, userAnswers, subjects, examTitle, isAuthenticated, user, showInstallBanner]);

    useEffect(() => {
        const fetchAndPrepare = async () => {
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
                    const papers: PastPaper[] = await apiService('/data/papers');
                    setAllPapers(papers);

                    const numQuestions = questionsPerSubject || 10;
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
                        preparedQuestions = preparePracticeQuestions(papers, practiceSelections, numQuestions);
                    }
                } catch (error) {
                    console.error("Failed to fetch papers for exam:", error);
                }
            }

            if (preparedQuestions.length > 0) {
                setQuestions(preparedQuestions);
                setActiveSubject(preparedQuestions[0].subject);
                setTimeLeft(preparedQuestions.length * 60);
            }
            setIsLoading(false);
        };

        if (location.state) {
            fetchAndPrepare();
        } else {
            setIsLoading(false);
        }
    }, [location.state]);


    useEffect(() => {
        if (questions.length > 0 && !isFinished) {
            const timer = setInterval(() => {
                setTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(timer);
                        handleSubmit();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [questions, isFinished, handleSubmit]);

    useEffect(() => {
        if (isAuthenticated) {
            setShowLoginPrompt(false); // Close prompt on successful login
        }
    }, [isAuthenticated]);
    
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
            if (!isAuthenticated && firstQuestionIndex >= GUEST_QUESTION_LIMIT) {
                setShowLoginPrompt(true);
                return;
            }
            setCurrentQuestionIndex(firstQuestionIndex);
        }
    };
    
    const handleNextQuestion = () => {
        if (!isAuthenticated && currentQuestionIndex >= GUEST_QUESTION_LIMIT - 1) {
            setShowLoginPrompt(true);
            return;
        }
        if (currentQuestionIndex < questions.length - 1) {
             const nextQuestion = questions[currentQuestionIndex + 1];
             if (nextQuestion.subject !== activeSubject) {
                 setActiveSubject(nextQuestion.subject);
             }
             setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            const prevQuestion = questions[currentQuestionIndex - 1];
             if (prevQuestion.subject !== activeSubject) {
                 setActiveSubject(prevQuestion.subject);
             }
             setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSelectOption = (questionId: string, optionKey: string) => {
        if (isFinished) return;
        setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    };
    
    const handleJumpToQuestion = (index: number) => {
        if (!isAuthenticated && index >= GUEST_QUESTION_LIMIT) {
            setShowLoginPrompt(true);
            return;
        }
        const question = questions[index];
        if (question && question.subject !== activeSubject) {
            setActiveSubject(question.subject);
        }
        setCurrentQuestionIndex(index);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const canSubmit = Object.keys(userAnswers).length > 0;
    const totalQuestionsForSession = isAuthenticated ? questions.length : GUEST_QUESTION_LIMIT;

    if (showLoginPrompt) {
        requestLogin();
        setShowLoginPrompt(false); // Prevent re-triggering
    }

    if (!location.state) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white p-12 rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-slate-700">No Practice Session Found</h1>
                    <p className="text-slate-500 mt-2">Please start a new session from the practice page.</p>
                    <Link to="/practice" className="mt-6 inline-block bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                        Go to Practice
                    </Link>
                </div>
            </div>
        );
    }
    
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
            <div className="flex items-center justify-center h-full bg-slate-100 p-4">
                <div className="text-center bg-white p-8 sm:p-12 rounded-lg shadow-xl max-w-lg w-full">
                    <h1 className="text-3xl font-bold text-slate-800">Session Complete!</h1>
                    <p className="text-slate-600 mt-2">Here is your score:</p>
                    <p className="text-7xl font-extrabold text-primary my-6">{finalScore} <span className="text-5xl text-slate-500">/ {totalQuestionsForSession}</span></p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                         <Link to="/practice" className="font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light transition-colors">
                            New Practice
                        </Link>
                         <Link to="/performance" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                            View Performance
                        </Link>
                    </div>
                     {!isAuthenticated && (
                        <div className="mt-8 border-t pt-6">
                            <p className="text-slate-600 mb-3">Want to save this result and track your progress?</p>
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
        <div className="relative flex flex-col h-screen bg-white font-sans">
            <header className="bg-primary text-white p-3 flex justify-between items-center shadow-md flex-shrink-0">
                <div className="font-bold text-xl">{examTitle || 'ExamRedi Practice'}</div>
                <div className="bg-orange-500 text-white font-bold text-lg tracking-wider px-4 py-1 rounded-full w-32 text-center">
                    {formatTime(timeLeft)}
                </div>
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
                                    <QuestionRenderer 
                                        question={currentQuestion}
                                        className="text-lg text-slate-800 mb-4 min-h-[40px]"
                                    />
                                    <div className="space-y-4">
                                        {Object.keys(currentQuestion.options).map((key) => {
                                            const value = currentQuestion.options[key];
                                            return (
                                            <label key={key} className={`p-3 rounded-lg border-2 flex items-start gap-4 transition-all cursor-pointer ${userAnswers[currentQuestion.id] === key ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-primary-light'}`}>
                                                <input
                                                    type="radio"
                                                    name={currentQuestion.id}
                                                    value={key}
                                                    checked={userAnswers[currentQuestion.id] === key}
                                                    onChange={() => handleSelectOption(currentQuestion.id, key)}
                                                    className="mt-1 h-5 w-5 text-primary focus:ring-primary border-gray-300 flex-shrink-0"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-start gap-2">
                                                        <span className="font-bold text-slate-800">{key}.</span>
                                                        <div className="text-slate-700"><MarkdownRenderer content={value.text} /></div>
                                                    </div>
                                                    {value.diagram && (
                                                        <div className="mt-3">
                                                            <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-xs h-auto rounded-md border bg-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        )})}
                                    </div>
                                </>
                             ) : <p>Loading question...</p>}


                             <div className="mt-8 flex justify-between items-center">
                                <button
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                    className="font-semibold text-white bg-blue-600 py-2 px-5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 transition-colors flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Previous
                                </button>
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex === totalQuestionsForSession - 1}
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
                                        <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-18 gap-1.5">
                                            {Array.from({ length: questionCount }).map((_, localIndex) => {
                                                const globalIndex = bounds.start + localIndex;
                                                const q = questions[globalIndex];
                                                if (!q) return null;
                                                
                                                const isCurrent = globalIndex === currentQuestionIndex;
                                                const isAnswered = userAnswers[q.id] !== undefined;
                                                
                                                let buttonClass = 'border border-gray-300 text-slate-700 hover:bg-gray-100';
                                                if (isAnswered) buttonClass = 'bg-green-100 border-green-300 text-green-800';
                                                if (isCurrent) buttonClass = 'bg-primary text-white border-green-700 ring-2 ring-offset-1 ring-primary';

                                                if (!isAuthenticated && globalIndex >= GUEST_QUESTION_LIMIT) {
                                                    buttonClass = 'border border-gray-300 bg-gray-200 text-gray-400 cursor-pointer';
                                                }

                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => handleJumpToQuestion(globalIndex)}
                                                        className={`w-full aspect-square rounded-sm text-xs font-medium transition-all duration-150 ${buttonClass}`}
                                                        aria-label={`Go to ${subject} question ${localIndex + 1}`}
                                                    >
                                                        {localIndex + 1}
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