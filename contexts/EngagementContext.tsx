import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EngagementNudge } from '../types.ts';
import { NUDGE_REGISTRY } from '../constants/engagementRules.ts';
import { useUserProgress } from './UserProgressContext.tsx';
import apiService from '../services/apiService.ts';
import { useAuth } from './AuthContext.tsx';

interface EngagementContextType {
    activeNudge: EngagementNudge | null;
    triggerNudge: (id: string | EngagementNudge) => void;
    dismissNudge: () => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

export const EngagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { engagement, updateEngagementState } = useUserProgress();
    const [activeNudge, setActiveNudge] = useState<EngagementNudge | null>(null);

    // Sync newly unlocked nudges from backend
    useEffect(() => {
        if (engagement && engagement.unlockedNudges && engagement.unlockedNudges.length > 0) {
            // Find the first unlocked nudge that isn't dismissed and isn't currently active
            const nextNudgeId = engagement.unlockedNudges.find(id => !engagement.dismissedNudges.includes(id));
            if (nextNudgeId && (!activeNudge || activeNudge.id !== nextNudgeId)) {
                const nudge = NUDGE_REGISTRY[nextNudgeId];
                if (nudge) {
                    // Small delay to ensure it doesn't pop up immediately on page load
                    const timer = setTimeout(() => setActiveNudge(nudge), 1500);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [engagement, activeNudge]);

    const triggerNudge = useCallback((nudge: EngagementNudge | string) => {
        if (typeof nudge === 'string') {
            const registryNudge = NUDGE_REGISTRY[nudge];
            if (registryNudge && (!engagement || !engagement.dismissedNudges.includes(registryNudge.id))) {
                setActiveNudge(registryNudge);
            }
        } else if (!engagement || !engagement.dismissedNudges.includes(nudge.id)) {
            setActiveNudge(nudge);
        }
    }, [engagement]);

    const dismissNudge = useCallback(async () => {
        if (activeNudge) {
            const nudgeId = activeNudge.id;

            // Build new engagement state
            const currentDismissed = engagement?.dismissedNudges || [];
            if (!currentDismissed.includes(nudgeId)) {
                const newEngagement = {
                    ...engagement,
                    dismissedNudges: [...currentDismissed, nudgeId]
                };
                updateEngagementState(newEngagement);
            }

            setActiveNudge(null);

            if (isAuthenticated) {
                try {
                    await apiService('/user/progress/engagement/dismiss', {
                        method: 'POST',
                        body: { nudgeId }
                    });
                } catch (error) {
                    console.error("Failed to sync nudge dismissal to backend:", error);
                }
            }
        }
    }, [activeNudge, engagement, updateEngagementState, isAuthenticated]);

    return (
        <EngagementContext.Provider value={{ activeNudge, triggerNudge, dismissNudge }}>
            {children}
        </EngagementContext.Provider>
    );
};

export const useEngagement = () => {
    const context = useContext(EngagementContext);
    if (!context) throw new Error('useEngagement must be used within EngagementProvider');
    return context;
};
