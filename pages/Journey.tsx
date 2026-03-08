
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import useSEO from '../hooks/useSEO.ts';

const Journey: React.FC = () => {
    const { recentActivity } = useUserProgress();

    useSEO({
        title: "My Learning Journey",
        description: "Track your study progress and activities on ExamRedi."
    });
    const [filter, setFilter] = useState<'all' | 'quiz' | 'guide' | 'game'>('all');

    const filteredActivity = useMemo(() => {
        if (filter === 'all') return recentActivity;
        return recentActivity.filter(a => a.type === filter);
    }, [recentActivity, filter]);

    const groupedActivity = useMemo(() => {
        const groups: { [key: string]: typeof recentActivity } = {};
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;

        filteredActivity.forEach(activity => {
            const date = new Date(activity.timestamp);
            const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

            let groupTitle = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            if (activityDate === today) groupTitle = 'Today';
            else if (activityDate === yesterday) groupTitle = 'Yesterday';

            if (!groups[groupTitle]) groups[groupTitle] = [];
            groups[groupTitle].push(activity);
        });

        return Object.entries(groups);
    }, [filteredActivity]);

    const getIcon = (type: string) => {
        switch (type) {
            case 'quiz': return '📝';
            case 'guide': return '📖';
            case 'game': return '🎮';
            default: return '📍';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'quiz': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'guide': return 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400';
            case 'game': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Study Journey</h1>
                    <p className="text-slate-500 dark:text-slate-400">A professional timeline of your learning progress.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit self-start">
                    {(['all', 'quiz', 'guide', 'game'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === t
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            {t === 'all' ? 'All Activity' : `${t}s`}
                        </button>
                    ))}
                </div>
            </header>

            {recentActivity.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                    <span className="text-5xl mb-4 block">🚀</span>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Your journey starts here</h2>
                    <p className="text-slate-500 mt-2 mb-6">Complete a practice session or read a study guide to see it here.</p>
                    <Link to="/practice" className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Start Studying</Link>
                </div>
            ) : (
                <div className="space-y-10 relative">
                    {/* Vertical line for the timeline */}
                    <div className="absolute left-6 top-5 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    {groupedActivity.map(([date, activities]) => (
                        <section key={date} className="relative space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 sm:ml-12 mb-4">
                                {date}
                            </h3>

                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="relative flex items-start gap-4 sm:gap-6 group"
                                    >
                                        {/* Timeline Dot */}
                                        <div className="hidden sm:flex absolute left-6 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-primary bg-white dark:bg-slate-900 z-10 top-6 group-hover:scale-125 transition-transform" />

                                        <div className="flex-1 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all sm:ml-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${getTypeColor(activity.type)}`}>
                                                    {getIcon(activity.type)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                            {activity.type}
                                                        </span>
                                                        {activity.score !== undefined && (
                                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                                Score: {activity.score}
                                                            </span>
                                                        )}
                                                        {activity.mastered && (
                                                            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                ⭐ Mastered
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white truncate">
                                                        {activity.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                        {activity.subtitle || new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {activity.progress !== undefined && activity.progress < 100 && (
                                                    <div className="hidden md:flex flex-col items-end mr-4 min-w-[100px]">
                                                        <span className="text-[10px] font-bold text-slate-400 mb-1">{activity.progress}% Complete</span>
                                                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${activity.progress}%` }} />
                                                        </div>
                                                    </div>
                                                )}

                                                <Link
                                                    to={activity.path}
                                                    state={{
                                                        ...activity.state,
                                                        isRetake: true,
                                                        timestamp: Date.now()
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all text-center whitespace-nowrap ${activity.type === 'guide'
                                                        ? 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                                        : activity.mastered ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' : 'bg-primary text-white hover:bg-green-700 shadow-sm'
                                                        }`}
                                                >
                                                    {(() => {
                                                        if (activity.type === 'guide') return 'Read Guide';
                                                        if (activity.type === 'game') return 'Play Again';
                                                        if (activity.mastered) return 'Review';
                                                        return 'Practice Again';
                                                    })()}
                                                </Link>

                                                {activity.type === 'quiz' && (
                                                    <Link to="/performance" className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                                                        📊
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Journey;
