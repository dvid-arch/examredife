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
                const normalized = (data.recentActivity || []).map(normalizeActivity);
                setRecentActivity(normalized);
                localStorage.setItem('examRediStreak', data.streak.toString());
                localStorage.setItem('examRediStreakHistory', JSON.stringify(data.streakHistory || []));
                localStorage.setItem('examRediRecentActivity', JSON.stringify(normalized));
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

        // Local dynamic update for responsiveness
        const updatedActivity = [newActivity, ...recentActivity.filter(a => a.id !== activity.id)].slice(0, 30);
        setRecentActivity(updatedActivity);

        if (isAuthenticated) {
            try {
                const response = await apiService<{ streak: number, streakHistory: string[], recentActivity: RecentActivity[] }>('/user/progress', {
                    method: 'PUT',
                    body: { recentActivity: [newActivity] }
                });

                if (response) {
                    setStreak(response.streak);
                    setStreakHistory(response.streakHistory);
                    const normalized = response.recentActivity.map(normalizeActivity);
                    setRecentActivity(normalized);
                    localStorage.setItem('examRediStreak', response.streak.toString());
                    localStorage.setItem('examRediStreakHistory', JSON.stringify(response.streakHistory));
                    localStorage.setItem('examRediRecentActivity', JSON.stringify(normalized));
                }
            } catch (error) {
                console.error("Failed to save progress to backend:", error);
            }
        }

        localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));
        localStorage.setItem('examRediLastPractice', Date.now().toString());
    };

    const dismissActivity = async (id: string) => {
        const now = Date.now();
        const updatedActivity = recentActivity.map(a =>
            a.id === id ? { ...a, dismissedAt: now } : a
        );
        setRecentActivity(updatedActivity);
        localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));

        if (isAuthenticated) {
            try {
                await apiService('/user/progress', {
                    method: 'PUT',
                    body: {
                        recentActivity: updatedActivity.filter(a => a.id === id) // Send the dismissed one to backend
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

        // 1. Filter out dismissed and old items (robust handling of any mixed data types)
        const relevant = recentActivity.filter(a => {
            const timestamp = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const dismissedAt = a.dismissedAt && typeof a.dismissedAt === 'string'
                ? new Date(a.dismissedAt).getTime()
                : a.dismissedAt;

            return !dismissedAt && (now - timestamp) < THIRTY_DAYS;
        });

        // 2. Simple but effective sorting: 
        // In-progress items higher than completed, then by recency
        return relevant.sort((a, b) => {
            const tsA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
            const tsB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;

            // Status priority: in_progress > undefined > completed
            const getPriority = (status?: string) => {
                if (status === 'in_progress') return 2;
                if (!status) return 1;
                return 0;
            };

            const priorityA = getPriority(a.status);
            const priorityB = getPriority(b.status);

            if (priorityA !== priorityB) return priorityB - priorityA;
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
