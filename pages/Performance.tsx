import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PerformanceSkeleton } from '../components/Skeletons.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import apiService from '../services/apiService.ts';
import { OverviewTab } from '../components/performance/OverviewTab.tsx';
import { MasteryTab } from '../components/performance/MasteryTab.tsx';
import { HistoryTab } from '../components/performance/HistoryTab.tsx';
import { SUBJECTS, isSubject, getSubjectKey } from '../constants/subjects.ts';
import useSEO from '../hooks/useSEO.ts';

type TabType = 'overview' | 'mastery' | 'history';

const Performance: React.FC = () => {
    const { isAuthenticated, user, requestLogin, requestUpgrade, isLoading } = useAuth();

    useSEO({
        title: "My Performance",
        description: "Detailed analytics and mastery breakdown of your study progress on ExamRedi."
    });
    const { streakHistory, streak } = useUserProgress();
    const [results, setResults] = useState<any[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

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

        const preferredSubjects = user?.preferredSubjects || [];

        // Filter results specifically for preferred subjects to calculate core metrics
        const coreResults = results.filter(r => {
            if (preferredSubjects.length === 0) return true; // If none selected, include all
            const rSubjects = (r.subject || '').split(',').map((s: string) => s.trim().toLowerCase());
            return preferredSubjects.some(ps => rSubjects.includes(ps.toLowerCase()));
        });

        const totalScore = coreResults.reduce((sum, r) => sum + r.score, 0);
        const totalQuestions = coreResults.reduce((sum, r) => sum + r.totalQuestions, 0);
        const avg = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;

        let trend = 0;
        if (coreResults.length > 1) {
            const latest = (coreResults[0].score / coreResults[0].totalQuestions) * 100;
            const previousTotalScore = coreResults.slice(1).reduce((sum, r) => sum + r.score, 0);
            const previousTotalQuestions = coreResults.slice(1).reduce((sum, r) => sum + r.totalQuestions, 0);
            const previousAvg = (previousTotalScore / previousTotalQuestions) * 100;
            trend = Math.round(latest - previousAvg);
        }

        const subjectMap: Record<string, { correct: number, total: number }> = {};
        const topicMap: Record<string, { correct: number, total: number, subject: string }> = {};

        results.forEach(result => {
            if (result.topicBreakdown) {
                Object.entries(result.topicBreakdown).forEach(([key, data]: [string, any]) => {
                    const subjectKey = getSubjectKey(key);

                    if (subjectKey) {
                        const sName = SUBJECTS[subjectKey].name;
                        // Only add to map if it's a preferred subject
                        if (preferredSubjects.length === 0 || preferredSubjects.some(ps => ps.toLowerCase() === sName.toLowerCase())) {
                            if (!subjectMap[sName]) subjectMap[sName] = { correct: 0, total: 0 };
                            subjectMap[sName].correct += data.correct;
                            subjectMap[sName].total += data.total;
                        }
                    } else {
                        const firstSubject = result.subject.split(', ')[0] || 'General';
                        const parentSubjectKey = getSubjectKey(firstSubject);
                        const topicSubject = parentSubjectKey ? SUBJECTS[parentSubjectKey].name : 'General';

                        if (preferredSubjects.length === 0 || preferredSubjects.some(ps => ps.toLowerCase() === topicSubject.toLowerCase())) {
                            if (!topicMap[key]) topicMap[key] = { correct: 0, total: 0, subject: topicSubject };
                            topicMap[key].correct += data.correct;
                            topicMap[key].total += data.total;
                        }
                    }
                });
            } else {
                const subjects = result.subject.split(', ');
                subjects.forEach((subject: string) => {
                    const subjectKey = getSubjectKey(subject);
                    const subjectName = subjectKey ? SUBJECTS[subjectKey].name : subject.trim();
                    if (preferredSubjects.length === 0 || preferredSubjects.some(ps => ps.toLowerCase() === subjectName.toLowerCase())) {
                        if (!subjectMap[subjectName]) subjectMap[subjectName] = { correct: 0, total: 0 };
                        subjectMap[subjectName].correct += result.score / subjects.length;
                        subjectMap[subjectName].total += result.totalQuestions / subjects.length;
                    }
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
            quizzesTaken: coreResults.length,
            bestSubject: subjectAverages.length > 0 ? subjectAverages[0].subject : 'N/A',
            performanceBySubject: subjectAverages,
            performanceByTopic: topicAverages,
            weakSubjects: subjectAverages.filter(s => s.average < 60).map(s => s.subject),
            scoreTrend: trend
        };
    }, [results, user?.preferredSubjects]);

    const { estimatedScore } = useUserProgress();

    const trendData = useMemo(() => {
        const preferredSubjects = user?.preferredSubjects || [];
        return [...results]
            .filter(r => {
                if (preferredSubjects.length === 0) return true;
                const rSubjects = (r.subject || '').split(',').map((s: string) => s.trim().toLowerCase());
                return preferredSubjects.some(ps => rSubjects.includes(ps.toLowerCase()));
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-15) // Last 15 sessions for better visibility
            .map(r => ({
                name: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: Math.round((r.score / r.totalQuestions) * 100),
                fullDate: new Date(r.date).toLocaleString()
            }));
    }, [results, user?.preferredSubjects]);

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

    // Helper to get color for a subject safely
    const getSubjectColor = (subjectName: string, index: number) => {
        const key = getSubjectKey(subjectName);
        return key ? SUBJECTS[key].color : COLORS[index % COLORS.length];
    };

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
                <OverviewTab
                    estimatedScore={estimatedScore}
                    streak={streak}
                    quizzesTaken={quizzesTaken}
                    weakSubjects={weakSubjects}
                    scoreTrend={scoreTrend}
                    trendData={trendData}
                    last30Days={last30Days}
                    streakDays={streakDays}
                    preferredSubjects={user?.preferredSubjects || []}
                    performanceBySubject={performanceBySubject}
                />
            )}

            {/* Mastery Tab */}
            {activeTab === 'mastery' && (
                <MasteryTab
                    performanceBySubject={performanceBySubject}
                    performanceByTopic={performanceByTopic}
                />
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
                <HistoryTab results={results} />
            )}
        </div>
    );
};

export default Performance;