import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { QuizResult } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import apiService from '../services/apiService.ts';


const Performance: React.FC = () => {
    const { isAuthenticated, user, requestLogin, requestUpgrade, isLoading } = useAuth();
    const [results, setResults] = useState<QuizResult[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (isAuthenticated && user?.subscription === 'pro') {
                try {
                    const storedResults = await apiService<QuizResult[]>('/data/performance');
                    setResults(storedResults);
                } catch (error) {
                    console.error("Failed to fetch performance data:", error);
                    setResults([]);
                }
            } else {
                setResults([]);
            }
             setIsDataLoading(false);
        };
        
        if (!isLoading) { // Only fetch when auth state is resolved
            fetchResults();
        }
    }, [isAuthenticated, user, isLoading]);

    const {
        averageScore,
        quizzesTaken,
        bestSubject,
        performanceBySubject,
        weakSubjects,
    } = useMemo(() => {
        if (results.length === 0) {
            return {
                averageScore: 0,
                quizzesTaken: 0,
                bestSubject: 'N/A',
                performanceBySubject: {},
                weakSubjects: [],
            };
        }

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
        const avg = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

        const bySubject = results.reduce<Record<string, { scores: number[]; totalQuestions: number }>>((acc, result) => {
            const subjects = result.subject.split(', ');
            subjects.forEach(subject => {
                 if (!acc[subject]) {
                    acc[subject] = { scores: [], totalQuestions: 0 };
                }
                // Approximate score for multi-subject tests
                acc[subject].scores.push(result.score / subjects.length);
                acc[subject].totalQuestions += result.totalQuestions / subjects.length;
            });
            return acc;
        }, {});

        const subjectAverages = Object.keys(bySubject).map((subject) => {
            const data = bySubject[subject];
            const totalScored = data.scores.reduce((sum, s) => sum + s, 0);
            return {
                subject,
                average: data.totalQuestions > 0 ? (totalScored / data.totalQuestions) * 100 : 0,
            };
        });

        subjectAverages.sort((a, b) => b.average - a.average);

        return {
            averageScore: Math.round(avg),
            quizzesTaken: results.length,
            bestSubject: subjectAverages.length > 0 ? subjectAverages[0].subject : 'N/A',
            performanceBySubject: subjectAverages,
            weakSubjects: subjectAverages.filter(s => s.average < 60).map(s => s.subject),
        };
    }, [results]);

    if (isLoading || isDataLoading) {
        return <div className="flex justify-center items-center h-full"><Card><p className="p-8">Loading performance data...</p></Card></div>;
    }

    if (!isAuthenticated) {
        requestLogin();
        return <div className="flex justify-center items-center h-full"><Card><p className="p-8">Please log in to view your performance.</p></Card></div>;
    }

    if (user?.subscription === 'free') {
        return (
            <Card className="text-center p-8 flex flex-col items-center justify-center h-full">
                <div className="bg-primary-light text-primary rounded-full p-4 inline-block mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Unlock Performance Analysis</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6 max-w-md">Track your progress, identify weak spots, and see detailed analytics by upgrading to ExamRedi Pro.</p>
                <button 
                    onClick={() => requestUpgrade({
                        title: "Unlock Performance Analysis",
                        message: "Go beyond just scores. Get detailed insights into your study habits and areas for improvement with ExamRedi Pro.",
                        featureList: [
                            "Track your average score over time",
                            "Identify your strongest and weakest subjects",
                            "Get personalized feedback and recommendations",
                            "View your complete quiz history"
                        ]
                    })}
                    className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors"
                >
                    Upgrade to Pro
                </button>
            </Card>
        );
    }


    if (results.length === 0) {
        return (
            <Card className="text-center p-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">No Performance Data Yet</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2 mb-6">Complete a quiz or practice session to see your analysis here.</p>
                <Link to="/practice" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                    Start a Practice Session
                </Link>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Performance Analysis</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                    <p className="text-slate-600 dark:text-slate-400">Average Score</p>
                    <p className="text-4xl font-extrabold text-primary">{averageScore}%</p>
                </Card>
                 <Card className="text-center">
                    <p className="text-slate-600 dark:text-slate-400">Quizzes Taken</p>
                    <p className="text-4xl font-extrabold text-primary">{quizzesTaken}</p>
                </Card>
                 <Card className="text-center">
                    <p className="text-slate-600 dark:text-slate-400">Best Subject</p>
                    <p className="text-4xl font-extrabold text-primary">{bestSubject}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">Performance by Subject</h2>
                    <div className="space-y-4">
                        {Array.isArray(performanceBySubject) && performanceBySubject.map(({ subject, average }) => (
                            <div key={subject}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{subject}</span>
                                    <span className="font-semibold text-primary">{Math.round(average)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                    <div className="bg-primary h-4 rounded-full" style={{ width: `${average}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">Personalized Feedback</h2>
                    {weakSubjects.length > 0 ? (
                        <div>
                            <p className="text-slate-600 dark:text-slate-400 mb-3">You're doing great! To improve even more, focus on these areas:</p>
                            <ul className="list-disc list-inside space-y-2">
                                {weakSubjects.map(subject => (
                                    <li key={subject} className="font-semibold text-slate-700 dark:text-slate-200">{subject}</li>
                                ))}
                            </ul>
                            <p className="text-slate-600 dark:text-slate-400 mt-4">Try reviewing the <Link to="/study-guides" className="text-primary font-semibold underline">Study Guides</Link> for these topics.</p>
                        </div>
                    ) : (
                         <p className="text-slate-600 dark:text-slate-400">Excellent work! You're showing strong performance across all subjects. Keep up the consistent practice!</p>
                    )}
                </Card>
            </div>

             <Card>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">Quiz History</h2>
                <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr>
                                <th scope="col" className="p-4 font-semibold text-slate-600 dark:text-slate-400">Date</th>
                                <th scope="col" className="p-4 font-semibold text-slate-600 dark:text-slate-400">Subject(s)</th>
                                <th scope="col" className="p-4 font-semibold text-slate-600 dark:text-slate-400">Exam</th>
                                <th scope="col" className="p-4 font-semibold text-slate-600 dark:text-slate-400">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.sort((a, b) => b.completedAt - a.completedAt).map(result => (
                                <tr key={result.completedAt} className="border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-slate-700 dark:text-slate-300">{new Date(result.completedAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200 break-words">{result.subject}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300 break-words">{result.exam}</td>
                                    <td className="p-4 font-medium text-primary">{result.score}/{result.totalQuestions} ({Math.round(result.score / result.totalQuestions * 100)}%)</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default Performance;