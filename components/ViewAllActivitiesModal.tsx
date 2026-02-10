import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from './Card.tsx';
import { RecentActivity } from '../contexts/UserProgressContext.tsx';

interface ViewAllActivitiesModalProps {
    isOpen: boolean;
    onClose: () => void;
    recentActivity: RecentActivity[];
    dismissActivity: (id: string) => Promise<void>;
    trackEngagement: (id: string) => Promise<void>;
}

const ViewAllActivitiesModal: React.FC<ViewAllActivitiesModalProps> = ({
    isOpen,
    onClose,
    recentActivity,
    dismissActivity,
    trackEngagement
}) => {
    const [activeTab, setActiveTab] = useState<'all' | 'quiz' | 'guide' | 'game'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredActivities = useMemo(() => {
        return recentActivity
            .filter(a => !a.dismissedAt)
            .filter(a => activeTab === 'all' || a.type === activeTab)
            .filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [recentActivity, activeTab, searchQuery]);

    if (!isOpen) return null;

    const tabs = [
        { id: 'all' as const, label: 'All', icon: '📁' },
        { id: 'quiz' as const, label: 'Quizzes', icon: '📝' },
        { id: 'guide' as const, label: 'Guides', icon: '📖' },
        { id: 'game' as const, label: 'Games', icon: '🎮' },
    ];

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10 rounded-t-xl">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Study History
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage your recent activities and pick up where you left off.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row gap-4">
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-fit">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none dark:text-white text-sm"
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                    {filteredActivities.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredActivities.map(activity => (
                                <div key={activity.id} className="group relative flex flex-col bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 transition-all">
                                    <button
                                        onClick={() => dismissActivity(activity.id)}
                                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Dismiss Activity"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>

                                    <div className="flex items-start gap-4 mb-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'quiz' ? 'bg-blue-100 text-blue-600' :
                                                activity.type === 'guide' ? 'bg-pink-100 text-pink-600' : 'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {activity.type === 'quiz' ? '📝' : activity.type === 'guide' ? '📖' : '🎮'}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-6">
                                            <h4 className="font-bold text-slate-800 dark:text-white truncate">
                                                {activity.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                                                    {activity.type}
                                                </span>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto space-y-3">
                                        {(activity.score !== undefined || (activity.progress !== undefined && activity.progress > 0)) && (
                                            <div className="flex items-center justify-between">
                                                {activity.score !== undefined ? (
                                                    <span className="text-sm font-bold text-primary">Score: {activity.score}%</span>
                                                ) : (
                                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                                        Progress: {activity.progress}%
                                                    </span>
                                                )}
                                                {activity.progress !== undefined && (
                                                    <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 ml-4">
                                                        <div
                                                            className="bg-primary h-1.5 rounded-full transition-all"
                                                            style={{ width: `${activity.progress}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <Link
                                            to={activity.path}
                                            state={activity.state}
                                            onClick={() => {
                                                trackEngagement(activity.id);
                                                onClose();
                                            }}
                                            className="w-full block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-2 rounded-lg text-sm font-bold text-center hover:bg-primary hover:text-white hover:border-primary transition-all shadow-sm"
                                        >
                                            Resume Session
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="text-6xl mb-4">🔍</div>
                            <h4 className="text-lg font-bold text-slate-800 dark:text-white">No activities found</h4>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                                {searchQuery
                                    ? `We couldn't find any activities matching "${searchQuery}" in this category.`
                                    : "You haven't engaged in any activities of this type recently."}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 text-primary font-bold hover:underline"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center rounded-b-xl">
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        Dismissed activities are hidden from history but can be resumed from their original sections.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default ViewAllActivitiesModal;
