import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PastQuestion, PastPaper } from '../types.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import apiService from '../services/apiService.ts';


interface SearchResult extends PastQuestion {
    subject: string;
    year: number;
    exam: string;
}

const GUEST_RESULT_LIMIT = 3;

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;


const QuestionSearch: React.FC = () => {
    const location = useLocation();
    const { isAuthenticated, requestLogin } = useAuth();
    const [activeTab, setActiveTab] = useState<'browse' | 'search'>('browse');
    const [allPapers, setAllPapers] = useState<PastPaper[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Search state
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [totalResultsCount, setTotalResultsCount] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    // Browse state
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');
    const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const data: PastPaper[] = await apiService('/data/papers');
                setAllPapers(data);
            } catch (error) {
                console.error("Failed to fetch past papers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const performSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        const lowerCaseQuery = searchQuery.toLowerCase();
        const allQuestions: SearchResult[] = allPapers.flatMap(paper =>
            paper.questions.map(q => ({
                ...q,
                subject: paper.subject,
                year: paper.year,
                exam: paper.exam,
            }))
        );

        const filteredResults = allQuestions.filter(q => {
            const questionText = q.question.toLowerCase();
            const optionsText = Object.values(q.options).map(o => o.text).join(' ').toLowerCase();
            return questionText.includes(lowerCaseQuery) || optionsText.includes(lowerCaseQuery);
        });
        
        setTotalResultsCount(filteredResults.length);

        if (isAuthenticated) {
            setResults(filteredResults);
        } else {
            setResults(filteredResults.slice(0, GUEST_RESULT_LIMIT));
        }

        setHasSearched(true);
    }, [isAuthenticated, allPapers]);
    
    useEffect(() => {
        const initialQuery = location.state?.query;
        if (typeof initialQuery === 'string' && allPapers.length > 0) {
            setQuery(initialQuery);
            performSearch(initialQuery);
            setActiveTab('search');
        }
    }, [location.state, performSearch, allPapers]);

    const handleSearchFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    const subjects = useMemo(() => {
        const uniqueSubjects = [...new Set(allPapers.map(p => p.subject))].sort();
        return ['all', ...uniqueSubjects];
    }, [allPapers]);

    const years = useMemo(() => {
        // FIX: Explicitly cast years to numbers for sorting to resolve arithmetic operation type error.
        const uniqueYears = [...new Set(allPapers.map(p => p.year))].sort((a, b) => Number(b) - Number(a));
        return ['all', ...uniqueYears];
    }, [allPapers]);

    const filteredPapers = useMemo(() => {
        return allPapers.filter(paper => {
            const subjectMatch = selectedSubject === 'all' || paper.subject === selectedSubject;
            const yearMatch = selectedYear === 'all' || paper.year === Number(selectedYear);
            return subjectMatch && yearMatch;
        }).sort((a, b) => b.year - a.year || a.subject.localeCompare(b.subject));
    }, [selectedSubject, selectedYear, allPapers]);

    const handleTogglePaper = (paperId: string) => {
        setExpandedPaperId(prevId => (prevId === paperId ? null : paperId));
    };
    
    const highlightQuery = (text: string, highlight: string): string => {
        if (!highlight.trim()) {
            return text;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        // Use a string replacement that can be parsed by rehype-raw
        return text.replace(regex, `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`);
    };

    const renderBrowser = () => (
        <Card>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="subject-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Subject</label>
                        <select
                            id="subject-filter"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {subjects.map(s => <option key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</option>)}
                        </select>
                    </div>
                     <div className="flex-1">
                        <label htmlFor="year-filter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Year</label>
                        <select
                            id="year-filter"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                           {years.map(y => <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                    {isLoading ? (
                         <p className="text-center text-slate-500 py-10">Loading papers...</p>
                    ) : filteredPapers.length > 0 ? (
                        <div className="space-y-2">
                            {filteredPapers.map(paper => (
                                <div key={paper.id} className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => handleTogglePaper(paper.id)}
                                        className="w-full flex justify-between items-center p-3 text-left bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        aria-expanded={expandedPaperId === paper.id}
                                    >
                                        <span className="font-semibold text-lg text-slate-800 dark:text-slate-100">{paper.subject} - {paper.exam} {paper.year}</span>
                                        <span className={`transform transition-transform duration-300 ${expandedPaperId === paper.id ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon />
                                        </span>
                                    </button>
                                    {expandedPaperId === paper.id && (
                                        <div className="p-3 bg-white dark:bg-slate-800/50 space-y-4">
                                            {paper.questions.map((q, index) => (
                                                <div key={q.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Question {index + 1}</p>
                                                    <QuestionRenderer
                                                        question={q}
                                                        className="text-slate-800 dark:text-slate-200 mb-2"
                                                        imageClassName="max-w-md"
                                                    />
                                                    <div className="space-y-2">
                                                        {Object.keys(q.options).map(key => {
                                                            const value = q.options[key];
                                                            const isCorrect = key === q.answer;
                                                            return (
                                                                <div key={key} className={`p-3 rounded-md flex items-start gap-3 text-sm ${isCorrect ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200 font-semibold' : 'bg-white dark:bg-slate-600'}`}>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-start gap-2">
                                                                            <span className={`font-bold ${isCorrect ? 'text-green-800 dark:text-green-200' : 'text-slate-800 dark:text-slate-200'}`}>{key}.</span>
                                                                            <div className={isCorrect ? 'text-green-800 dark:text-green-200' : 'text-slate-700 dark:text-slate-300'}><MarkdownRenderer content={value.text} /></div>
                                                                        </div>
                                                                        {value.diagram && (
                                                                            <div className="mt-2 pl-6">
                                                                                <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-[200px] h-auto rounded-md border bg-white" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-slate-500 py-10">No past papers match your criteria.</p>
                    )}
                </div>
            </div>
        </Card>
    );

    const renderSearch = () => (
        <Card>
            <div>
                <form onSubmit={handleSearchFormSubmit} className="flex gap-2">
                    <div className="relative flex-grow">
                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <SearchIcon />
                        </span>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g., photosynthesis, gravity, simile..."
                            className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Search for questions"
                        />
                    </div>
                    <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-accent transition-colors">
                        Search
                    </button>
                </form>

                <div className="mt-6 min-h-[400px]">
                    {isLoading ? (
                        <p className="text-center text-slate-500 py-10">Loading search...</p>
                    ) : !hasSearched ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="bg-primary-light text-primary rounded-full p-4 inline-block mb-6">
                                <BookOpenIcon />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Find Questions Instantly</h2>
                            <p className="text-slate-600 dark:text-slate-300 max-w-md">
                                Enter a topic, keyword, or phrase in the search bar above to find relevant past questions from our database.
                            </p>
                        </div>
                    ) : results.length > 0 ? (
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
                                Found {totalResultsCount} question{totalResultsCount > 1 ? 's' : ''} for "{query}"
                            </h2>
                            <div className="space-y-6">
                                {results.map((q, index) => (
                                    <div key={q.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-700">
                                        <div className="flex justify-between items-start text-sm text-slate-500 dark:text-slate-400 mb-2">
                                            <span>Question {index + 1}</span>
                                            <span className="font-semibold">{q.subject} - {q.exam} {q.year}</span>
                                        </div>
                                        <QuestionRenderer
                                            question={q}
                                            questionContent={highlightQuery(q.question, query)}
                                            className="text-lg text-slate-800 dark:text-slate-200 mb-2"
                                            imageClassName="max-w-md"
                                        />
                                        <div className="space-y-2">
                                            {Object.keys(q.options).map(key => {
                                                const value = q.options[key];
                                                const isCorrect = key === q.answer;
                                                return (
                                                    <div key={key} className={`p-3 rounded-md flex items-start gap-3 text-sm ${isCorrect ? 'bg-green-100 dark:bg-green-500/20 text-green-900 dark:text-green-200 font-semibold' : 'bg-white dark:bg-slate-700'}`}>
                                                         <div className="flex-1">
                                                            <div className="flex items-start gap-2">
                                                                <span className={`font-bold ${isCorrect ? 'text-green-900 dark:text-green-200' : 'text-slate-800 dark:text-slate-200'}`}>{key}.</span>
                                                                <div className={isCorrect ? 'text-green-900 dark:text-green-200' : 'text-slate-700 dark:text-slate-300'}><MarkdownRenderer content={highlightQuery(value.text, query)} /></div>
                                                            </div>
                                                            {value.diagram && (
                                                                <div className="mt-2 pl-6">
                                                                    <img src={value.diagram} alt={`Option ${key} diagram`} className="max-w-[200px] h-auto rounded-md border bg-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {!isAuthenticated && totalResultsCount > results.length && (
                                <div className="text-center mt-8 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border dark:border-slate-700">
                                    <p className="font-semibold text-slate-700 dark:text-slate-200">You're viewing {results.length} of {totalResultsCount} results.</p>
                                    <p className="text-slate-600 dark:text-slate-300 mt-1 mb-4">Create a free account to see all results.</p>
                                    <button onClick={requestLogin} className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-accent transition-colors">
                                        Sign Up to View All
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                             <h2 className="text-2xl font-bold text-slate-700 dark:text-white">No Results Found</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2">We couldn't find any questions matching "{query}". Try a different search term.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <Card>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Past Questions</h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">Browse the library of past papers or search for specific questions by keyword.</p>
                 <div className="mt-6 flex border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 max-w-md">
                    <button
                        onClick={() => setActiveTab('browse')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'browse' ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Browse Library
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeTab === 'search' ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Search by Keyword
                    </button>
                </div>
            </Card>

            {activeTab === 'browse' ? renderBrowser() : renderSearch()}
        </div>
    );
};

export default QuestionSearch;