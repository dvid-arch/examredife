
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { pastPapersData } from '../data/pastQuestions.ts';
import { ChallengeQuestion } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';

// --- ICONS ---
const TrophyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-4-4h2a2 2 0 012 2v4a2 2 0 01-2 2h-2m-4 4H5a2 2 0 01-2-2v-4a2 2 0 012-2h2" /></svg>;
const StopwatchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// --- CONSTANTS ---
const QUESTIONS_PER_GAME = 10;
const TIME_PER_QUESTION = 15;

// --- HELPERS ---
const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);
const subjects = [...new Set(pastPapersData.map(p => p.subject))].sort();

const SubjectSprintGame: React.FC = () => {
    const [gameState, setGameState] = useState<'selection' | 'playing' | 'results'>('selection');
    const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerStatus, setAnswerStatus] = useState<'correct' | 'incorrect' | 'unanswered' | null>(null);

    const goToNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setTimeLeft(TIME_PER_QUESTION);
            setSelectedAnswer(null);
            setAnswerStatus(null);
        } else {
            setGameState('results');
        }
    };

    useEffect(() => {
        if (gameState !== 'playing' || answerStatus) return;

        if (timeLeft === 0) {
            setAnswerStatus('unanswered');
            const timer = setTimeout(goToNextQuestion, 2000);
            return () => clearTimeout(timer);
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [gameState, timeLeft, answerStatus]);


    const startGame = (subject: string) => {
        const subjectQuestions = pastPapersData
            .filter(p => p.subject === subject)
            .flatMap(paper => paper.questions.map(q => ({ ...q, subject })));
        
        const gameQuestions = shuffleArray(subjectQuestions).slice(0, QUESTIONS_PER_GAME);
        setQuestions(gameQuestions);
        setCurrentQuestionIndex(0);
        setScore(0);
        setTimeLeft(TIME_PER_QUESTION);
        setSelectedAnswer(null);
        setAnswerStatus(null);
        setGameState('playing');
    };
    
    const handleAnswerSelect = (optionKey: string) => {
        if (answerStatus) return;

        setSelectedAnswer(optionKey);
        const currentQuestion = questions[currentQuestionIndex];
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
        setGameState('selection');
    };

    const renderSelectionScreen = () => (
        <Card className="text-center p-6">
            <StopwatchIcon />
            <h1 className="text-3xl font-bold text-slate-800 mt-4">Subject Sprint</h1>
            <p className="text-slate-600 mt-2 mb-6 max-w-md mx-auto">Choose a subject and answer {QUESTIONS_PER_GAME} questions as fast as you can. The quicker you answer correctly, the more points you get!</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {subjects.map(subject => (
                    <button
                        key={subject}
                        onClick={() => startGame(subject)}
                        className="p-4 bg-white border-2 border-gray-200 rounded-lg font-semibold text-slate-700 hover:border-primary hover:bg-primary-light hover:text-primary transition-all duration-200"
                    >
                        {subject}
                    </button>
                ))}
            </div>
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
