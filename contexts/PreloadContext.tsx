import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useAuth } from './AuthContext.tsx';
import { usePastQuestions } from './PastQuestionsContext.tsx';
import { useUserProgress } from './UserProgressContext.tsx';

interface PreloadContextType {
    progress: number;
    isComplete: boolean;
    isFirstVisit: boolean;
    error: string | null;
    retry: () => void;
}

const PreloadContext = createContext<PreloadContextType | undefined>(undefined);

export const PreloadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [isFirstVisit, setIsFirstVisit] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const hasRunRef = useRef(false);

    useEffect(() => {
        const visited = localStorage.getItem('examRedi_hasVisited');
        if (!visited) {
            setIsFirstVisit(true);
            localStorage.setItem('examRedi_hasVisited', 'true');
        }
    }, []);

    const { fetchUserProfile, isAuthenticated } = useAuth();
    const { fetchPapers, fetchGuides } = usePastQuestions();
    const { syncProgress } = useUserProgress();

    useEffect(() => {
        // Prevent multiple runs except on explicit retry
        if (hasRunRef.current && retryCount === 0) return;
        hasRunRef.current = true;

        const preload = async () => {
            try {
                setError(null);
                setProgress(5);

                // 1. Auth Sync
                setProgress(15);
                let profile = null;
                try {
                    profile = await (fetchUserProfile as any)();
                } catch (e) {
                    console.warn("Auth sync during preload failed", e);
                }
                setProgress(30);

                // 2. Data Fetching (Parallel)
                const dataTasks = [
                    fetchPapers().catch(e => console.warn("Papers fetch failed:", e)).then(() => setProgress(prev => Math.min(prev + 25, 80))),
                    fetchGuides().catch(e => console.warn("Guides fetch failed:", e)).then(() => setProgress(prev => Math.min(prev + 25, 80)))
                ];

                await Promise.all(dataTasks);
                setProgress(85);

                // 3. Progress Sync (If authenticated)
                if (profile || isAuthenticated) {
                    try {
                        await syncProgress();
                    } catch (e) {
                        console.warn("Progress sync failed:", e);
                    }
                }
                setProgress(100);

                setTimeout(() => {
                    setIsComplete(true);
                }, 500);

            } catch (err: any) {
                console.error('Preloading failed:', err);
                const isAuthError = err.message?.toLowerCase().includes('session expired');
                if (!isAuthError) {
                    setError(err.message || 'Failed to prepare your study session. Please check your connection.');
                } else {
                    // Let AuthContext handle the expired session
                    setIsComplete(true);
                }
            }
        };

        preload();
    }, [retryCount, fetchUserProfile, fetchPapers, fetchGuides, syncProgress]);

    const retry = () => {
        setRetryCount(prev => prev + 1);
        setIsComplete(false);
        setProgress(0);
    };

    return (
        <PreloadContext.Provider value={{ progress, isComplete, isFirstVisit, error, retry }}>
            {children}
        </PreloadContext.Provider>
    );
};

export const usePreload = () => {
    const context = useContext(PreloadContext);
    if (context === undefined) {
        throw new Error('usePreload must be used within a PreloadProvider');
    }
    return context;
};
