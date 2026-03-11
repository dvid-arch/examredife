import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card.tsx';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.tsx';

interface QuizResultsProps {
    finalScore: number;
    totalQuestions: number;
    topicBreakdown: Record<string, { correct: number, total: number }>;
    isAuthenticated: boolean;
    requestLogin: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
    finalScore,
    totalQuestions,
    topicBreakdown,
    isAuthenticated,
    requestLogin
}) => {
    const { user } = useAuth();
    const isPro = user?.subscription === 'pro' || user?.role === 'admin';
    const percentage = Math.round((finalScore / totalQuestions) * 100);

    const feedback = useMemo(() => {
        if (percentage === 100) return { title: 'Mastery Achieved! 🏆', sub: "You've completely mastered this set. You're ready for the big stage!", color: 'text-green-500' };
        if (percentage >= 80) return { title: 'Outstanding! 🌟', sub: "Excellent work. You're showing strong command of these concepts.", color: 'text-blue-500' };
        if (percentage >= 50) return { title: 'Great Effort! 👍', sub: "You're getting there! A bit more practice on your weak spots will make you unstoppable.", color: 'text-primary' };
        return { title: 'Keep Pushing! 💪', sub: "Every expert was once a beginner. Let's review the topics below and try again.", color: 'text-orange-500' };
    }, [percentage]);

    const weakestTopic = useMemo(() => {
        let weakest = null;
        let lowestAcc = 1.1;

        for (const [name, stats] of Object.entries(topicBreakdown)) {
            const acc = stats.correct / stats.total;
            if (acc < lowestAcc) {
                lowestAcc = acc;
                weakest = name;
            }
        }
        return weakest;
    }, [topicBreakdown]);

    return (
        <div className="min-h-full bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center animate-in fade-in duration-500">
            <div className="max-w-4xl w-full space-y-8 pb-12">

                {/* Hero Card: Celebratory Reveal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 20 }}
                >
                    <Card className="p-8 sm:p-12 text-center relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className={`absolute top-0 left-0 w-full h-2 ${feedback.color.replace('text', 'bg')}`} />

                        <div className="relative z-10">
                            <h1 className={`text-3xl sm:text-4xl font-black mb-2 ${feedback.color}`}>{feedback.title}</h1>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 font-medium">{feedback.sub}</p>

                            <div className="flex justify-center items-baseline gap-2 mb-8">
                                <span className={`text-8xl sm:text-9xl font-black tracking-tighter ${feedback.color}`}>{percentage}%</span>
                                <span className="text-2xl text-slate-400 font-bold uppercase tracking-widest">Score</span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-4">
                                <Link to="/practice" replace className="bg-slate-800 dark:bg-slate-700 text-white font-bold py-4 px-8 rounded-xl hover:bg-black transition-all shadow-xl active:scale-95">
                                    New Practice
                                </Link>
                                <Link to="/performance" replace className="bg-primary text-white font-bold py-4 px-10 rounded-xl hover:bg-accent transition-all shadow-xl shadow-primary/20 active:scale-95">
                                    Full Analysis
                                </Link>
                            </div>
                        </div>

                        {/* Confetti-like decoration for high scores */}
                        {percentage >= 90 && (
                            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="absolute animate-bounce"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                            animationDelay: `${Math.random() * 2}s`,
                                            fontSize: `${Math.random() * 20 + 10}px`
                                        }}
                                    >
                                        ✨
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Topic Breakdown (60%) */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-3 space-y-4"
                    >
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white px-1">Detailed Breakdown</h3>
                        <div className="grid grid-cols-1 gap-4 relative">
                            {Object.entries(topicBreakdown).sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total)).map(([topic, stats], index) => {
                                const acc = Math.round((stats.correct / stats.total) * 100);
                                const isBestTopic = index === 0;
                                const isBlurred = !isPro && !isBestTopic && Object.keys(topicBreakdown).length > 1;

                                return (
                                    <Card
                                        key={topic}
                                        className={`p-5 border-slate-100 dark:border-slate-800 transition-all ${isBlurred ? 'opacity-40 blur-[2px] pointer-events-none' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{topic}</span>
                                            <span className={`font-black ${acc >= 80 ? 'text-green-500' : acc >= 50 ? 'text-primary' : 'text-orange-500'}`}>
                                                {stats.correct} / {stats.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg h-2.5 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${acc}%` }}
                                                className={`h-full ${acc >= 80 ? 'bg-green-500' : acc >= 50 ? 'bg-primary' : 'bg-orange-500'}`}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}

                            {!isPro && Object.keys(topicBreakdown).length > 1 && (
                                <div className="absolute inset-0 top-[120px] bg-gradient-to-t from-slate-50 dark:from-slate-950 via-transparent to-transparent flex items-center justify-center p-8">
                                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-primary/20 text-center max-w-xs transform translate-y-12">
                                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white mb-2">Unlock Topic Breakdown</h4>
                                        <p className="text-xs text-slate-500 mb-4">Upgrade to Pro to identify exactly where you are failing and get AI study hacks for those topics.</p>
                                        <Link to="/settings" className="block w-full bg-primary text-white font-bold py-2 rounded-lg text-sm hover:opacity-90 transition-all">
                                            Upgrade Now
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Right: Insights & Upsell (40%) */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white px-1">Recommendations</h3>

                        {weakestTopic && (
                            <Card className="p-6 bg-primary/5 border-primary/20 border-2">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center shrink-0">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white leading-tight">Focus on {weakestTopic}</h4>
                                        <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Suggested Study</p>
                                    </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                    Your performance on <span className="font-bold text-slate-800 dark:text-slate-200">{weakestTopic}</span> suggests a knowledge gap. Reviewing the study guide could help bridge this.
                                </p>
                                <Link to={`/study-guides`} className="w-full inline-block text-center bg-white dark:bg-slate-800 text-primary font-bold py-3 px-4 rounded-lg border border-primary/20 hover:bg-primary hover:text-white transition-all">
                                    Open Study Guide
                                </Link>
                            </Card>
                        )}

                        {!isAuthenticated && (
                            <Card className="p-6 bg-slate-800 text-white">
                                <h4 className="font-bold mb-2">Save this result?</h4>
                                <p className="text-slate-400 text-xs mb-6">Log in to track this score and earn mastery trophies for your performance dashboard.</p>
                                <button onClick={requestLogin} className="w-full bg-white text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-100 transition-all">
                                    Login to Save
                                </button>
                            </Card>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default QuizResults;
