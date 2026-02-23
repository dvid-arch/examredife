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

    const isAdmin = user?.role === 'admin';
    const allSubjectsFromPapers = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);

    // For non-admins: show only their 4 preferred subjects (if set) + compulsory English
    const subjects = useMemo(() => {
        if (isAdmin || !user?.preferredSubjects?.length) return allSubjectsFromPapers;
        return allSubjectsFromPapers.filter(s =>
            user.preferredSubjects!.includes(s) ||
            ['english', 'english language', 'use of english'].includes(s.toLowerCase())
        );
    }, [allSubjectsFromPapers, isAdmin, user?.preferredSubjects]);

    // Standard Mode: per-subject year and count selection
    type StandardSelection = { year: 'random' | number; count: number };
    const [standardSelections, setStandardSelections] = useState<Record<string, StandardSelection>>({});

    const yearsBySubject = useMemo(() => {
        const map = new Map<string, number[]>();
        subjects.forEach(subject => {
            const years = new Set(allPapers
                .filter(p => p.subject === subject)
                .map(p => p.year)
                .filter(y => typeof y === 'number' && !isNaN(y)));

            const sortedYears = Array.from(years).sort((a, b) => (b as number) - (a as number));
            map.set(subject, sortedYears);
        });
        return map;
    }, [allPapers, subjects]);

    const getYearsForSubject = (subject: string) => {
        return yearsBySubject.get(subject) || [];
    };

    // Auto-initialize standard selections when preferred subjects or papers load
    useEffect(() => {
        if (subjects.length === 0) return;
        setStandardSelections(prev => {
            const next = { ...prev };
            subjects.forEach(subject => {
                if (!next[subject]) {
                    const subjectYears = yearsBySubject.get(subject) || [];
                    next[subject] = {
                        year: subjectYears.length > 0 ? subjectYears[0] : 'random',
                        count: subject === 'English' ? 60 : 40
                    };
                }
            });
            return next;
        });
    }, [subjects, yearsBySubject]);


    // State for Custom Mode
    // Updated structure: Year AND Count per subject
    type CustomSelection = {
        year: 'random' | number;
        count: number;
    };

    const [customSelections, setCustomSelections] = useState<Record<string, CustomSelection>>({});
    // Removed global customQuestionCount


    const handleCustomSubjectChange = (subject: string) => {
        setCustomSelections(prev => {
            const newSelections = { ...prev };
            if (newSelections[subject]) {
                delete newSelections[subject]; // uncheck
            } else {
                // check, default to most recent year and default count
                const subjectYears = yearsBySubject.get(subject) || [];
                const defaultYear = subjectYears.length > 0 ? subjectYears[0] : 'random';
                // Default count: 40, but capped at 50 for non-English (though loop below handles options)
                newSelections[subject] = { year: defaultYear, count: 40 };
            }
            return newSelections;
        });
    };

    const handleCustomYearChange = (subject: string, year: string) => {
        setCustomSelections(prev => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                year: year === 'random' ? 'random' : Number(year)
            },
        }));
    };

    const handleCustomCountChange = (subject: string, count: number) => {
        setCustomSelections(prev => ({
            ...prev,
            [subject]: {
                ...prev[subject],
                count: count
            },
        }));
    };

    const [examMode, setExamMode] = useState<'study' | 'practice' | 'mock'>('practice');

    const handleStartStandardExam = () => {
        const selections = subjects.map(subject => ({
            subject,
            year: standardSelections[subject]?.year ?? 'random',
            count: standardSelections[subject]?.count ?? (subject === 'English' ? 60 : 40),
        }));

        if (selections.length !== 4) {
            alert('You need exactly 4 preferred subjects to start a Standard Exam. Please update your profile.');
            return;
        }

        sessionStorage.removeItem('practiceExited');
        sessionStorage.removeItem('practiceCompleted');
        navigate('/take-examination', {
            state: {
                selections,
                examTitle: `UTME Standard Practice`,
                mode: examMode,
                timestamp: Date.now(),
            },
        });
        sessionStorage.setItem('practiceStarted', 'true');
    };

    const handleStartCustomPractice = (e: React.FormEvent) => {
        e.preventDefault();
        // Updated to pass count as well
        const selectionsArray = Object.entries(customSelections).map(([subject, data]) => ({
            subject,
            year: data.year,
            count: data.count
        }));

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
                // questionsPerSubject removed, using per-subject count
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
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Practice For UTME</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Choose your practice mode. Take a standard exam simulation or create a custom quiz tailored to your needs.</p>
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
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
                                Your 4 UTME subjects are shown below. Each can use a different year — great when not all subjects have the same paper year.
                            </p>

                            {subjects.length < 4 ? (
                                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-orange-700 dark:text-orange-300 text-sm">
                                    ⚠️ You haven't selected 4 preferred subjects yet.{' '}
                                    <a href="/profile" className="font-bold underline">Update your profile</a> to continue.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {subjects.map(subject => {
                                        const subjectYears = getYearsForSubject(subject);
                                        const currentYear = standardSelections[subject]?.year ?? 'random';
                                        const isCompulsory = subject === 'English' || subject === 'English Language';
                                        return (
                                            <div key={subject} className={`flex items-center justify-between gap-4 p-4 rounded-lg border-2 ${isCompulsory
                                                ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    {isCompulsory && (
                                                        <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Compulsory</span>
                                                    )}
                                                    <span className="font-semibold text-slate-800 dark:text-white">{subject}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col">
                                                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1">Year</label>
                                                        <select
                                                            value={String(currentYear)}
                                                            onChange={(e) => setStandardSelections(prev => ({
                                                                ...prev,
                                                                [subject]: { ...prev[subject], year: e.target.value === 'random' ? 'random' : Number(e.target.value) }
                                                            }))}
                                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            {subjectYears.map(year => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                            <option value="random">Random Year</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label className="text-[10px] uppercase text-gray-500 font-bold mb-1">Questions</label>
                                                        <select
                                                            value={standardSelections[subject]?.count ?? (isCompulsory ? 60 : 40)}
                                                            onChange={(e) => setStandardSelections(prev => ({
                                                                ...prev,
                                                                [subject]: { ...prev[subject], count: Number(e.target.value) }
                                                            }))}
                                                            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                                        >
                                                            {(isCompulsory ? [10, 40, 60, 100] : [10, 20, 30, 40, 50]).map(num => (
                                                                <option key={num} value={num}>{num}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <ModeSelector />

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={handleStartStandardExam}
                                    disabled={subjects.length !== 4}
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
                                    <div className="grid grid-rows-4 md:grid-rows-2 grid-flow-col gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                                        {subjects.map(subject => (
                                            <div key={subject} className={`min-w-[240px] p-3 border rounded-lg transition-colors snap-start ${customSelections[subject] ? 'bg-primary-light dark:bg-primary/20 border-primary' : 'bg-white dark:bg-gray-800/50'}`}>
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
                                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                                        {/* Year Selection */}
                                                        <div>
                                                            <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Year</label>
                                                            <select
                                                                value={String(customSelections[subject].year)}
                                                                onChange={(e) => handleCustomYearChange(subject, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-slate-600 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            >
                                                                {getYearsForSubject(subject).map(year => (
                                                                    <option key={year} value={year}>{year}</option>
                                                                ))}
                                                                <option value="random">Random</option>
                                                            </select>
                                                        </div>

                                                        {/* Count Selection */}
                                                        <div>
                                                            <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Questions</label>
                                                            <select
                                                                value={customSelections[subject].count}
                                                                onChange={(e) => handleCustomCountChange(subject, Number(e.target.value))}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-slate-600 border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            >
                                                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
                                                                    .filter(num => subject === 'English' || num <= 50) // English gets up to 100, others capped at 50
                                                                    .map(num => (
                                                                        <option key={num} value={num}>{num}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
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
            )
            }
        </div >
    );
};

export default Quizzes;