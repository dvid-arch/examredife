import React, { createContext, useState, useContext, ReactNode, useCallback, useRef } from 'react';
import { PastPaper, StudyGuide } from '../types.ts';
import apiService from '../services/apiService.ts';

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

    // Use refs to track fetched status without triggering re-renders or changing function identities
    const hasFetchedPapersRef = useRef(false);
    const hasFetchedGuidesRef = useRef(false);
    // Track papers/guides in refs for synchronous access in fetch functions if needed
    const papersRef = useRef<PastPaper[]>([]);
    const guidesRef = useRef<StudyGuide[]>([]);

    const fetchPapers = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && hasFetchedPapersRef.current && papersRef.current.length > 0) {
            return papersRef.current;
        }

        setIsLoading(true);
        try {
            const data = await apiService<PastPaper[]>('/data/papers');
            setPapers(data);
            papersRef.current = data;
            hasFetchedPapersRef.current = true;
            return data;
        } catch (error) {
            console.error("Failed to fetch papers:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array ensures stability

    const fetchGuides = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && hasFetchedGuidesRef.current && guidesRef.current.length > 0) {
            return guidesRef.current;
        }

        setIsLoading(true);
        try {
            const data = await apiService<StudyGuide[]>('/data/guides');
            setGuides(data);
            guidesRef.current = data;
            hasFetchedGuidesRef.current = true;
            return data;
        } catch (error) {
            console.error("Failed to fetch guides:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array ensures stability

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
