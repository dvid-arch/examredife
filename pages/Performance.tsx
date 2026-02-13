import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PerformanceSkeleton } from '../components/Skeletons.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import apiService from '../services/apiService.ts';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, AreaChart, Area
} from 'recharts';

type TabType = 'overview' | 'mastery' | 'history';

const Performance: React.FC = () => {
    const { isAuthenticated, user, requestLogin, requestUpgrade, isLoading } = useAuth();
    const { streakHistory, streak } = useUserProgress();
    const [results, setResults] = useState<any[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            if (isAuthenticated && user?.subscription === 'pro') {
                try {
                    const storedResults = await apiService<any[]>('/data/performance');
                    // Sort results by date descending (newest first)
                    const sorted = [...storedResults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setResults(sorted);
                } catch (error) {
                    console.error("Failed to fetch performance data:", error);
                    setResults([]);
                }
            } else {
                setResults([]);
            }
            setIsDataLoading(false);
        };

        if (!isLoading) {
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
        scoreTrend, // +5, -2, etc.
    } = useMemo(() => {
        if (results.length === 0) {
            return {
                averageScore: 0,
                quizzesTaken: 0,
                bestSubject: 'N/A',
                performanceBySubject: [],
                performanceByTopic: [],
                weakSubjects: [],
                scoreTrend: 0
            };
        }

        const standardSubjects = ['Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Economics', 'Government', 'Literature', 'CRS', 'Geography', 'Commerce', 'Financial Accounting', 'Agricultural Science'];

        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const totalQuestions = results.reduce((sum, r) => sum + r.totalQuestions, 0);
        const avg = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

        // Calculate score trend (improvement since last session or overall)
        // Let's compare newest result vs average of all previous
        let trend = 0;
        if (results.length > 1) {
            const latest = (results[0].score / results[0].totalQuestions) * 100;
            const previousTotalScore = results.slice(1).reduce((sum, r) => sum + r.score, 0);
            const previousTotalQuestions = results.slice(1).reduce((sum, r) => sum + r.totalQuestions, 0);
            const previousAvg = (previousTotalScore / previousTotalQuestions) * 100;
            trend = Math.round(latest - previousAvg);
        }

        const subjectMap: Record<string, { correct: number, total: number }> = {};
        const topicMap: Record<string, { correct: number, total: number, subject: string }> = {};

        results.forEach(result => {
            if (result.topicBreakdown) {
                Object.entries(result.topicBreakdown).forEach(([key, data]: [string, any]) => {
                    const isStandard = standardSubjects.some(s => s.toLowerCase() === key.toLowerCase());

                    if (isStandard) {
                        if (!subjectMap[key]) subjectMap[key] = { correct: 0, total: 0 };
                        subjectMap[key].correct += data.correct;
                        subjectMap[key].total += data.total;
                    } else {
                        // It's a topic
                        // Try to find which subject this topic belongs to (from result.subject or metadata)
                        const topicSubject = result.subject.split(', ')[0] || 'General';
                        if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject: topicSubject };
                        topicMap[key].correct += data.correct;
                        topicMap[key].total += data.total;
                    }
                });
            } else {
                const subjects = result.subject.split(', ');
                subjects.forEach(subject => {
                    const cleanSubject = subject.trim();
                    if (!subjectMap[cleanSubject]) subjectMap[cleanSubject] = { correct: 0, total: 0 };
                    subjectMap[cleanSubject].correct += result.score / subjects.length;
                    subjectMap[cleanSubject].total += result.totalQuestions / subjects.length;
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
                subject: data.subject,
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
            scoreTrend: trend
        };
    }, [results]);

    const trendData = useMemo(() => {
        return [...results]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-15) // Last 15 sessions for better visibility
            .map(r => ({
                name: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: Math.round((r.score / r.totalQuestions) * 100),
                fullDate: new Date(r.date).toLocaleString()
            }));
    }, [results]);

    const streakDays = useMemo(() => new Set(streakHistory), [streakHistory]);
    const last30Days = useMemo(() => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    }, []);

    const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    if (isLoading || isDataLoading) return <PerformanceSkeleton />;

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto py-12">
                <Card className="text-center p-8 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Track Your Growth</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8">
                        Join thousands of students who track their progress and identify weak spots automatically.
                    </p>
                    <button onClick={requestLogin} className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:bg-accent transition-all shadow-lg shadow-primary/20">
                        Sign In to Start
                    </button>
                </Card>
            </div>
        );
    }

    if (user?.subscription === 'free') {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="text-center p-10">
                    <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Unlock Professional Analytics</h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                        Get detailed subject mastery roadmaps, AI-driven study suggestions, and track your performance trends with ExamRedi Pro.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left max-w-lg mx-auto">
                        {[
                            "Topic Mastery Roadmap",
                            "Historical Performance Trends",
                            "AI Weak Point Analysis",
                            "Consistency Tracking"
                        ].map((f, i) => (
                            <div key={i} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                <span className="text-primary font-bold">✓</span> {f}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => requestUpgrade({
                            title: "Unlock Performance Analysis",
                            message: "Elevate your study routine with deep insights.",
                            featureList: ["Topic-level mastery", "Score trends", "Weakness identification"]
                        })}
                        className="bg-primary text-white font-bold py-4 px-12 rounded-xl hover:bg-accent transition-all shadow-xl shadow-primary/20"
                    >
                        Upgrade to Pro Now
                    </button>
                </Card>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-64 h-64 mb-8 text-slate-200 dark:text-slate-800">
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2m-7 14L7 12l1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Your Journey Starts Here</h1>
                <p className="text-slate-600 dark:text-slate-400 max-w-sm mb-8">
                    Take your first practice session to generate your performance dashboard. We'll track every score for you.
                </p>
                <Link to="/practice" className="bg-primary text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                    Take a Practice Test
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header & Overview Stats */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">Student Command Center</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Transforming data into your success roadmap.</p>
                </div>
                <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                    {(['overview', 'mastery', 'history'] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Level 1: Hero Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Global Average</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-4xl font-black text-slate-800 dark:text-white">{averageScore}%</h2>
                                {scoreTrend !== 0 && (
                                    <span className={`text-sm font-bold flex items-center gap-0.5 ${scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {scoreTrend > 0 ? '↑' : '↓'}{Math.abs(scoreTrend)}%
                                    </span>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Sessions</p>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white">{quizzesTaken}</h2>
                        </Card>

                        <Card className="p-6">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Top Subject</p>
                            <h2 className="text-3xl font-black text-primary truncate">{bestSubject}</h2>
                        </Card>

                        <Card className="p-6 border-2 border-orange-500/20 bg-orange-50/10 dark:bg-orange-950/5">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Current Streak</p>
                            <h2 className="text-4xl font-black text-orange-500 flex items-center gap-2">🔥 {streak}</h2>
                        </Card>
                    </div>

                    {/* Level 2: Growth Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Score Trajectory</h3>
                                <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full font-bold">Growth Map</span>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                            formatter={(val: number) => [`${val}%`, 'Score']}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Study Consistency</h3>
                            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                                {last30Days.map(day => (
                                    <div
                                        key={day}
                                        title={day}
                                        className={`w-5 h-5 rounded-md transition-all hover:scale-125 ${streakDays.has(day)
                                            ? 'bg-primary shadow-sm shadow-primary/30'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-500 font-bold uppercase">Study Days</p>
                                    <p className="text-2xl font-black text-slate-800 dark:text-white">{streakDays.size} / 30</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-bold uppercase">Consistency</p>
                                    <p className="text-2xl font-black text-primary">{Math.round((streakDays.size / 30) * 100)}%</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Level 3: AI Recommendations */}
                    <Card className="p-8 border-l-8 border-primary bg-primary/5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">AI-Driven Insights</h3>
                                {weakSubjects.length > 0 ? (
                                    <>
                                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                            Based on your recent performance, you should focus on <span className="font-bold text-slate-800 dark:text-slate-200">{weakSubjects.join(' and ')}</span>.
                                            Our data shows that improving these areas would increase your average by up to <span className="text-primary font-bold">12%</span>.
                                        </p>
                                        <div className="flex gap-4">
                                            <Link to="/study-guides" className="text-sm font-bold text-primary hover:underline">Browse Study Guides →</Link>
                                            <Link to="/practice" className="text-sm font-bold text-primary hover:underline">Targeted Practice →</Link>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Your performance is outstanding! Maintain your average by taking a
                                        <Link to="/practice" className="font-bold text-primary mx-1 hover:underline">Full Mock Exam</Link>
                                        weekly to build endurance.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Mastery Tab */}
            {activeTab === 'mastery' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Subject Selector */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white px-1">Subject Proficiency</h3>
                        <div className="space-y-3">
                            {performanceBySubject.map((entry, idx) => (
                                <button
                                    key={entry.subject}
                                    onClick={() => setSelectedSubject(entry.subject)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedSubject === entry.subject || (!selectedSubject && idx === 0)
                                            ? 'bg-primary/10 border-primary ring-1 ring-primary/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-800 dark:text-white">{entry.subject}</span>
                                        <span className="font-bold text-primary">{Math.round(entry.average)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000"
                                            style={{ width: `${entry.average}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                                        ></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Topic Deep Dive */}
                    <div className="lg:col-span-2">
                        <Card className="p-8 h-full">
                            {(() => {
                                const currentSubject = selectedSubject || (performanceBySubject[0]?.subject);
                                const topics = performanceByTopic.filter(t => t.subject === currentSubject);

                                return (
                                    <div className="h-full flex flex-col">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{currentSubject} Mastery</h3>
                                                <p className="text-slate-500 text-sm font-medium">Topic-level breakdown based on {topics.length} recorded concepts.</p>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-lg`} style={{ backgroundColor: COLORS[performanceBySubject.findIndex(s => s.subject === currentSubject) % COLORS.length] }}>
                                                {Math.round(performanceBySubject.find(s => s.subject === currentSubject)?.average || 0)}%
                                            </div>
                                        </div>

                                        {topics.length > 0 ? (
                                            <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                                {topics.map(topic => (
                                                    <div key={topic.topic} className="group">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-slate-700 dark:text-slate-200 capitalize group-hover:text-primary transition-colors">{topic.topic}</span>
                                                                <span className={`text-[10px] font-black tracking-widest uppercase ${topic.average >= 90 ? 'text-green-500' : topic.average >= 70 ? 'text-blue-500' : 'text-orange-500'}`}>
                                                                    {topic.average >= 90 ? 'MASTERED' : topic.average >= 70 ? 'PROFICIENT' : 'NEEDS FOCUS'}
                                                                </span>
                                                            </div>
                                                            <span className="font-bold text-slate-800 dark:text-white">{Math.round(topic.average)}%</span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 p-0.5 border border-slate-200 dark:border-slate-600">
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${topic.average >= 90 ? 'bg-green-500' : topic.average >= 70 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${topic.average}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                                <p className="text-slate-500 font-medium italic">No specific topics recorded for this subject yet. Take a topic-specific test from a study guide to unlock this view.</p>
                                                <Link to="/study-guides" className="mt-4 text-primary font-bold hover:underline">Go to Study Guides →</Link>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </Card>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <Card className="overflow-hidden border-0 shadow-xl">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Complete Quiz Log</h3>
                        <p className="text-slate-500 text-sm font-medium italic">{results.length} sessions recorded</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead>
                                <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Type / Exam</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject(s)</th>
                                    <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Performance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {results.map((result, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group">
                                        <td className="p-6">
                                            <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{new Date(result.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </td>
                                        <td className="p-6">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                                                {result.metadata?.exam || result.metadata?.title || result.exam || 'Practice'}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                                                {result.metadata?.year || result.year || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{result.subject}</p>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 min-w-[100px] bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${Math.round(result.score / result.totalQuestions * 100)}%` }}></div>
                                                </div>
                                                <span className="font-black text-primary text-sm whitespace-nowrap">
                                                    {Math.round(result.score / result.totalQuestions * 100)}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold tracking-tight">{result.score} / {result.totalQuestions} Questions</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Performance;