import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../components/Card.tsx';
import { LeaderboardScore, ChallengeQuestion, PastPaper } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import apiService from '../services/apiService.ts';


// --- ICONS ---
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-4-4h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 4H5a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BackArrowIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;

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
            .flatMap(paper => paper.questions.map(q => ({...q, subject}))); 

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
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [leaderboard, setLeaderboard] = useState<LeaderboardScore[]>([]);
    const [allPapers, setAllPapers] = useState<PastPaper[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
    const [finalScore, setFinalScore] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION_MINUTES * 60);
    const [scoreSaved, setScoreSaved] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                const [leaderboardData, papersData] = await Promise.all([
                    apiService<LeaderboardScore[]>('/data/leaderboard'),
                    apiService<PastPaper[]>('/data/papers')
                ]);
                setLeaderboard(leaderboardData);
                setAllPapers(papersData);
            } catch (error) {
                console.error("Failed to fetch game data", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const availableSubjects = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);


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
    }, [gameState, questions, userAnswers]);

    useEffect(() => {
        if (gameState !== 'playing' || timeLeft === 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, timeLeft, handleSubmit]);
    
    const handleStartSelection = () => setGameState('selecting');

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
        setScoreSaved(false);
        setGameState('playing');
    };

    const handleSelectOption = (questionId: string, optionKey: string) => {
        setUserAnswers(prev => ({ ...prev, [questionId]: optionKey }));
    };

    
    const handleSaveScore = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated || !user) {
            requestLogin();
            return;
        }

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

        const newScore: LeaderboardScore = {
            name: user.name,
            score: finalScore,
            totalQuestions: TOTAL_QUESTIONS,
            date: Date.now(),
        };

        try {
            const updatedLeaderboard = await apiService<LeaderboardScore[]>('/data/leaderboard', { method: 'POST', body: newScore });
            setLeaderboard(updatedLeaderboard);
            setScoreSaved(true);
        } catch (error) {
            console.error("Failed to save score:", error);
            alert("Could not save score. Please try again.");
        }
    };

    const resetGame = () => {
        setSelectedSubjects([]);
        setGameState('lobby');
    };

    const scoreBySubject = useMemo(() => {
        return selectedSubjects.map(subject => {
            const subjectQuestions = questions.filter(q => q.subject === subject);
            const correct = subjectQuestions.filter(q => userAnswers[q.id] === q.answer).length;
            return { subject, score: correct, total: subjectQuestions.length };
        });
    }, [questions, userAnswers, selectedSubjects]);

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
                <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Top Scores</h2>
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
                    <div className="flex items-center bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full"><ClockIcon/> {formatTime(timeLeft)}</div>
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
                        )})}
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
                         <button onClick={handleSaveScore} className="bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-lg hover:bg-yellow-500">
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
                     <button onClick={() => setGameState('reviewing')} className="font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light">Review Answers</button>
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
                    <button onClick={() => setGameState('results')} className="flex items-center gap-2 font-semibold text-slate-600 hover:text-primary"><BackArrowIcon/> Back to Results</button>
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