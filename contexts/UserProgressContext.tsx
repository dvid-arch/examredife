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
    // Smart filtering and management fields
    status?: 'completed' | 'in_progress' | 'abandoned';
    score?: number;  // For quizzes
    progress?: number;  // For guides/games (0-100)
    dismissedAt?: number;
    engagementCount?: number;
    lastEngaged?: number;
}

interface UserProgressContextType {
    streak: number;
    streakHistory: string[];
    recentActivity: RecentActivity[];
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
    dismissActivity: (activityId: string) => Promise<void>;
    restoreActivity: (activityId: string) => Promise<void>;
    trackEngagement: (activityId: string) => Promise<void>;
    syncProgress: () => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [streak, setStreak] = useState(0);
    const [streakHistory, setStreakHistory] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    const syncProgress = async () => {
        if (isAuthenticated) {
            try {
                const data = await apiService<{ streak: number, streakHistory?: string[], recentActivity: RecentActivity[] }>('/user/progress');
                setStreak(data.streak);
                setStreakHistory(data.streakHistory || []);
                setRecentActivity(data.recentActivity || []);
                localStorage.setItem('examRediStreak', data.streak.toString());
                localStorage.setItem('examRediStreakHistory', JSON.stringify(data.streakHistory || []));
                localStorage.setItem('examRediRecentActivity', JSON.stringify(data.recentActivity || []));
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
                setRecentActivity(JSON.parse(savedActivity));
            } catch (e) {
                setRecentActivity([]);
            }
        }
    };

    useEffect(() => {
        syncProgress();
    }, [isAuthenticated]);

    const addActivity = async (activity: Omit<RecentActivity, 'timestamp'>) => {
        const newActivity: RecentActivity = {
            ...activity,
            timestamp: Date.now()
        };

        // Local dynamic update for responsiveness
        const updatedActivity = [newActivity, ...recentActivity.filter(a => a.id !== activity.id)].slice(0, 20);
        setRecentActivity(updatedActivity);

        if (isAuthenticated) {
            try {
                // Backend now handles streak logic on progress update
                // We send the new activity item to be merged
                const response = await apiService<{ streak: number, streakHistory: string[], recentActivity: RecentActivity[] }>('/user/progress', {
                    method: 'PUT',
                    body: { recentActivity: [newActivity] }
                });

                if (response) {
                    setStreak(response.streak);
                    setStreakHistory(response.streakHistory);
                    setRecentActivity(response.recentActivity);
                    localStorage.setItem('examRediStreak', response.streak.toString());
                    localStorage.setItem('examRediStreakHistory', JSON.stringify(response.streakHistory));
                    localStorage.setItem('examRediRecentActivity', JSON.stringify(response.recentActivity));
                }
            } catch (error) {
                console.error("Failed to save progress to backend:", error);
            }
        }

        localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));
        localStorage.setItem('examRediLastPractice', Date.now().toString());
    };

    const dismissActivity = async (activityId: string) => {
        if (isAuthenticated) {
            try {
                await apiService(`/user/progress/activity/${activityId}`, {
                    method: 'DELETE'
                });
                // Update local state
                const updatedActivity = recentActivity.map(a =>
                    a.id === activityId ? { ...a, dismissedAt: Date.now() } : a
                );
                setRecentActivity(updatedActivity);
                localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));
            } catch (error) {
                console.error("Failed to dismiss activity:", error);
            }
        }
    };

    const restoreActivity = async (activityId: string) => {
        if (isAuthenticated) {
            try {
                await apiService(`/user/progress/activity/${activityId}/restore`, {
                    method: 'PUT'
                });
                const updatedActivity = recentActivity.map(a =>
                    a.id === activityId ? { ...a, dismissedAt: undefined } : a
                );
                setRecentActivity(updatedActivity);
                localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));
            } catch (error) {
                console.error('Error restoring activity:', error);
            }
        }
    };

    const trackEngagement = async (activityId: string) => {
        if (isAuthenticated) {
            try {
                await apiService(`/user/progress/activity/${activityId}/engage`, {
                    method: 'POST'
                });
            } catch (error) {
                console.error("Failed to track engagement:", error);
            }
        }
    };

    return (
        <UserProgressContext.Provider value={{ streak, streakHistory, recentActivity, addActivity, dismissActivity, restoreActivity, trackEngagement, syncProgress }}>
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
