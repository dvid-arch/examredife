import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
        const preload = async () => {
            try {
                setError(null);
                setProgress(5); // Initial kick-off

                // 1. Auth Sync (Check if token is valid and get user profile)
                // We assume AuthContext already has its own internal check, but we might want to wait for it.
                // If fetchUserProfile is exported, we can call it here.
                setProgress(15);
                const profile = await (fetchUserProfile as any)();
                setProgress(30);

                // 2. Data Fetching (Parallel)
                const dataTasks = [
                    fetchPapers().then(() => setProgress(prev => Math.min(prev + 25, 80))),
                    fetchGuides().then(() => setProgress(prev => Math.min(prev + 25, 80)))
                ];

                await Promise.all(dataTasks);
                setProgress(85);

                // 3. Progress Sync (If authenticated)
                if (profile || isAuthenticated) {
                    await syncProgress();
                }
                setProgress(100);

                // Delay a bit for smooth transition
                setTimeout(() => {
                    setIsComplete(true);
                }, 500);

            } catch (err: any) {
                console.error('Preloading failed:', err);
                setError(err.message || 'Failed to prepare your study session. Please check your connection.');
                // Don't stop the app entirely, but maybe show an error in the preloader
            }
        };

        preload();
    }, [retryCount, fetchUserProfile, fetchPapers, fetchGuides, syncProgress, isAuthenticated]);

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
