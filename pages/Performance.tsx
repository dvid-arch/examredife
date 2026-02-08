import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PerformanceSkeleton } from '../components/Skeletons.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import apiService from '../services/apiService.ts';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

const Performance: React.FC = () => {
    const { isAuthenticated, user, requestLogin, requestUpgrade, isLoading } = useAuth();
    const { streakHistory, streak } = useUserProgress();
    const [results, setResults] = useState<any[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (isAuthenticated && user?.subscription === 'pro') {
                try {
                    const storedResults = await apiService<any[]>('/data/performance');
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
        performanceByTopic,
        weakSubjects,
    } = useMemo(() => {
        if (results.length === 0) {
            return {
                averageScore: 0,
                quizzesTaken: 0,
                bestSubject: 'N/A',
                performanceBySubject: [],
                performanceByTopic: [],
                weakSubjects: [],
            };
        }

        const standardSubjects = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Economics', 'Government', 'Literature', 'CRS', 'Geography', 'Commerce', 'Financial Accounting', 'Agricultural Science'];

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
        const avg = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

        // Process topicBreakdown for new results
        const subjectMap: Record<string, { correct: number, total: number }> = {};
        const topicMap: Record<string, { correct: number, total: number }> = {};

        results.forEach(result => {
            if (result.topicBreakdown) {
                Object.entries(result.topicBreakdown).forEach(([key, data]: [string, any]) => {
                    const isStandard = standardSubjects.some(s => s.toLowerCase() === key.toLowerCase());
                    const targetMap = isStandard ? subjectMap : topicMap;

                    if (!targetMap[key]) targetMap[key] = { correct: 0, total: 0 };
                    targetMap[key].correct += data.correct;
                    targetMap[key].total += data.total;
                });
            } else {
                // Fallback for old results (usually just have .subject string)
                const subjects = result.subject.split(', ');
                subjects.forEach(subject => {
                    if (!subjectMap[subject]) subjectMap[subject] = { correct: 0, total: 0 };
                    subjectMap[subject].correct += result.score / subjects.length;
                    subjectMap[subject].total += result.totalQuestions / subjects.length;
                });
            }
        });

        const subjectAverages = Object.keys(subjectMap).map((subject) => {
            const data = subjectMap[subject];
            return {
                subject,
                average: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                total: data.total
            };
        });

        const topicAverages = Object.keys(topicMap).map((topic) => {
            const data = topicMap[topic];
            return {
                topic,
                average: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                total: data.total
            };
        });

        subjectAverages.sort((a, b) => b.average - a.average);
        topicAverages.sort((a, b) => b.average - a.average);

        return {
            averageScore: Math.round(avg),
            quizzesTaken: results.length,
            bestSubject: subjectAverages.length > 0 ? subjectAverages[0].subject : 'N/A',
            performanceBySubject: subjectAverages,
            performanceByTopic: topicAverages,
            weakSubjects: subjectAverages.filter(s => s.average < 60).map(s => s.subject),
        };
    }, [results]);

    const trendData = useMemo(() => {
        return [...results]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-10) // Last 10 sessions
            .map(r => ({
                name: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: Math.round((r.score / r.totalQuestions) * 100),
                fullDate: new Date(r.date).toLocaleString()
            }));
    }, [results]);

    // Streak Calendar Helper
    const streakDays = useMemo(() => {
        return new Set(streakHistory);
    }, [streakHistory]);

    const last30Days = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }, []);

    const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (isLoading || isDataLoading) {
        return <PerformanceSkeleton />;
    }

    if (!isAuthenticated) {
        return (
            <Card className="text-center p-8 flex flex-col items-center justify-center h-full max-w-md mx-auto">
                <div className="mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Track Your Progress</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">
                        Sign in to view your performance analytics, track your scores, and identify areas for improvement.
                    </p>
                </div>
                <button
                    onClick={requestLogin}
                    className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-accent transition-colors mb-4"
                >
                    Sign In to View Performance
                </button>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account? <button onClick={requestLogin} className="text-primary hover:underline">Create one</button>
                </p>
            </Card>
        );
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
            <Card className="text-center p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-64 h-64 mb-6 relative">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-primary/10" fill="currentColor">
                        <path d="M40 160 L160 160 L160 40 L40 40 Z" />
                        <circle cx="100" cy="100" r="50" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-primary animate-bounce-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Ready to Track Progress?</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">Complete your first quiz or practice session to unlock powerful performance analytics and subject mastery tracking.</p>
                <Link to="/practice" className="bg-primary text-white font-bold py-3.5 px-10 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-primary/20 hover:scale-105 active:scale-95">
                    Find Your First Practice
                </Link>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Performance Analysis</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="text-center flex flex-col justify-center py-6">
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1 text-sm">Average Score</p>
                    <p className="text-4xl font-extrabold text-primary">{averageScore}%</p>
                </Card>
                <Card className="text-center flex flex-col justify-center py-6">
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1 text-sm">Quizzes Taken</p>
                    <p className="text-4xl font-extrabold text-primary">{quizzesTaken}</p>
                </Card>
                <Card className="text-center flex flex-col justify-center py-6">
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1 text-sm">Best Subject</p>
                    <p className="text-2xl font-extrabold text-primary truncate px-2">{bestSubject}</p>
                </Card>
                <Card className="text-center flex flex-col justify-center py-6 border-2 border-primary/20">
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mb-1 text-sm">Active Streak</p>
                    <p className="text-4xl font-extrabold text-orange-500">🔥 {streak}</p>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4 flex items-center gap-2">
                    <span>📅</span> Study Consistency (Last 30 Days)
                </h2>
                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                    {last30Days.map(day => (
                        <div
                            key={day}
                            title={day}
                            className={`w-4 h-4 rounded-sm transition-colors ${streakDays.has(day)
                                ? 'bg-primary'
                                : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                        />
                    ))}
                </div>
                <div className="mt-4 flex justify-between items-center text-xs text-slate-500">
                    <p>Total Study Days: <span className="font-bold text-primary">{streakDays.size}</span></p>
                    <div className="flex items-center gap-2">
                        <span>Less</span>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm"></div>
                            <div className="w-3 h-3 bg-primary rounded-sm"></div>
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-6">Score Trend (Last 10 Sessions)</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${value}%`, 'Score']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#22c55e"
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-6">Subject Proficiency</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceBySubject} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis
                                    dataKey="subject"
                                    type="category"
                                    stroke="#64748B"
                                    fontSize={12}
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`${Math.round(value)}%`, 'Average']}
                                />
                                <Bar dataKey="average" radius={[0, 4, 4, 0]} barSize={20}>
                                    {performanceBySubject.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className={`grid grid-cols-1 ${performanceByTopic.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
                <Card>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">Subject Mastery</h2>
                    <div className="space-y-4">
                        {Array.isArray(performanceBySubject) && performanceBySubject.map(({ subject, average }, index) => (
                            <div key={subject}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{subject}</span>
                                    <span className="font-semibold text-primary">{Math.round(average)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                                    <div className="h-4 rounded-full" style={{ width: `${average}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {performanceByTopic.length > 0 && (
                    <Card>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50 mb-4">Topic Mastery</h2>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {performanceByTopic.map(({ topic, average }, index) => (
                                <div key={topic}>
                                    <div className="flex justify-between mb-1">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{topic}</span>
                                            <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Specific Topic</span>
                                        </div>
                                        <span className="font-semibold text-primary">{Math.round(average)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                                        <div className="h-2 rounded-full bg-primary" style={{ width: `${average}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

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
                            {results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(result => (
                                <tr key={result._id || result.date} className="border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4 text-slate-700 dark:text-slate-300">{new Date(result.date).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200 break-words">{result.subject}</td>
                                    <td className="p-4 text-slate-700 dark:text-slate-300 break-words">
                                        {result.metadata?.exam || result.metadata?.title || result.exam || 'Practice'} ({result.metadata?.year || result.year || 'N/A'})
                                    </td>
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