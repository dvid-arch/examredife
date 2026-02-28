import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from 'react';
import { PastPaper, StudyGuide } from '../types.ts';
import apiService from '../services/apiService.ts';
import { getCache, setCache } from '../services/db.ts';
import { useAuth } from './AuthContext.tsx';


interface PastQuestionsContextType {
    papers: PastPaper[];
    guides: StudyGuide[];
    isLoading: boolean;
    lastFetchedPapers: number | null;
    lastFetchedGuides: number | null;
    fetchPapers: (forceRefresh?: boolean) => Promise<PastPaper[]>;
    fetchGuides: (forceRefresh?: boolean) => Promise<StudyGuide[]>;
    invalidateCache: (type: 'papers' | 'guides' | 'all') => void;
}

const PastQuestionsContext = createContext<PastQuestionsContextType | undefined>(undefined);

export const PastQuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [papers, setPapers] = useState<PastPaper[]>([]);
    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [lastFetchedPapers, setLastFetchedPapers] = useState<number | null>(null);
    const [lastFetchedGuides, setLastFetchedGuides] = useState<number | null>(null);
    const { isAuthenticated } = useAuth();

    // Staleness threshold (e.g. 1 hour in ms)
    const STALE_THRESHOLD = 60 * 60 * 1000;

    // Cache keys are now auth-aware to handle the truncated data for guests
    const AUTH_SUFFIX = isAuthenticated ? '_auth' : '_guest';
    const CACHE_KEY_PAPERS = `examRedi_papers${AUTH_SUFFIX}`;
    const CACHE_KEY_GUIDES = `examRedi_guides${AUTH_SUFFIX}`;

    // In-memory refs to short-circuit duplicate calls within the same session
    const hasFetchedPapersRef = useRef(false);
    const hasFetchedGuidesRef = useRef(false);
    const papersRef = useRef<PastPaper[]>([]);
    const guidesRef = useRef<StudyGuide[]>([]);

    // Keep refs in sync with state for immediate access in the same session
    useEffect(() => {
        papersRef.current = papers;
    }, [papers]);

    useEffect(() => {
        guidesRef.current = guides;
    }, [guides]);

    const fetchPapers = useCallback(async (forceRefresh = false) => {
        const now = Date.now();
        const isStale = lastFetchedPapers && (now - lastFetchedPapers > STALE_THRESHOLD);

        // 1. In-memory cache hit (same session, not stale, unless forced)
        if (!forceRefresh && hasFetchedPapersRef.current && !isStale) {
            return papersRef.current;
        }

        // 2. IndexedDB cache hit (persists across page reloads, 24h TTL)
        if (!forceRefresh && !isStale) {
            const cached = await getCache<PastPaper[]>(CACHE_KEY_PAPERS);
            if (cached && cached.length > 0) {
                console.log(`[Cache] Loaded ${cached.length} papers from IndexedDB`);
                setPapers(cached);
                papersRef.current = cached;
                hasFetchedPapersRef.current = true;
                setLastFetchedPapers(now);
                return cached;
            }
        }

        // 3. Network fetch (first load or forced refresh)
        setIsLoading(true);
        try {
            console.log('[Cache] Fetching papers from network...');
            const data = await apiService<PastPaper[]>('/data/papers');
            setPapers(data);
            papersRef.current = data;
            hasFetchedPapersRef.current = true;
            setLastFetchedPapers(Date.now());

            // Persist to IndexedDB for future loads
            await setCache(CACHE_KEY_PAPERS, data);
            console.log(`[Cache] Persisted ${data.length} papers to IndexedDB`);

            return data;
        } catch (error) {
            console.error("Failed to fetch papers:", error);
            // Mark as fetched even on error to prevent infinite retry loops in the same session
            hasFetchedPapersRef.current = true;
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [lastFetchedPapers, isAuthenticated, CACHE_KEY_PAPERS]); // Add isAuthenticated and CACHE_KEY_PAPERS to dependencies

    const fetchGuides = useCallback(async (forceRefresh = false) => {
        const now = Date.now();
        const isStale = lastFetchedGuides && (now - lastFetchedGuides > STALE_THRESHOLD);

        // 1. In-memory cache hit
        if (!forceRefresh && hasFetchedGuidesRef.current && !isStale) {
            return guidesRef.current;
        }

        // 2. IndexedDB cache hit (persists across page reloads, 24h TTL)
        if (!forceRefresh && !isStale) {
            const cached = await getCache<StudyGuide[]>(CACHE_KEY_GUIDES);
            if (cached && cached.length > 0) {
                console.log(`[Cache] Loaded ${cached.length} guides from IndexedDB`);
                setGuides(cached);
                guidesRef.current = cached;
                hasFetchedGuidesRef.current = true;
                setLastFetchedGuides(now);
                return cached;
            }
        }

        // 3. Network fetch
        setIsLoading(true);
        try {
            console.log('[Cache] Fetching guides from network...');
            const data = await apiService<StudyGuide[]>('/data/guides');
            setGuides(data);
            guidesRef.current = data;
            hasFetchedGuidesRef.current = true;
            setLastFetchedGuides(Date.now());

            // Persist to IndexedDB for future loads
            await setCache(CACHE_KEY_GUIDES, data);
            console.log(`[Cache] Persisted ${data.length} guides to IndexedDB`);

            return data;
        } catch (error) {
            console.error("Failed to fetch guides:", error);
            // Mark as fetched even on error to prevent infinite retry loops
            hasFetchedGuidesRef.current = true;
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [lastFetchedGuides, isAuthenticated, CACHE_KEY_GUIDES]); // Add isAuthenticated and CACHE_KEY_GUIDES to dependencies

    const invalidateCache = useCallback((type: 'papers' | 'guides' | 'all') => {
        if (type === 'papers' || type === 'all') {
            hasFetchedPapersRef.current = false;
            setLastFetchedPapers(null);
            setPapers([]); // Clear papers state
        }
        if (type === 'guides' || type === 'all') {
            hasFetchedGuidesRef.current = false;
            setLastFetchedGuides(null);
            setGuides([]); // Clear guides state
        }
    }, []);

    // Effect to re-fetch data when authentication status changes
    useEffect(() => {
        // Invalidate cache and re-fetch data when isAuthenticated changes
        // This ensures the correct data (guest vs. authenticated) is loaded
        invalidateCache('all');
        fetchPapers();
        fetchGuides();
    }, [isAuthenticated, invalidateCache, fetchPapers, fetchGuides]);

    return (
        <PastQuestionsContext.Provider value={{
            papers,
            guides,
            isLoading,
            lastFetchedPapers,
            lastFetchedGuides,
            fetchPapers,
            fetchGuides,
            invalidateCache
        }}>
            {children}
        </PastQuestionsContext.Provider>
    );
};

export const usePastQuestions = () => {
    const context = useContext(PastQuestionsContext);
    if (context === undefined) {
        throw new Error('usePastQuestions must be used within a PastQuestionsProvider');
    }
    return context;
};
