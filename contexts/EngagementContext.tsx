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

const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12 hours

export const EngagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const { engagement, updateEngagementState } = useUserProgress();
    const [activeNudge, setActiveNudge] = useState<EngagementNudge | null>(null);

    // Server-side cooldown check using nudgeDismissalTimes returned by backend
    const isNudgeOnCooldown = useCallback((nudgeId: string) => {
        const dismissalTimes = engagement?.nudgeDismissalTimes;
        if (!dismissalTimes) return false;
        const lastDismissed = dismissalTimes[nudgeId];
        if (!lastDismissed) return false;
        return (Date.now() - new Date(lastDismissed).getTime()) < COOLDOWN_MS;
    }, [engagement]);

    // Sync newly unlocked nudges from backend
    useEffect(() => {
        if (engagement && engagement.unlockedNudges && engagement.unlockedNudges.length > 0) {
            const nextNudgeId = engagement.unlockedNudges.find(id => {
                const registryNudge = NUDGE_REGISTRY[id];
                if (!registryNudge) return false;

                if (registryNudge.isRecurring) {
                    // Recurring: show unless currently within the 12-hour cooldown
                    return !isNudgeOnCooldown(id);
                } else {
                    // One-time: show unless permanently dismissed
                    return !engagement.dismissedNudges.includes(id);
                }
            });

            if (nextNudgeId && (!activeNudge || activeNudge.id !== nextNudgeId)) {
                const nudge = NUDGE_REGISTRY[nextNudgeId];
                if (nudge) {
                    // Small delay to ensure it doesn't pop up immediately on page load
                    const timer = setTimeout(() => setActiveNudge(nudge), 1500);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [engagement, activeNudge, isNudgeOnCooldown]);

    const triggerNudge = useCallback((nudge: EngagementNudge | string) => {
        const resolvedNudge = typeof nudge === 'string' ? NUDGE_REGISTRY[nudge] : nudge;
        if (!resolvedNudge) return;

        const canShow = resolvedNudge.isRecurring
            ? !isNudgeOnCooldown(resolvedNudge.id)
            : (!engagement || !engagement.dismissedNudges.includes(resolvedNudge.id));

        if (canShow) setActiveNudge(resolvedNudge);
    }, [engagement, isNudgeOnCooldown]);

    const dismissNudge = useCallback(async () => {
        if (!activeNudge) return;
        const nudgeId = activeNudge.id;
        const isRecurring = activeNudge.isRecurring;

        setActiveNudge(null);

        if (!isRecurring) {
            // Optimistically update local state for permanent dismissals
            const currentDismissed = engagement?.dismissedNudges || [];
            if (!currentDismissed.includes(nudgeId)) {
                updateEngagementState({
                    ...engagement,
                    dismissedNudges: [...currentDismissed, nudgeId]
                });
            }
        } else {
            // Optimistically update local state for recurring dismissals to prevent loops
            const currentTimes = engagement?.nudgeDismissalTimes || {};
            updateEngagementState({
                ...engagement,
                nudgeDismissalTimes: {
                    ...currentTimes,
                    [nudgeId]: new Date().toISOString()
                }
            });
        }

        // Always call backend: it handles recurring (timestamp) and permanent (dismissedNudges) dismissals
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
