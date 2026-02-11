import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import apiService from '../services/apiService.ts';

interface RecentActivity {
    id: string;
    title: string;
    path: string;
    timestamp: number;
    type: 'quiz' | 'guide' | 'game';
    state?: any; // For "Continue Studying" resumption
    status?: 'completed' | 'in_progress' | 'abandoned';
    score?: string;          // For quizzes (e.g., "12/15")
    progress?: number;       // For guides (0-100)
    dismissedAt?: number;    // Timestamp when user dismissed
}

interface UserProgressContextType {
    streak: number;
    streakHistory: string[];
    recentActivity: RecentActivity[];
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
    dismissActivity: (id: string) => void;
    syncProgress: () => Promise<void>;
    getFilteredActivity: () => RecentActivity[];
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [streak, setStreak] = useState(0);
    const [streakHistory, setStreakHistory] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    const normalizeActivity = (activity: RecentActivity): RecentActivity => ({
        ...activity,
        timestamp: typeof activity.timestamp === 'string' ? new Date(activity.timestamp).getTime() : activity.timestamp,
        dismissedAt: activity.dismissedAt && typeof activity.dismissedAt === 'string'
            ? new Date(activity.dismissedAt).getTime()
            : activity.dismissedAt
    });

    const syncProgress = async () => {
        if (isAuthenticated) {
            try {
                const data = await apiService<{ streak: number, streakHistory?: string[], recentActivity: RecentActivity[] }>('/user/progress');
                setStreak(data.streak);
                setStreakHistory(data.streakHistory || []);

                const serverActivity = (data.recentActivity || []).map(normalizeActivity);

                setRecentActivity(prev => {
                    const activityMap = new Map<string, RecentActivity>();

                    // Add server items first
                    serverActivity.forEach(item => activityMap.set(item.id, item));

                    // Overlay local items if they are newer OR don't exist in server list yet
                    prev.forEach(localItem => {
                        const serverItem = activityMap.get(localItem.id);
                        if (!serverItem || localItem.timestamp > serverItem.timestamp) {
                            activityMap.set(localItem.id, localItem);
                        }
                    });

                    const sorted = Array.from(activityMap.values())
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 50);

                    localStorage.setItem('examRediRecentActivity', JSON.stringify(sorted));
                    return sorted;
                });

                localStorage.setItem('examRediStreak', data.streak.toString());
                localStorage.setItem('examRediStreakHistory', JSON.stringify(data.streakHistory || []));
            } catch (error) {
                console.error("Failed to sync progress with backend:", error);
                loadFromLocal();
            }
        } else {
            loadFromLocal();
        }
    };

    const loadFromLocal = () => {
        const savedStreak = localStorage.getItem('examRediStreak');
        const savedStreakHistory = localStorage.getItem('examRediStreakHistory');
        const savedActivity = localStorage.getItem('examRediRecentActivity');
        if (savedStreak) setStreak(parseInt(savedStreak));
        if (savedStreakHistory) {
            try {
                setStreakHistory(JSON.parse(savedStreakHistory));
            } catch (e) {
                setStreakHistory([]);
            }
        }
        if (savedActivity) {
            try {
                const normalized = JSON.parse(savedActivity).map(normalizeActivity);
                setRecentActivity(normalized);
            } catch (e) {
                setRecentActivity([]);
            }
        }
    };

    useEffect(() => {
        syncProgress();
    }, [isAuthenticated]);

    const addActivity = async (activity: Omit<RecentActivity, 'timestamp'>) => {
        const newActivity = normalizeActivity({
            ...activity,
            timestamp: Date.now()
        } as RecentActivity);

        // Functional update to avoid closure staleness
        setRecentActivity(prev => {
            const updated = [newActivity, ...prev.filter(a => a.id !== activity.id)].slice(0, 50);
            localStorage.setItem('examRediRecentActivity', JSON.stringify(updated));
            return updated;
        });

        if (isAuthenticated) {
            try {
                const response = await apiService<{ streak: number, streakHistory: string[], recentActivity: RecentActivity[] }>('/user/progress', {
                    method: 'PUT',
                    body: { recentActivity: [newActivity] }
                });

                if (response) {
                    setStreak(response.streak);
                    setStreakHistory(response.streakHistory);
                    const serverNormalized = response.recentActivity.map(normalizeActivity);

                    setRecentActivity(prev => {
                        const activityMap = new Map<string, RecentActivity>();
                        prev.forEach(item => activityMap.set(item.id, item));
                        serverNormalized.forEach(serverItem => {
                            const localItem = activityMap.get(serverItem.id);
                            if (!localItem || serverItem.timestamp >= localItem.timestamp) {
                                activityMap.set(serverItem.id, serverItem);
                            }
                        });
                        const sorted = Array.from(activityMap.values())
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 50);
                        localStorage.setItem('examRediRecentActivity', JSON.stringify(sorted));
                        return sorted;
                    });
                }
            } catch (error) {
                console.error("Failed to save progress to backend:", error);
            }
        }

        localStorage.setItem('examRediLastPractice', Date.now().toString());
    };

    const dismissActivity = async (id: string) => {
        const now = Date.now();
        setRecentActivity(prev => {
            const updated = prev.map(a => a.id === id ? { ...a, dismissedAt: now } : a);
            localStorage.setItem('examRediRecentActivity', JSON.stringify(updated));
            return updated;
        });

        if (isAuthenticated) {
            try {
                await apiService('/user/progress', {
                    method: 'PUT',
                    body: {
                        recentActivity: [{ id, dismissedAt: now } as any] // Minimal update
                    }
                });
            } catch (error) {
                console.error("Failed to dismiss activity on backend:", error);
            }
        }
    };

    const getFilteredActivity = () => {
        const now = Date.now();
        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

        // 1. Filter out dismissed and old items
        const relevant = recentActivity.filter(a => {
            const ts = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const ds = a.dismissedAt && typeof a.dismissedAt === 'string'
                ? new Date(a.dismissedAt).getTime()
                : a.dismissedAt;

            // Safety check for invalid dates
            if (isNaN(ts)) return false;

            return !ds && (Math.abs(now - ts) < THIRTY_DAYS); // Use Math.abs to handle small clock skews
        });

        // 2. Sorting: In-progress > undefined > completed, then by recency
        return relevant.sort((a, b) => {
            const tsA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const tsB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;

            const getPriority = (status?: string) => {
                if (status === 'in_progress') return 2;
                if (status === 'abandoned') return 0;
                return 1; // Default for completed or undefined (legacy)
            };

            const pA = getPriority(a.status);
            const pB = getPriority(b.status);

            if (pA !== pB) return pB - pA;
            return tsB - tsA;
        });
    };

    return (
        <UserProgressContext.Provider value={{
            streak,
            streakHistory,
            recentActivity,
            addActivity,
            dismissActivity,
            syncProgress,
            getFilteredActivity
        }}>
            {children}
        </UserProgressContext.Provider>
    );
};

export const useUserProgress = () => {
    const context = useContext(UserProgressContext);
    if (context === undefined) {
        throw new Error('useUserProgress must be used within a UserProgressProvider');
    }
    return context;
};
