import React, { useState, useEffect } from 'react';
import { STANDARD_SUBJECTS } from '../constants/subjects.ts';

interface OnboardingSubjectModalProps {
    isOpen: boolean;
    onSave: (subjects: string[]) => Promise<void>;
}

const OnboardingSubjectModal: React.FC<OnboardingSubjectModalProps> = ({ isOpen, onSave }) => {
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['English']);
    const [isSaving, setIsSaving] = useState(false);

    // Keep English always selected when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedSubjects(['English']);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter out English for the rendered list since it's hardcoded to be selected
    const availableSubjects = [...STANDARD_SUBJECTS].sort();

    const handleToggleSubject = (subject: string) => {
        if (subject === 'English') return; // Cannot toggle English

        setSelectedSubjects(prev => {
            if (prev.includes(subject)) {
                return prev.filter(s => s !== subject);
            }
            if (prev.length < 4) {
                return [...prev, subject];
            }
            return prev;
        });
    };

    const handleConfirm = async () => {
        if (selectedSubjects.length !== 4) return;
        setIsSaving(true);
        try {
            await onSave(selectedSubjects);
        } finally {
            setIsSaving(false);
        }
    };

    const isComplete = selectedSubjects.length === 4;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl relative z-10 shadow-2xl flex flex-col md:max-h-[85vh] max-h-[90vh] overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in-up">

                {/* Header */}
                <div className="p-6 md:p-8 text-center border-b border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/80">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                        Choose Your UTME Subjects
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Let's personalize your dashboard and estimated score. Please select exactly 4 target subjects.
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="mb-6 flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider block mb-1">Selections</span>
                            <span className="text-xs text-slate-500">English is compulsory for UTME.</span>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-bold text-sm transition-colors ${isComplete ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {selectedSubjects.length} / 4 Selected
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {availableSubjects.map(subject => {
                            const isSelected = selectedSubjects.includes(subject);
                            const isEnglish = subject === 'English';

                            return (
                                <button
                                    key={subject}
                                    onClick={() => handleToggleSubject(subject)}
                                    className={`relative px-4 py-4 rounded-xl text-sm font-bold transition-all border-2 text-left flex items-start gap-3
                                        ${isSelected
                                            ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        } 
                                        ${isEnglish ? 'opacity-70 cursor-not-allowed !border-blue-500 !bg-blue-50/50' : ''}
                                        ${!isSelected && selectedSubjects.length >= 4 ? 'opacity-50 cursor-not-allowed hover:border-gray-200' : ''}
                                    `}
                                >
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                                        ${isSelected ? 'bg-blue-500 text-white' : 'border-2 border-gray-300 dark:border-gray-600'}
                                    `}>
                                        {isSelected && (
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="leading-tight">{subject}</span>
                                    {isEnglish && (
                                        <span className="absolute top-2 right-2 text-[9px] uppercase font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">Compulsory</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t border-gray-100 dark:border-gray-700 bg-slate-50 dark:bg-slate-800/80">
                    <button
                        onClick={handleConfirm}
                        disabled={!isComplete || isSaving}
                        className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-300 flex items-center justify-center gap-2
                            ${isComplete && !isSaving
                                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 hover:-translate-y-0.5 cursor-pointer'
                                : 'bg-slate-300 dark:bg-slate-700 shadow-transparent cursor-not-allowed text-slate-500 dark:text-slate-400'
                            }
                        `}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving Profile...
                            </>
                        ) : isComplete ? (
                            'Continue to Dashboard'
                        ) : (
                            `Select ${4 - selectedSubjects.length} more subject${4 - selectedSubjects.length === 1 ? '' : 's'} to continue`
                        )}
                    </button>
                    {!isComplete && (
                        <p className="text-center text-xs font-semibold text-slate-500 mt-3 animate-pulse">
                            You must complete this step to calculate your Estimated Score.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingSubjectModal;
