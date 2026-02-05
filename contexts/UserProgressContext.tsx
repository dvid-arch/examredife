import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import apiService from '../services/apiService.ts';

interface RecentActivity {
    id: string;
    title: string;
    path: string;
    timestamp: number;
    type: 'quiz' | 'guide' | 'game';
}

interface UserProgressContextType {
    streak: number;
    recentActivity: RecentActivity[];
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
    checkStreak: () => void;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [streak, setStreak] = useState(0);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    useEffect(() => {
        const syncProgress = async () => {
            if (isAuthenticated) {
                try {
                    const data = await apiService<{ streak: number, recentActivity: RecentActivity[] }>('/user/progress');
                    setStreak(data.streak);
                    setRecentActivity(data.recentActivity);
                    localStorage.setItem('examRediStreak', data.streak.toString());
                    localStorage.setItem('examRediRecentActivity', JSON.stringify(data.recentActivity));
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
            const savedActivity = localStorage.getItem('examRediRecentActivity');
            if (savedStreak) setStreak(parseInt(savedStreak));
            if (savedActivity) setRecentActivity(JSON.parse(savedActivity));
        };

        syncProgress();
    }, [isAuthenticated]);

    const saveProgress = async (newStreak: number, newActivity: RecentActivity[]) => {
        if (isAuthenticated) {
            try {
                await apiService('/user/progress', {
                    method: 'PUT',
                    body: { streak: newStreak, recentActivity: newActivity }
                });
            } catch (error) {
                console.error("Failed to save progress to backend:", error);
            }
        }
        localStorage.setItem('examRediStreak', newStreak.toString());
        localStorage.setItem('examRediRecentActivity', JSON.stringify(newActivity));
    };

    const checkStreak = () => {
        const lastPractice = localStorage.getItem('examRediLastPractice');
        if (!lastPractice) return;

        const lastDate = new Date(parseInt(lastPractice));
        const today = new Date();

        lastDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            setStreak(0);
            saveProgress(0, recentActivity);
        }
    };

    const addActivity = (activity: Omit<RecentActivity, 'timestamp'>) => {
        const newActivity: RecentActivity = {
            ...activity,
            timestamp: Date.now()
        };

        let updatedActivity: RecentActivity[] = [];
        setRecentActivity(prev => {
            const filtered = prev.filter(a => a.id !== activity.id);
            updatedActivity = [newActivity, ...filtered].slice(0, 5);
            return updatedActivity;
        });

        // Update streak logic
        const lastPractice = localStorage.getItem('examRediLastPractice');
        const todayPrice = new Date().setHours(0, 0, 0, 0);
        let newStreak = streak;

        if (!lastPractice || new Date(parseInt(lastPractice)).setHours(0, 0, 0, 0) !== todayPrice) {
            newStreak = streak + 1;
            setStreak(newStreak);
            localStorage.setItem('examRediLastPractice', Date.now().toString());
        } else {
            localStorage.setItem('examRediLastPractice', Date.now().toString());
        }

        saveProgress(newStreak, updatedActivity);
    };

    return (
        <UserProgressContext.Provider value={{ streak, recentActivity, addActivity, checkStreak }}>
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
