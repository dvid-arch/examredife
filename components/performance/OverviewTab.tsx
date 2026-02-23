import React from 'react';
import { Link } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Card from '../../components/Card.tsx';
import { getSubjectKey, SUBJECTS } from '../../constants/subjects.ts';

interface OverviewTabProps {
    estimatedScore: number;
    streak: number;
    quizzesTaken: number;
    weakSubjects: string[];
    scoreTrend: number;
    trendData: any[];
    last30Days: string[];
    streakDays: Set<string>;
    preferredSubjects: string[];
    performanceBySubject: { subject: string, average: number, total: number }[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    estimatedScore,
    streak,
    quizzesTaken,
    weakSubjects,
    scoreTrend,
    trendData,
    last30Days,
    streakDays,
    preferredSubjects,
    performanceBySubject
}) => {

    const getSubjectColor = (subjectName: string, index: number) => {
        const key = getSubjectKey(subjectName);
        const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
        return key ? SUBJECTS[key].color : COLORS[index % COLORS.length];
    };

    // Calculate estimated UTME score per subject (Base 35, Max 100)
    // based on their performance average if they have one.
    const getEstimatedSubjectScore = (subjectName: string) => {
        const perf = performanceBySubject.find(s => s.subject.toLowerCase() === subjectName.toLowerCase());
        const proficiency = perf ? perf.average : 0;
        return Math.min(Math.round(35 + (proficiency / 100) * 65), 100);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Split Top Section: Big Hero Score & 4 Subjects Quadrant */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Overall Estimated Score */}
                <div className="lg:col-span-5 flex flex-col">
                    <Card className="p-8 h-full flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest mb-2 z-10">Estimated UTME Score</p>

                        <div className="relative flex items-center justify-center mb-4 z-10 w-full">
                            <h2 className="text-7xl lg:text-8xl font-black text-slate-800 dark:text-white tracking-tighter drop-shadow-sm">
                                {estimatedScore}
                                <span className="text-2xl lg:text-3xl text-slate-400 font-bold tracking-normal ml-1">/400</span>
                            </h2>
                        </div>

                        <div className="flex items-center gap-4 z-10 mt-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/50 dark:border-slate-700/50">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase font-black tracking-wider mb-0.5">Sessions</p>
                                <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{quizzesTaken}</p>
                            </div>
                            <div className="w-px h-8 bg-slate-300 dark:bg-slate-700"></div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase font-black tracking-wider mb-0.5">Current Streak</p>
                                <p className="text-xl font-bold text-orange-500 flex items-center justify-center gap-1">🔥 {streak}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right: Chosen Subjects Quadrant */}
                <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 uppercase tracking-tight">Your Core Subjects</h3>
                        <Link to="/profile" className="text-xs font-bold text-primary hover:underline">Edit Subjects</Link>
                    </div>
                    {preferredSubjects.length === 4 ? (
                        <div className="grid grid-cols-2 gap-4 h-[calc(100%-2.5rem)]">
                            {preferredSubjects.map((subject, idx) => {
                                const score = getEstimatedSubjectScore(subject);
                                const color = getSubjectColor(subject, idx);

                                return (
                                    <div key={subject} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between group transition-all hover:border-slate-300 dark:hover:border-slate-600">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg tracking-tight leading-tight pr-2">
                                                {subject}
                                            </h4>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}20`, color }}>
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="mt-auto">
                                            <div className="flex items-end justify-between mb-2">
                                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100 leading-none tracking-tighter">{score}</span>
                                                <span className="text-xs font-bold text-slate-400 pb-1">/ 100</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${score}%`, backgroundColor: color }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-[calc(100%-2.5rem)] rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-slate-500 font-medium text-center mb-4">You have not selected 4 core subjects yet.</p>
                            <Link to="/profile" className="bg-primary text-white font-bold py-2 px-6 rounded-xl hover:bg-accent transition-all">Go Select Subjects</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Middle Section: Growth Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Score Trajectory</h3>
                        <div className="flex items-center gap-3">
                            {scoreTrend !== 0 && (
                                <span className={`text-sm font-bold flex items-center gap-0.5 ${scoreTrend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {scoreTrend > 0 ? '↑' : '↓'} {Math.abs(scoreTrend)}% trend
                                </span>
                            )}
                            <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">Growth Map</span>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'var(--tw-prose-body, white)', color: '#0f172a' }}
                                    formatter={(val: number) => [`${val}%`, 'Score']}
                                />
                                <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Study Consistency</h3>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start mb-8">
                            {last30Days.map(day => (
                                <div
                                    key={day}
                                    title={day}
                                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg transition-all hover:scale-125 ${streakDays.has(day)
                                        ? 'bg-primary shadow-sm shadow-primary/30'
                                        : 'bg-slate-100 dark:bg-slate-800'
                                        }`}
                                />
                            ))}
                        </div>
                        <div className="mt-auto p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Study Days</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-white">{streakDays.size} <span className="text-lg text-slate-400 font-bold">/ 30</span></p>
                            </div>
                            <div className="w-px h-10 bg-slate-200 dark:bg-slate-700"></div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Consistency</p>
                                <p className="text-2xl font-black text-primary">{Math.round((streakDays.size / 30) * 100)}%</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Bottom Section: AI Recommendations */}
            <Card className="p-0 border-none bg-gradient-to-r from-primary to-indigo-600 shadow-xl shadow-primary/20 overflow-hidden relative">
                <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] bg-white/10 blur-3xl rotate-12 transform-gpu"></div>
                <div className="p-8 sm:p-10 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="w-16 h-16 bg-white shrink-0 rounded-[1.5rem] flex items-center justify-center shadow-lg rotate-3">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                <rect x="0" y="0" width="24" height="24" stroke="none" /> {/* Hidden transparent rect bounds box */}
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-white mb-2">Targeted Action Plan</h3>
                            {weakSubjects.length > 0 ? (
                                <p className="text-white/90 leading-relaxed font-medium">
                                    To push your Estimated Score higher, focus your efforts on <span className="font-bold underline decoration-white/50 underline-offset-4">{weakSubjects.slice(0, 2).join(' and ')}</span>.
                                    Mastering weak topics here can dramatically bump your 400-point total.
                                </p>
                            ) : (
                                <p className="text-white/90 leading-relaxed font-medium">
                                    Your 4 core subjects are performing exceptionally well. Keep maintaining this momentum with comprehensive mock exams.
                                </p>
                            )}
                        </div>
                        <div className="shrink-0 flex flex-col gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                            <Link to="/study-guides" className="bg-white text-primary text-center font-bold py-3 px-6 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md">
                                Deep Dive Concepts
                            </Link>
                            <Link to="/practice" className="bg-transparent border-2 border-white/30 text-white text-center font-bold py-3 px-6 rounded-xl hover:bg-white/10 transition-all">
                                Take a Practice Test
                            </Link>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
