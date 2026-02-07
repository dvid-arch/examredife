import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
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
    const [hasFetchedPapers, setHasFetchedPapers] = useState(false);
    const [hasFetchedGuides, setHasFetchedGuides] = useState(false);

    const fetchPapers = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && hasFetchedPapers && papers.length > 0) {
            return papers;
        }

        setIsLoading(true);
        try {
            const data = await apiService<PastPaper[]>('/data/papers');
            setPapers(data);
            setHasFetchedPapers(true);
            return data;
        } catch (error) {
            console.error("Failed to fetch papers:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [hasFetchedPapers, papers]);

    const fetchGuides = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && hasFetchedGuides && guides.length > 0) {
            return guides;
        }

        setIsLoading(true);
        try {
            const data = await apiService<StudyGuide[]>('/data/guides');
            setGuides(data);
            setHasFetchedGuides(true);
            return data;
        } catch (error) {
            console.error("Failed to fetch guides:", error);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [hasFetchedGuides, guides]);

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
