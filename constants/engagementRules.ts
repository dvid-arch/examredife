import { EngagementNudge } from '../types.ts';

export const NUDGE_REGISTRY: Record<string, EngagementNudge> = {
    'utme-challenge-100k': {
        id: 'utme-challenge-100k',
        title: 'Win \u20A6100,000!',
        message: 'Join the UTME Challenge and compete with students nationwide for the monthly top prize.',
        type: 'BOTTOM_SHEET',
        icon: 'trophy',
        actionLabel: 'Join Challenge',
        actionPath: '/utme-challenge',
        ctaColor: '#22c55e'
    },
    'pro-success-stat': {
        id: 'pro-success-stat',
        title: 'Unlock Your Success',
        message: '90% of Pro users gain admission into their first choice course. Unlock the features that turn luck into mastery.',
        type: 'MODAL',
        icon: 'rocket',
        actionLabel: 'Go Pro Today',
        actionPath: '/profile',
        ctaColor: '#8b5cf6',
        isRecurring: true
    },
    'streak-motivator': {
        id: 'streak-motivator',
        title: 'Keep it going!',
        message: 'You are on a roll. Complete one more session to hit a new personal record.',
        type: 'BOTTOM_SHEET',
        icon: 'fire',
        actionLabel: 'Start Quiz',
        actionPath: '/practice',
        ctaColor: '#f59e0b'
    }
};

interface TriggerConditions {
    minScore?: number;
    maxScore?: number;
    minSessions?: number;
    subscriptionStatus?: 'free' | 'pro' | 'any';
    isTopicMastery?: boolean;
}

/**
 * Checks if a specific nudge should be triggered based on current user context
 */
export const evaluateNudgeTrigger = (nudgeId: string, context: TriggerConditions): boolean => {
    // This is a simplified version of a rules engine
    switch (nudgeId) {
        case 'pro-success-stat':
            // Universal monetization: Show to all free users after a session
            // Everyone deserves to support the product they're using
            return context.subscriptionStatus === 'free';
        case 'utme-challenge-100k':
            // Performance reward: Keep this for the "Victory Lap" top performers
            return (context.minScore || 0) > 85;
        case 'streak-motivator':
            return (context.minSessions || 0) > 1;
        default:
            return false;
    }
};
