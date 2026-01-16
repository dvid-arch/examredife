import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
    const [streak, setStreak] = useState(0);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

    useEffect(() => {
        // Load from localStorage
        const savedStreak = localStorage.getItem('examRediStreak');
        const savedActivity = localStorage.getItem('examRediRecentActivity');
        const lastPractice = localStorage.getItem('examRediLastPractice');

        if (savedStreak) setStreak(parseInt(savedStreak));
        if (savedActivity) setRecentActivity(JSON.parse(savedActivity));

        checkStreak();
    }, []);

    const checkStreak = () => {
        const lastPractice = localStorage.getItem('examRediLastPractice');
        if (!lastPractice) return;

        const lastDate = new Date(parseInt(lastPractice));
        const today = new Date();

        // Reset time for comparison
        lastDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Missed a day, reset streak
            setStreak(0);
            localStorage.setItem('examRediStreak', '0');
        }
    };

    const addActivity = (activity: Omit<RecentActivity, 'timestamp'>) => {
        const newActivity: RecentActivity = {
            ...activity,
            timestamp: Date.now()
        };

        setRecentActivity(prev => {
            // Remove if already exists to move to top
            const filtered = prev.filter(a => a.id !== activity.id);
            const updated = [newActivity, ...filtered].slice(0, 5); // Keep last 5
            localStorage.setItem('examRediRecentActivity', JSON.stringify(updated));
            return updated;
        });

        // Update streak if it's the first activity of the day
        const lastPractice = localStorage.getItem('examRediLastPractice');
        const todayPrice = new Date().setHours(0, 0, 0, 0);

        if (!lastPractice || new Date(parseInt(lastPractice)).setHours(0, 0, 0, 0) !== todayPrice) {
            setStreak(prev => {
                const newStreak = prev + 1;
                localStorage.setItem('examRediStreak', newStreak.toString());
                localStorage.setItem('examRediLastPractice', Date.now().toString());
                return newStreak;
            });
        } else {
            localStorage.setItem('examRediLastPractice', Date.now().toString());
        }
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
