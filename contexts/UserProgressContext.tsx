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

                // Merge Logic: Keep local activities that might be newer than what's on the server
                setRecentActivity(prevLocal => {
                    const merged = [...prevLocal];
                    const serverActivities = data.recentActivity || [];

                    serverActivities.forEach(serverAct => {
                        const localIndex = merged.findIndex(a => a.id === serverAct.id);
                        const serverTime = new Date(serverAct.timestamp).getTime();

                        if (localIndex !== -1) {
                            const localTime = merged[localIndex].timestamp;
                            if (serverTime > localTime || serverAct.status === 'completed') {
                                merged[localIndex] = { ...serverAct, timestamp: serverTime };
                            }
                        } else {
                            merged.push({ ...serverAct, timestamp: serverTime });
                        }
                    });

                    const final = merged
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 20);

                    localStorage.setItem('examRediRecentActivity', JSON.stringify(final));
                    return final;
                });

                localStorage.setItem('examRediStreak', data.streak.toString());
                localStorage.setItem('examRediStreakHistory', JSON.stringify(data.streakHistory || []));
            } catch (error) {
                console.error("Failed to sync progress with backend:", error);
            }
        }
    };

    const loadFromLocal = () => {
        const savedStreak = localStorage.getItem('examRediStreak');
        const savedStreakHistory = localStorage.getItem('examRediStreakHistory');
        const savedActivity = localStorage.getItem('examRediRecentActivity');
        if (savedStreak) setStreak(parseInt(savedStreak));
        if (savedStreakHistory) {
            try { setStreakHistory(JSON.parse(savedStreakHistory)); } catch (e) { }
        }
        if (savedActivity) {
            try {
                const parsed = JSON.parse(savedActivity);
                setRecentActivity(parsed.map((a: any) => ({
                    ...a,
                    timestamp: typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp
                })));
            } catch (e) { }
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadFromLocal();
            syncProgress();
        } else {
            // Guest users should not have activity tracking
            setRecentActivity([]);
            setStreak(0);
            setStreakHistory([]);
        }
    }, [isAuthenticated]);

    const addActivity = async (activity: Omit<RecentActivity, 'timestamp'>) => {
        if (!isAuthenticated) return;

        const newActivity: RecentActivity = {
            ...activity,
            timestamp: Date.now()
        };

        // Local dynamic update for responsiveness
        setRecentActivity(prev => {
            const updated = [newActivity, ...prev.filter(a => a.id !== activity.id)].slice(0, 20);
            localStorage.setItem('examRediRecentActivity', JSON.stringify(updated));
            return updated;
        });

        try {
            const response = await apiService<{ streak: number, streakHistory: string[], recentActivity: RecentActivity[] }>('/user/progress', {
                method: 'PUT',
                body: { recentActivity: [newActivity] }
            });

            if (response) {
                setStreak(response.streak);
                setStreakHistory(response.streakHistory);

                // Don't just overwrite, ensure local timestamps are respected if newer
                setRecentActivity(prev => {
                    const serverActs = response.recentActivity.map(a => ({
                        ...a,
                        timestamp: new Date(a.timestamp).getTime()
                    }));

                    // Overwrite with server data but keep local for a smoother transition if needed
                    localStorage.setItem('examRediRecentActivity', JSON.stringify(serverActs));
                    return serverActs;
                });

                localStorage.setItem('examRediStreak', response.streak.toString());
                localStorage.setItem('examRediStreakHistory', JSON.stringify(response.streakHistory));
            }
        } catch (error) {
            console.error("Failed to save progress to backend:", error);
        }

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
