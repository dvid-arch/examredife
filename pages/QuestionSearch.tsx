import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import useSEO from '../hooks/useSEO.ts';
import { usePastQuestions } from '../contexts/PastQuestionsContext.tsx';
import apiService from '../services/apiService.ts';
import { StudyGuide, PastPaper, PastQuestion } from '../types.ts';
import FilterSidebar from '../components/FilterSidebar.tsx';
import { getSubjectKey } from '../constants/subjects.ts';

// Constants
const GUEST_RESULT_LIMIT = 3;

interface SearchResult extends PastQuestion {
    paperId: string;
    subject: string;
    year: number;
    exam: string;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

const BookOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const QuestionSearch: React.FC = () => {
    const location = useLocation();
    const { isAuthenticated, requestLogin, user } = useAuth();

    useSEO({
        title: "Question Search",
        description: "Find specific past questions and answers instantly on ExamRedi."
    });
    const { papers: allPapers, guides: allGuides, isLoading, fetchPapers, fetchGuides } = usePastQuestions();

    // UI State
    const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
    const [resultsView, setResultsView] = useState<'papers' | 'questions'>('papers');

    // Search state
    const [query, setQuery] = useState('');
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [questionResults, setQuestionResults] = useState<SearchResult[]>([]);
    const [guideResults, setGuideResults] = useState<StudyGuide[]>([]);
    const [totalResultsCount, setTotalResultsCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Filter state
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

    // Recent Searches
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('examRediSearchHistory');
        if (saved) {
            try { setRecentSearches(JSON.parse(saved)); } catch (e) { }
        }
        console.log("QuestionSearch mounted, fetching data...");
        fetchPapers();
        fetchGuides();
    }, [fetchPapers, fetchGuides]);

    const isAdmin = user?.role === 'admin';

    const allowedSubjectsList = useMemo(() => {
        const allSubjects = [...new Set(allPapers.map(p => p.subject))];
        if (isAdmin || !user?.preferredSubjects?.length) {
            return allSubjects;
        }

        const preferredKeys = user.preferredSubjects.map(s => getSubjectKey(s)).filter(Boolean);
        return allSubjects.filter(s => {
            const paperKey = getSubjectKey(s);
            if (!paperKey) return false;
            return paperKey === 'english' || preferredKeys.includes(paperKey);
        });
    }, [allPapers, isAdmin, user?.preferredSubjects]);

