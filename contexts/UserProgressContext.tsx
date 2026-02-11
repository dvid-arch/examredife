import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import apiService from '../services/apiService.ts';

interface RecentActivity {
    id: string; // This should now be a unique sessionId for practice/challenges
    title: string;
    path: string;
    timestamp: number;
    type: 'quiz' | 'guide' | 'game';
    state?: any; // For "Continue Studying" resumption
    score?: number;
    maxScore?: number;
    progress?: number; // 0 to 100
    subtitle?: string;
    mastered?: boolean;
}

interface UserProgressContextType {
    streak: number;
    streakHistory: string[];
    recentActivity: RecentActivity[];
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
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
        // Automatic Mastery Logic: If score is 100% and it's a quiz, mark as mastered
        let mastered = activity.mastered;
        if (activity.type === 'quiz' && activity.score !== undefined && activity.maxScore !== undefined) {
            if (activity.score === activity.maxScore && activity.maxScore >= 5) {
                mastered = true;
            }
        }

        const newActivity: RecentActivity = {
            ...activity,
            mastered,
            timestamp: Date.now()
        };

        // Local dynamic update for responsiveness
        // filter(a => a.id !== activity.id) ensures updates to the SAME session (e.g. while playing) don't duplicate
        // but DIFFERENT sessions (new IDs) will accumulate.
        const updatedActivity = [newActivity, ...recentActivity.filter(a => a.id !== activity.id)].slice(0, 50);
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

    return (
        <UserProgressContext.Provider value={{ streak, streakHistory, recentActivity, addActivity, syncProgress }}>
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
