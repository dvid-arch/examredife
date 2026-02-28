import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { PastPaper, StudyGuide } from '../types.ts';
import apiService from '../services/apiService.ts';
import { getCache, setCache } from '../services/db.ts';

// Cache keys used in IndexedDB
const CACHE_KEY_PAPERS = 'papers_v3';
const CACHE_KEY_GUIDES = 'guides_v4';

interface PastQuestionsContextType {
    papers: PastPaper[];
    guides: StudyGuide[];
    isLoading: boolean;
    fetchPapers: (forceRefresh?: boolean) => Promise<PastPaper[]>;
    fetchGuides: (forceRefresh?: boolean) => Promise<StudyGuide[]>;
}

const PastQuestionsContext = createContext<PastQuestionsContextType | undefined>(undefined);

export const PastQuestionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [papers, setPapers] = useState<PastPaper[]>([]);
    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // In-memory refs to short-circuit duplicate calls within the same session
    const hasFetchedPapersRef = useRef(false);
    const hasFetchedGuidesRef = useRef(false);
    const papersRef = useRef<PastPaper[]>([]);
    const guidesRef = useRef<StudyGuide[]>([]);

    const fetchPapers = useCallback(async (forceRefresh = false) => {
        // 1. In-memory cache hit (same session, no reload needed)
        if (!forceRefresh && hasFetchedPapersRef.current) {
            return papersRef.current;
        }

        // 2. IndexedDB cache hit (persists across page reloads, 24h TTL)
        if (!forceRefresh) {
            const cached = await getCache<PastPaper[]>(CACHE_KEY_PAPERS);
            if (cached && cached.length > 0) {
                console.log(`[Cache] Loaded ${cached.length} papers from IndexedDB`);
                setPapers(cached);
                papersRef.current = cached;
                hasFetchedPapersRef.current = true;
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
    }, []);

    const fetchGuides = useCallback(async (forceRefresh = false) => {
        // 1. In-memory cache hit
        if (!forceRefresh && hasFetchedGuidesRef.current) {
            return guidesRef.current;
        }

        // 2. IndexedDB cache hit (persists across page reloads, 24h TTL)
        if (!forceRefresh) {
            const cached = await getCache<StudyGuide[]>(CACHE_KEY_GUIDES);
            if (cached && cached.length > 0) {
                console.log(`[Cache] Loaded ${cached.length} guides from IndexedDB`);
                setGuides(cached);
                guidesRef.current = cached;
                hasFetchedGuidesRef.current = true;
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
    }, []);

    return (
        <PastQuestionsContext.Provider value={{ papers, guides, isLoading, fetchPapers, fetchGuides }}>
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
