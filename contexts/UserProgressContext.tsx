import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import apiService from '../services/apiService.ts';
import { ConfidenceLevel } from '../types.ts';

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
    engagement: { dismissedNudges: string[], unlockedNudges: string[] };
    studyProgress: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string } };
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
    syncProgress: () => Promise<void>;
    updateEngagementState: (engagement: { dismissedNudges: string[], unlockedNudges: string[] }) => void;
    updateConfidence: (subTopicId: string, confidence: ConfidenceLevel) => Promise<void>;
    calculateTopicStatus: (subTopicId: string) => ConfidenceLevel | 'stale' | null;
    estimatedScore: number;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [streakHistory, setStreakHistory] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [engagement, setEngagement] = useState<{ dismissedNudges: string[], unlockedNudges: string[] }>({ dismissedNudges: [], unlockedNudges: [] });
    const [studyProgress, setStudyProgress] = useState<{ [key: string]: { confidence: ConfidenceLevel, lastReviewed: string } }>({});
    const [estimatedScore, setEstimatedScore] = useState(150); // Base score

    // Calculate Estimated Score based on progress
    const calculateScore = useCallback((progressMap: { [key: string]: { confidence: ConfidenceLevel } }) => {
        let score = 150; // Base score
        const entries = Object.values(progressMap);
        const totalReviewed = entries.length;
        if (totalReviewed === 0) return 150;

        // 1. Mastery Impact (Confident = +2, Shaky = +1)
        // Capped at 200 points max for mastery
        const masteryPoints = entries.reduce((acc, curr) => {
            if (curr.confidence === 'confident') return acc + 5;
            if (curr.confidence === 'shaky') return acc + 2;
            return acc;
        }, 0);

        // 2. Consistency Bonus (Streak) - Max 20 points
        // We'll use the current streak from state, but inside this callback we might process it separately
        // For simplicity, we'll just add masteryPoints to base

        score += Math.min(masteryPoints, 200);

        // 3. Activity Bonus (Mock Quiz scores would go here in a real app)
        // For now, heuristic based purely on confidence volume

        return Math.min(score, 400); // Cap at 400
    }, []);

    const loadFromLocal = useCallback(() => {
        const savedStreak = localStorage.getItem('examRediStreak');
        const savedStreakHistory = localStorage.getItem('examRediStreakHistory');
        const savedActivity = localStorage.getItem('examRediRecentActivity');
        const savedEngagement = localStorage.getItem('examRediEngagement');
        const savedStudyProgress = localStorage.getItem('examRediStudyProgress');

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
        if (savedEngagement) {
            try {
                setEngagement(JSON.parse(savedEngagement));
            } catch (e) {
                setEngagement({ dismissedNudges: [], unlockedNudges: [] });
            }
        }
        if (savedStudyProgress) {
            try {
                const parsed = JSON.parse(savedStudyProgress);
                setStudyProgress(parsed);
                setEstimatedScore(calculateScore(parsed));
            } catch (e) {
                setStudyProgress({});
            }
        }
    }, [calculateScore]);

    const syncProgress = useCallback(async () => {
        if (isAuthenticated) {
            try {
                const data = await apiService<{
                    streak: number,
                    streakHistory?: string[],
                    recentActivity: RecentActivity[],
                    engagement?: { dismissedNudges: string[], unlockedNudges: string[] },
                    studyProgress?: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string } },
                    estimatedScore?: number
                }>('/user/progress');

                setStreak(data.streak);
                setStreakHistory(data.streakHistory || []);
                setRecentActivity(data.recentActivity || []);
                if (data.engagement) {
                    setEngagement(data.engagement);
                    localStorage.setItem('examRediEngagement', JSON.stringify(data.engagement));
                }
                if (data.studyProgress) {
                    setStudyProgress(data.studyProgress);
                    // If backend return score, use it, else calculate
                    const score = data.estimatedScore || calculateScore(data.studyProgress);
                    setEstimatedScore(score);
                    localStorage.setItem('examRediStudyProgress', JSON.stringify(data.studyProgress));
                } else if (data.estimatedScore) {
                    setEstimatedScore(data.estimatedScore);
                }


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
    }, [isAuthenticated, loadFromLocal, calculateScore]);

    useEffect(() => {
        syncProgress();
    }, [syncProgress]);

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

        // Recalculate Score locally for instant feedback (if it depended on activity)
        // Currently it depends on studyProgress (confidence), but if we added quiz scores to calculation:
        // const newScore = calculateScore(...) 

        if (isAuthenticated) {
            try {
                // Send current estimated score to be persisted
                const response = await apiService<{
                    streak: number,
                    streakHistory: string[],
                    recentActivity: RecentActivity[],
                    engagement: { dismissedNudges: string[], unlockedNudges: string[] },
                    estimatedScore?: number
                }>('/user/progress', {
                    method: 'PUT',
                    body: {
                        recentActivity: [newActivity],
                        estimatedScore
                    }
                });

                if (response) {
                    setStreak(response.streak);
                    setStreakHistory(response.streakHistory);
                    setRecentActivity(response.recentActivity);
                    setEngagement(response.engagement);
                    if (response.estimatedScore) setEstimatedScore(response.estimatedScore);

                    localStorage.setItem('examRediStreak', response.streak.toString());
                    localStorage.setItem('examRediStreakHistory', JSON.stringify(response.streakHistory));
                    localStorage.setItem('examRediRecentActivity', JSON.stringify(response.recentActivity));
                    localStorage.setItem('examRediEngagement', JSON.stringify(response.engagement));
                }
            } catch (error) {
                console.error("Failed to save progress to backend:", error);
            }
        }

        localStorage.setItem('examRediRecentActivity', JSON.stringify(updatedActivity));
        localStorage.setItem('examRediLastPractice', Date.now().toString());
    };

    const updateEngagementState = (newEngagement: { dismissedNudges: string[], unlockedNudges: string[] }) => {
        setEngagement(newEngagement);
        localStorage.setItem('examRediEngagement', JSON.stringify(newEngagement));
    };

    const updateConfidence = async (subTopicId: string, confidence: ConfidenceLevel) => {
        // Optimistic update
        const newProgress = {
            ...studyProgress,
            [subTopicId]: { confidence, lastReviewed: new Date().toISOString() }
        };
        setStudyProgress(newProgress);
        setEstimatedScore(calculateScore(newProgress));
        localStorage.setItem('examRediStudyProgress', JSON.stringify(newProgress));

        if (isAuthenticated) {
            try {
                const response = await apiService<{
                    success: boolean,
                    studyProgress: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string } }
                }>('/user/progress/confidence', {
                    method: 'POST',
                    body: { subTopicId, confidence }
                });

                if (response && response.studyProgress) {
                    setStudyProgress(response.studyProgress);
                    setEstimatedScore(calculateScore(response.studyProgress));
                    localStorage.setItem('examRediStudyProgress', JSON.stringify(response.studyProgress));
                }
            } catch (error) {
                console.error("Failed to update confidence:", error);
            }
        }
    };

    const calculateTopicStatus = (subTopicId: string): ConfidenceLevel | 'stale' | null => {
        const progress = studyProgress[subTopicId];
        if (!progress) return null;

        if (progress.confidence === 'confident') {
            const lastReviewed = new Date(progress.lastReviewed);
            const now = new Date();
            const daysSinceReview = Math.floor((now.getTime() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24));

            // Default: "High Urgency" (Assume ~2 weeks to study)
            // If you have 2 weeks, you can't afford to forget something for 14 days. 
            // You need to review it every 3-4 days.
            let decayThreshold = 3;

            // Urgency Logic: Adjust if explicit exam date is known
            // Use 'user' from component scope (UserProgressProvider)
            if (user?.studyPlan?.examDate) {
                const examDate = new Date(user.studyPlan.examDate);
                const daysToExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysToExam > 60) {
                    decayThreshold = 14; // "Long Term": Relaxed review
                } else if (daysToExam > 30) {
                    decayThreshold = 7; // "Standard": Weekly review
                }
                // Else (< 30 days) keeps default of 3
            }

            if (daysSinceReview > decayThreshold) {
                return 'stale';
            }
        }

        return progress.confidence;
    };

    return (
        <UserProgressContext.Provider value={{
            streak,
            streakHistory,
            recentActivity,
            engagement,
            studyProgress,
            addActivity,
            syncProgress,
            updateEngagementState,
            updateConfidence,
            calculateTopicStatus,
            estimatedScore
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
