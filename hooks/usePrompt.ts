import { useEffect, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * A hook that prompts the user when they try to leave the current state
 * (including back button, link clicks, and tab close).
 * 
 * @param shouldBlock - Boolean indicating if the prompt should be shown
 * @param message - The message to show in the confirmation dialog
 */
export const usePrompt = (shouldBlock: boolean, message: string = 'Are you sure you want to leave? Your unsaved progress will be lost.') => {

    // Handle react-router navigation (back button, link clicks)
    const blocker = useBlocker(
        useCallback(
            ({ currentLocation, nextLocation }) =>
                shouldBlock && currentLocation.pathname !== nextLocation.pathname,
            [shouldBlock]
        )
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            const confirmed = window.confirm(message);
            if (confirmed) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker, message]);

    // Handle browser tab close / refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (shouldBlock) {
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [shouldBlock, message]);

    return blocker;
};
