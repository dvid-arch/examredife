import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { PastPaper } from '../types.ts';
import apiService from '../services/apiService.ts';


const Quizzes: React.FC = () => {
    const navigate = useNavigate();
    const [practiceMode, setPracticeMode] = useState<'standard' | 'custom'>('standard');
    const [allPapers, setAllPapers] = useState<PastPaper[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const data: PastPaper[] = await apiService('/data/papers');
                setAllPapers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const subjects = useMemo(() => [...new Set(allPapers.map(p => p.subject))].sort(), [allPapers]);
    
    const availableYears = useMemo(() => {
        const years = new Set(allPapers.map(p => p.year));
        // FIX: Explicitly cast years to numbers for sorting to resolve arithmetic operation type error.
        return Array.from(years).sort((a, b) => Number(b) - Number(a));
    }, [allPapers]);

    // State for Standard Mode
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['English']);
    const [standardSelectedYear, setStandardSelectedYear] = useState<'random' | number>('random');
     useEffect(() => {
        if (availableYears.length > 0) {
            setStandardSelectedYear(availableYears[0]);
        }
    }, [availableYears]);


    // State for Custom Mode
    const [customSelections, setCustomSelections] = useState<Record<string, 'random' | number>>({});
    const [customQuestionCount, setCustomQuestionCount] = useState<number>(10);
    
    const mostRecentYearBySubject = useMemo(() => {
        const yearMap = new Map<string, number>();
        subjects.forEach(subject => {
            const yearsForSubject = allPapers
                .filter(p => p.subject === subject)
                .map(p => p.year)
                .filter(y => typeof y === 'number' && !isNaN(y));
            if (yearsForSubject.length > 0) {
                const maxYear = Math.max(...yearsForSubject);
                yearMap.set(subject, maxYear);
            }
        });
        return yearMap;
    }, [allPapers, subjects]);


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
                // check, default to most recent year for that subject
                const defaultYear = mostRecentYearBySubject.get(subject) ?? 'random';
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

    const handleStartStandardExam = () => {
        if (selectedSubjects.length !== 4) {
            alert('Please select exactly 4 subjects (including the compulsory English subject).');
            return;
        }
        navigate('/take-examination', {
            state: {
                subjects: selectedSubjects,
                year: standardSelectedYear,
                examTitle: `UTME Practice (${standardSelectedYear})`,
            },
        });
    };

    const handleStartCustomPractice = (e: React.FormEvent) => {
        e.preventDefault();
        const selectionsArray = Object.entries(customSelections).map(([subject, year]) => ({ subject, year }));

        if (selectionsArray.length === 0) {
            alert('Please select at least one subject for your custom practice.');
            return;
        }
        
        navigate('/take-examination', {
            state: {
                selections: selectionsArray,
                questionsPerSubject: customQuestionCount,
                examTitle: `Custom Practice`,
            },
        });
    };


    return (
        <div className="space-y-6">
            <Card>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Practice For UTME</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Choose your practice mode. Take a standard exam simulation or create a custom quiz tailored to your needs.</p>
                <div className="mt-4 flex border border-gray-200 dark:border-slate-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800 max-w-sm">
                    <button
                        onClick={() => setPracticeMode('standard')}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${practiceMode === 'standard' ? 'bg-primary text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
                    >
                        Standard UTME Exam
                    </button>
                    <button
                        onClick={() => setPracticeMode('custom')}
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
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Choose Your Subjects ({selectedSubjects.length}/4)</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">English is compulsory. Please select 3 other subjects.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {subjects.map(subject => (
                                    <label 
                                        key={subject} 
                                        className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors 
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
                            <div className="mt-6">
                                <label htmlFor="year-select" className="block text-xl font-bold text-slate-800 dark:text-slate-50 mb-2">Select Year</label>
                                <select
                                    id="year-select"
                                    value={String(standardSelectedYear)}
                                    onChange={(e) => setStandardSelectedYear(e.target.value === 'random' ? 'random' : Number(e.target.value))}
                                    className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                    <option value="random">Random (All Years)</option>
                                </select>
                            </div>
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
                                                            {availableYears.map(year => (
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
                                    <label htmlFor="custom-count" className="block text-md font-semibold text-slate-700 dark:text-slate-300 mb-1">2. Number of Questions per Subject ({customQuestionCount})</label>
                                    <input
                                        id="custom-count"
                                        type="range"
                                        min="5"
                                        max="20"
                                        value={customQuestionCount}
                                        onChange={(e) => setCustomQuestionCount(Number(e.target.value))}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                                
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