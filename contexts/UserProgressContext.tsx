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
    subject?: string;
    subtitle?: string;
    mastered?: boolean;
}

interface UserProgressContextType {
    streak: number;
    streakHistory: string[];
    recentActivity: RecentActivity[];
    engagement: { dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> };
    studyProgress: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string, subject?: string } };
    addActivity: (activity: Omit<RecentActivity, 'timestamp'>) => void;
    syncProgress: () => Promise<void>;
    updateEngagementState: (engagement: { dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> }) => void;
    updateConfidence: (topicId: string, confidence: ConfidenceLevel, subject?: string) => Promise<void>;
    calculateTopicStatus: (topicId: string) => ConfidenceLevel | 'stale' | null;
    estimatedScore: number;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [streak, setStreak] = useState(0);
    const [streakHistory, setStreakHistory] = useState<string[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [engagement, setEngagement] = useState<{ dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> }>({ dismissedNudges: [], unlockedNudges: [], nudgeDismissalTimes: {} });
    const [studyProgress, setStudyProgress] = useState<{ [key: string]: { confidence: ConfidenceLevel, lastReviewed: string, subject?: string } }>({});
    const [estimatedScore, setEstimatedScore] = useState(150); // Base score

    // Calculate Estimated Score based on progress and activity
    const calculateScore = useCallback((
        progressMap: { [key: string]: { confidence: ConfidenceLevel, lastReviewed?: string, subject?: string } },
        activities: RecentActivity[]
    ) => {
        const MAX_SCORE = 400;
        const BASE_SCORE = 140;

        // We'll calculate mastery per subject below
        const masteryEntries = Object.values(progressMap);

        // 2. Gather Quiz Data (60% Weight)
        const quizActivities = activities.filter(a => a.type === 'quiz' && a.score !== undefined && a.maxScore !== undefined && a.maxScore > 0);
        let quizPercentage = 0;
        if (quizActivities.length > 0) {
            const totalQuizPercentage = quizActivities.reduce((acc, curr) => {
                return acc + ((curr.score! / curr.maxScore!) * 100);
            }, 0);
            quizPercentage = totalQuizPercentage / quizActivities.length;
        }

        // 4. Final UTME Mapping (Subject-Based)
        // If the user has explicitly selected 4 subjects, calculate out of those 4 subjects
        if (user?.preferredSubjects && user.preferredSubjects.length === 4) {
            let totalEstimatedScore = 0;
            const BASE_SUBJECT_SCORE = 35; // 35 * 4 = 140
            const MAX_SUBJECT_SCORE = 100;

            user.preferredSubjects.forEach(subject => {
                const subjectActivities = quizActivities.filter(a =>
                    a.subject?.toLowerCase() === subject.toLowerCase() ||
                    a.subtitle?.toLowerCase() === subject.toLowerCase()
                );

                const subjectMasteryEntries = masteryEntries.filter(m =>
                    m.subject?.toLowerCase() === subject.toLowerCase()
                );

                let subjectMasteryPercentage = 0;
                if (subjectMasteryEntries.length > 0) {
                    const totalMasteryScore = subjectMasteryEntries.reduce((acc, curr) => {
                        if (curr.confidence === 'confident') return acc + 100;
                        if (curr.confidence === 'shaky') return acc + 50;
                        return acc;
                    }, 0);
                    subjectMasteryPercentage = totalMasteryScore / subjectMasteryEntries.length;
                }

                let subjectProficiency = 0;
                if (subjectActivities.length > 0) {
                    const totalQuizPercentage = subjectActivities.reduce((acc, curr) => {
                        return acc + ((curr.score! / curr.maxScore!) * 100);
                    }, 0);
                    const specificQuizPercentage = totalQuizPercentage / subjectActivities.length;

                    if (subjectMasteryEntries.length > 0) {
                        subjectProficiency = (specificQuizPercentage * 0.60) + (subjectMasteryPercentage * 0.40);
                    } else {
                        subjectProficiency = specificQuizPercentage;
                    }
                } else if (subjectMasteryEntries.length > 0) {
                    subjectProficiency = subjectMasteryPercentage; // 100% weight to mastery if no quizzes in this subject yet
                }

                const scoreRange = MAX_SUBJECT_SCORE - BASE_SUBJECT_SCORE;
                totalEstimatedScore += BASE_SUBJECT_SCORE + (subjectProficiency / 100) * scoreRange;
            });

            return Math.min(Math.round(totalEstimatedScore), MAX_SCORE);
        }

        // 5. Fallback for users who haven't selected subjects yet
        let fallbackMasteryPercentage = 0;
        if (masteryEntries.length > 0) {
            const totalMasteryScore = masteryEntries.reduce((acc, curr) => {
                if (curr.confidence === 'confident') return acc + 100;
                if (curr.confidence === 'shaky') return acc + 50;
                return acc;
            }, 0);
            fallbackMasteryPercentage = totalMasteryScore / masteryEntries.length;
        }

        let overallProficiency = 0;
        if (masteryEntries.length > 0 && quizActivities.length > 0) {
            overallProficiency = (quizPercentage * 0.60) + (fallbackMasteryPercentage * 0.40);
        } else if (quizActivities.length > 0) {
            overallProficiency = quizPercentage; // 100% weight to quizzes if no mastery
        } else if (masteryEntries.length > 0) {
            overallProficiency = fallbackMasteryPercentage; // 100% weight to mastery if no quizzes
        } else {
            return BASE_SCORE; // New user, no data
        }

        const scoreRange = MAX_SCORE - BASE_SCORE;
        const calculatedScore = BASE_SCORE + (overallProficiency / 100) * scoreRange;

        return Math.min(Math.round(calculatedScore), MAX_SCORE);
    }, [user?.preferredSubjects]);

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
        let parsedActivity: RecentActivity[] = [];
        if (savedActivity) {
            try {
                parsedActivity = JSON.parse(savedActivity);
                setRecentActivity(parsedActivity);
            } catch (e) {
                setRecentActivity([]);
            }
        }
        if (savedEngagement) {
            try {
                setEngagement(JSON.parse(savedEngagement) || { dismissedNudges: [], unlockedNudges: [], nudgeDismissalTimes: {} });
            } catch (e) {
                setEngagement({ dismissedNudges: [], unlockedNudges: [] });
            }
        }
        if (savedStudyProgress) {
            try {
                const parsed = JSON.parse(savedStudyProgress);
                setStudyProgress(parsed);
                setEstimatedScore(calculateScore(parsed, parsedActivity));
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
                    engagement?: { dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> },
                    studyProgress?: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string, subject?: string } },
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
                    const score = data.estimatedScore || calculateScore(data.studyProgress, data.recentActivity || []);
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

        // Recalculate Score locally for instant feedback
        const newScore = calculateScore(studyProgress, updatedActivity);
        setEstimatedScore(newScore);

        if (isAuthenticated) {
            try {
                // Send current estimated score to be persisted
                const response = await apiService<{
                    streak: number,
                    streakHistory: string[],
                    recentActivity: RecentActivity[],
                    engagement: { dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> },
                    estimatedScore?: number
                }>('/user/progress', {
                    method: 'PUT',
                    body: {
                        recentActivity: [newActivity],
                        estimatedScore: newScore
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

    const updateEngagementState = (newEngagement: { dismissedNudges: string[], unlockedNudges: string[], nudgeDismissalTimes?: Record<string, string> }) => {
        setEngagement(newEngagement);
        localStorage.setItem('examRediEngagement', JSON.stringify(newEngagement));
    };

    const updateConfidence = async (topicId: string, confidence: ConfidenceLevel, subject?: string) => {
        // Optimistic update
        const newProgress = {
            ...studyProgress,
            [topicId]: { confidence, lastReviewed: new Date().toISOString(), subject }
        };
        setStudyProgress(newProgress);
        setEstimatedScore(calculateScore(newProgress, recentActivity));
        localStorage.setItem('examRediStudyProgress', JSON.stringify(newProgress));

        if (isAuthenticated) {
            try {
                const response = await apiService<{
                    success: boolean,
                    studyProgress: { [key: string]: { confidence: ConfidenceLevel, lastReviewed: string, subject?: string } }
                }>('/user/progress/confidence', {
                    method: 'POST',
                    body: { topicId, confidence, subject }
                });

                if (response && response.studyProgress) {
                    setStudyProgress(response.studyProgress);
                    setEstimatedScore(calculateScore(response.studyProgress, recentActivity));
                    localStorage.setItem('examRediStudyProgress', JSON.stringify(response.studyProgress));
                }
            } catch (error) {
                console.error("Failed to update confidence:", error);
            }
        }
    };

    const calculateTopicStatus = (topicId: string): ConfidenceLevel | 'stale' | null => {
        const progress = studyProgress[topicId];
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