    const performSearch = useCallback(async (searchQuery: string) => {
        console.log("Performing search for:", searchQuery);
        if (!searchQuery.trim()) {
            setResultsView('papers');
            setHasSearched(false);
            return;
        }

        setIsLoadingSearch(true);
        setHasSearched(true);
        setResultsView('questions');

        try {
            const rawResults = await apiService<SearchResult[]>(`/data/search?query=${encodeURIComponent(searchQuery)}`);
            
            // Filter search results based on allowed subjects
            const results = isAdmin || !user?.preferredSubjects?.length 
                ? rawResults 
                : rawResults.filter(r => {
                      const paperKey = getSubjectKey(r.subject);
                      if (!paperKey) return false;
                      const preferredKeys = user.preferredSubjects!.map(s => getSubjectKey(s)).filter(Boolean);
                      return paperKey === 'english' || preferredKeys.includes(paperKey);
                  });

            const lowerCaseQuery = searchQuery.toLowerCase();
            const rawGuides = allGuides.filter(g =>
                g.subject.toLowerCase().includes(lowerCaseQuery) ||
                g.topics.some(t => t.title.toLowerCase().includes(lowerCaseQuery))
            );
            
            // Filter guides as well
            const filteredGuides = isAdmin || !user?.preferredSubjects?.length 
                ? rawGuides
                : rawGuides.filter(g => {
                      const guideKey = getSubjectKey(g.subject);
                      if (!guideKey) return false;
                      const preferredKeys = user.preferredSubjects!.map(s => getSubjectKey(s)).filter(Boolean);
                      return guideKey === 'english' || preferredKeys.includes(guideKey);
                  });

            setTotalResultsCount(results.length + filteredGuides.length);

            if (isAuthenticated) {
                setQuestionResults(results);
                setGuideResults(filteredGuides);
            } else {
                setQuestionResults(results.slice(0, GUEST_RESULT_LIMIT));
                setGuideResults(filteredGuides.slice(0, 1));
            }
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoadingSearch(false);
        }

        setRecentSearches(prev => {
            const newHistory = [searchQuery, ...prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())].slice(0, 5);
            localStorage.setItem('examRediSearchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, [isAuthenticated, allGuides, isAdmin, user?.preferredSubjects]);

    useEffect(() => {
        const initialQuery = location.state?.query;
        if (typeof initialQuery === 'string' && allPapers.length > 0) {
            setQuery(initialQuery);
            performSearch(initialQuery);
        }
    }, [location.state, performSearch, allPapers]);

    const subjects = useMemo(() => {
        return ['all', ...allowedSubjectsList].sort();
    }, [allowedSubjectsList]);

    const years = useMemo(() => {
        const allowedPapers = allPapers.filter(paper => allowedSubjectsList.includes(paper.subject));
        const uniqueYears = [...new Set(allowedPapers.map(p => p.year))].sort((a, b) => Number(b) - Number(a));
        return ['all', ...uniqueYears];
    }, [allPapers, allowedSubjectsList]);

    const filteredPapers = useMemo(() => {
        return allPapers.filter(paper => {
            if (!allowedSubjectsList.includes(paper.subject)) return false;
            const subjectMatch = selectedSubject === 'all' || paper.subject === selectedSubject;
            const yearMatch = selectedYear === 'all' || paper.year === Number(selectedYear);
            return subjectMatch && yearMatch;
        }).sort((a, b) => b.year - a.year || a.subject.localeCompare(b.subject));
    }, [selectedSubject, selectedYear, allPapers, allowedSubjectsList]);

    const highlightQuery = (text: string, highlight: string): string => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight})`, 'gi');
        return text.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 pb-20">
            {/* Sidebar Filters */}
            <FilterSidebar
                subjects={subjects}
                years={years}
                selectedSubject={selectedSubject}
                selectedYear={selectedYear}
                onSubjectChange={setSelectedSubject}
                onYearChange={setSelectedYear}
                isOpen={isFilterSidebarOpen}
                onClose={() => setIsFilterSidebarOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 space-y-6">
                <Card className="p-4 lg:p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-none shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <SearchIcon />
                            </span>
                            <form onSubmit={(e) => { e.preventDefault(); performSearch(query); }}>
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by keyword (e.g., Photosynthesis, Newton...)"
                                    className="w-full bg-slate-100 dark:bg-slate-700/50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary shadow-inner text-slate-800 dark:text-white"
                                />
                            </form>
                        </div>
                        <button
                            onClick={() => setIsFilterSidebarOpen(true)}
                            className="lg:hidden flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 font-bold text-slate-700 dark:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </button>
                    </div>

                    {recentSearches.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recent:</span>
                            {recentSearches.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => { setQuery(s); performSearch(s); }}
                                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 transition-colors border border-slate-100 dark:border-slate-700 shadow-sm"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                            {resultsView === 'questions' ? `Search Results (${totalResultsCount})` : `Library (${filteredPapers.length} Papers)`}
                        </h2>
                        {resultsView === 'questions' && (
                            <button
                                onClick={() => { setQuery(''); performSearch(''); }}
                                className="text-sm font-bold text-primary hover:text-accent transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>

                    {isLoading || isLoadingSearch ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                            <p className="text-slate-500 font-medium">Loading results...</p>
                        </div>
                    ) : resultsView === 'papers' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredPapers.map(paper => (
                                <Card key={paper.id} className="p-0 overflow-hidden border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group">
                                    <button
                                        onClick={() => setExpandedPaperId(expandedPaperId === paper.id ? null : paper.id)}
                                        className="w-full text-left p-5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg group-hover:scale-110 transition-transform">
                                                {paper.subject.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{paper.subject}</h3>
                                                <p className="text-sm text-slate-500">{paper.exam} • {paper.year}</p>
                                            </div>
                                        </div>
                                        <span className={`transform transition-transform ${expandedPaperId === paper.id ? 'rotate-180 text-primary' : 'text-slate-300'}`}>
                                            <ChevronDownIcon />
                                        </span>
                                    </button>
                                    {expandedPaperId === paper.id && (
                                        <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
                                            {paper.questions.map((q, idx) => (
                                                <div key={q.id} className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                                                    <div className="font-bold text-xs text-slate-400">QUESTION {idx + 1}</div>
                                                    <QuestionRenderer question={q} className="text-slate-800 dark:text-slate-200" />
                                                    <details className="group/ans">
                                                        <summary className="list-none cursor-pointer inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest hover:text-accent font-black transition-colors">
                                                            <span>Show Answer</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-open/ans:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </summary>
                                                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">{q.answer}</span>
                                                                <span className="font-bold text-green-700 dark:text-green-400 text-sm">Correct Answer</span>
                                                            </div>
                                                            <div className="text-green-800 dark:text-green-200 text-sm">
                                                                <MarkdownRenderer content={q.options[q.answer]?.text || ''} />
                                                            </div>
                                                        </div>
                                                    </details>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            ))}
                            {filteredPapers.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">No papers found</h3>
                                    <p className="text-slate-500 mt-2">Try adjusting your filters or search keywords.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {guideResults.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Study Guides</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {guideResults.map(guide => (
                                            <Link
                                                key={guide.id}
                                                to={`/study-guides/${guide.id}`}
                                                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow flex items-center gap-4 group"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">📖</div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{guide.subject}</h3>
                                                    <p className="text-xs text-slate-500">{guide.topics.length} topics available</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {questionResults.length > 0 && (
                                <section>
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Questions</h2>
                                    <div className="space-y-6">
                                        {questionResults.map((q, idx) => (
                                            <Card key={q.id} className="p-6 border-slate-100 dark:border-slate-800 transition-all hover:border-primary/30">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">RESULT {idx + 1}</span>
                                                    <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{q.subject} {q.year}</span>
                                                </div>
                                                <QuestionRenderer
                                                    question={q}
                                                    questionContent={highlightQuery(q.question, query)}
                                                    className="text-lg text-slate-800 dark:text-white mb-6"
                                                />
                                                <details className="group/ans">
                                                    <summary className="list-none cursor-pointer inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                                        <span>View Answer</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-open/ans:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </summary>
                                                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-500/10 rounded-2xl border border-green-100 dark:border-green-500/20">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">{q.answer}</span>
                                                            <span className="font-bold text-green-700 dark:text-green-400 text-sm">Correct Answer</span>
                                                        </div>
                                                        <div className="text-green-800 dark:text-green-200 text-sm">
                                                            <MarkdownRenderer content={highlightQuery(q.options[q.answer]?.text || '', query)} />
                                                        </div>
                                                    </div>
                                                </details>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {!isAuthenticated && totalResultsCount > (questionResults.length + (guideResults.length)) && (
                                <div className="text-center p-8 bg-primary/5 rounded-3xl border border-primary/20">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unlock all {totalResultsCount} results</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">Create a free account to search our entire library of over 10,000 questions.</p>
                                    <button
                                        onClick={requestLogin}
                                        className="bg-primary text-white font-black py-3 px-8 rounded-xl shadow-lg hover:shadow-primary/30 transition-all"
                                    >
                                        Create Free Account
                                    </button>
                                </div>
                            )}

                            {questionResults.length === 0 && guideResults.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="text-5xl mb-6 opacity-20">🔍</div>
                                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">No results found</h3>
                                    <p className="text-slate-500 mt-2">Try a different search term or browse the library.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionSearch;
