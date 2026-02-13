import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PastPaper } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePastQuestions } from '../contexts/PastQuestionsContext.tsx';


const Quizzes: React.FC = () => {
    const navigate = useNavigate();
    const { tab } = useParams<{ tab: string }>();
    const { user } = useAuth();
    const { papers: allPapers, isLoading, fetchPapers } = usePastQuestions();
    const [practiceMode, setPracticeMode] = useState<'standard' | 'custom'>((tab === 'custom') ? 'custom' : 'standard');

    useEffect(() => {
        if (tab === 'custom' || tab === 'standard') {
            setPracticeMode(tab);
        }
    }, [tab]);

    useEffect(() => {
        fetchPapers();
    }, [fetchPapers]);

    const subjects = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);

    const availableYears = useMemo(() => {
        const years = new Set(allPapers.map(p => p.year));
        // FIX: Explicitly cast years to numbers for sorting to resolve arithmetic operation type error.
        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [allPapers]);

    // State for Standard Mode
    // 1. First select the year
    const [standardSelectedYear, setStandardSelectedYear] = useState<number>(0);

    // 2. Filter subjects available for that year
    const displayedSubjects = useMemo(() => {
        if (!standardSelectedYear) return subjects;

        return subjects.filter(subject => {
            const hasPaperForYear = allPapers.some(p => p.subject === subject && p.year === standardSelectedYear);
            return hasPaperForYear;
        });
    }, [subjects, allPapers, standardSelectedYear]);

    // 3. Selection state (reset if subject disappears?)
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['English']);

    useEffect(() => {
        if (availableYears.length > 0) {
            setStandardSelectedYear(availableYears[0]);

            // Apply preferred subjects if they exist and only default (English) is selected
            if (user?.preferredSubjects && user.preferredSubjects.length > 0 && selectedSubjects.length === 1 && selectedSubjects[0] === 'English') {
                setSelectedSubjects(user.preferredSubjects);
            }
        }
    }, [availableYears, user?.preferredSubjects]);

    // Reset selection if a selected subject is no longer available in the new year
    useEffect(() => {
        setSelectedSubjects(prev => prev.filter(s => displayedSubjects.includes(s)));
    }, [standardSelectedYear, displayedSubjects]);


    // State for Custom Mode
    const [customSelections, setCustomSelections] = useState<Record<string, 'random' | number>>({});
    const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);

    const yearsBySubject = useMemo(() => {
        const map = new Map<string, number[]>();
        subjects.forEach(subject => {
            const years = new Set(allPapers
                .filter(p => p.subject === subject)
                .map(p => p.year)
                .filter(y => typeof y === 'number' && !isNaN(y)));

            const sortedYears = Array.from(years).sort((a, b) => b - a);
            map.set(subject, sortedYears);
        });
        return map;
    }, [allPapers, subjects]);

    const getYearsForSubject = (subject: string) => {
        return yearsBySubject.get(subject) || [];
    };

    const handleStandardSubjectChange = (subject: string) => {
        if (subject === 'English') return;
        setSelectedSubjects(prev => {
            if (prev.includes(subject)) {
                return prev.filter(s => s !== subject);
            } else if (prev.length < 4) {
                return [...prev, subject];
            }
            return prev;
        });
    };

    const handleCustomSubjectChange = (subject: string) => {
        setCustomSelections(prev => {
            const newSelections = { ...prev };
            if (newSelections[subject]) {
                delete newSelections[subject]; // uncheck
            } else {
                // check, default to most recent year for that specific subject
                const subjectYears = yearsBySubject.get(subject) || [];
                const defaultYear = subjectYears.length > 0 ? subjectYears[0] : 'random';
                newSelections[subject] = defaultYear;
            }
            return newSelections;
        });
    };

    const handleCustomYearChange = (subject: string, year: string) => {
        setCustomSelections(prev => ({
            ...prev,
            [subject]: year === 'random' ? 'random' : Number(year),
        }));
    };

    const [examMode, setExamMode] = useState<'study' | 'practice' | 'mock'>('practice');

    const handleStartStandardExam = () => {
        if (selectedSubjects.length !== 4) {
            alert('Please select exactly 4 subjects (including the compulsory English subject).');
            return;
        }
        // Clear any previous session flags before starting new practice
        sessionStorage.removeItem('practiceExited');
        sessionStorage.removeItem('practiceCompleted');
        navigate('/take-examination', {
            state: {
                subjects: selectedSubjects,
                year: standardSelectedYear,
                examTitle: `UTME Practice(${standardSelectedYear})`,
                mode: examMode,
                timestamp: Date.now(),
            },
        });
        // Mark that practice was properly started
        sessionStorage.setItem('practiceStarted', 'true');
    };

    const handleStartCustomPractice = (e: React.FormEvent) => {
        e.preventDefault();
        const selectionsArray = Object.entries(customSelections).map(([subject, year]) => ({ subject, year }));

        if (selectionsArray.length === 0) {
            alert('Please select at least one subject for your custom practice.');
            return;
        }

        // Clear any previous session flags before starting new practice
        sessionStorage.removeItem('practiceExited');
        sessionStorage.removeItem('practiceCompleted');
        navigate('/take-examination', {
            state: {
                selections: selectionsArray,
                questionsPerSubject: customQuestionCount, // FIX: Added missing param
                examTitle: `Custom Practice`,
                mode: examMode,
                timestamp: Date.now(),
            },
        });
        // Mark that practice was properly started
        sessionStorage.setItem('practiceStarted', 'true');
    };

    const modes = [
        {
            id: 'study',
            name: 'Study',
            icon: '📖',
            description: 'No timing, reveal answers.'
        },
        {
            id: 'practice',
            name: 'Practice',
            icon: '🎯',
            description: 'Timed, with results.'
        },
        {
            id: 'mock',
            name: 'Mock',
            icon: '⌛',
            description: 'Timed, no corrections.'
        }
    ] as const;

    const ModeSelector = () => (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Choose Your Mode</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setExamMode(m.id)}
                        className={`flex flex-col p-3 rounded-xl border-2 transition-all text-left ${examMode === m.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/10'
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xl">{m.icon}</span>
                            {examMode === m.id && (
                                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{m.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                            {m.description}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );


    return (
        <div className="space-y-6">
            <Card>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white">Practice For UTME</h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2">Choose your practice mode. Take a standard exam simulation or create a custom quiz tailored to your needs.</p>
                <div className="mt-4 flex border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 max-w-sm">
                    <button
                        onClick={() => navigate('/practice/standard')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${practiceMode === 'standard' ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Standard UTME Exam
                    </button>
                    <button
                        onClick={() => navigate('/practice/custom')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${practiceMode === 'custom' ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Custom Practice
                    </button>
                </div>
            </Card>

            {isLoading ? (
                <Card className="text-center p-8">Loading practice options...</Card>
            ) : (
                <>
                    {practiceMode === 'standard' && (
                        <Card>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Configuration</h2>
                            <div className="mt-4 mb-6">
                                <label htmlFor="year-select" className="block text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Select Year</label>
                                <select
                                    id="year-select"
                                    value={String(standardSelectedYear)}
                                    onChange={(e) => setStandardSelectedYear(Number(e.target.value))}
                                    className="w-full md:w-1/3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Choose Your Subjects ({selectedSubjects.length}/4)</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-4">English is compulsory. Please select 3 other subjects available for {standardSelectedYear}.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                                {displayedSubjects.map(subject => (
                                    <label
                                        key={subject}
                                        className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg transition-colors 
                                            ${subject === 'English' ? 'cursor-not-allowed bg-primary-light dark:bg-primary/20 border-primary' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 has-[:checked]:bg-primary-light has-[:checked]:border-primary dark:has-[:checked]:bg-primary/20'}
                                            ${selectedSubjects.length === 4 && !selectedSubjects.includes(subject) ? 'opacity-50 cursor-not-allowed' : ''}
`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSubjects.includes(subject)}
                                            disabled={subject === 'English'}
                                            onChange={() => handleStandardSubjectChange(subject)}
                                            className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-primary focus:ring-primary"
                                        />
                                        <span className="font-medium text-slate-700 dark:text-slate-200">{subject}</span>
                                    </label>
                                ))}
                            </div>

                            <ModeSelector />

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleStartStandardExam}
                                    disabled={selectedSubjects.length !== 4}
                                    className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Get Started
                                </button>
                            </div>
                        </Card>
                    )}

                    {practiceMode === 'custom' && (
                        <Card>
                            <form onSubmit={handleStartCustomPractice} className="space-y-6">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Create a Custom Practice Session</h2>

                                <div>
                                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">1. Select Subjects & Years</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {subjects.map(subject => (
                                            <div key={subject} className={`p-3 border rounded-lg transition-colors ${customSelections[subject] ? 'bg-primary-light dark:bg-primary/20 border-primary' : 'bg-white dark:bg-gray-800/50'}`}>
                                                <label className="flex items-center space-x-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!customSelections[subject]}
                                                        onChange={() => handleCustomSubjectChange(subject)}
                                                        className="h-5 w-5 rounded border-gray-300 dark:border-slate-600 text-primary focus:ring-primary"
                                                    />
                                                    <span className="font-medium text-slate-700 dark:text-slate-200">{subject}</span>
                                                </label>
                                                {customSelections[subject] && (
                                                    <div className="mt-2">
                                                        <select
                                                            value={String(customSelections[subject])}
                                                            onChange={(e) => handleCustomYearChange(subject, e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-slate-600 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                        >
                                                            {getYearsForSubject(subject).map(year => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                            <option value="random">Random Year</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">2. Questions Per Subject</h3>
                                    <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                                        <input
                                            type="range"
                                            min="1"
                                            max="50"
                                            value={customQuestionCount}
                                            onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="font-bold text-primary min-w-[3rem] text-center">{customQuestionCount}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 italic">Note: Pro users can take up to 50 questions per subject.</p>
                                </div>

                                <ModeSelector />

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={Object.keys(customSelections).length === 0}
                                        className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[180px]"
                                    >
                                        Start Custom Practice
                                    </button>
                                </div>
                            </form>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default Quizzes;