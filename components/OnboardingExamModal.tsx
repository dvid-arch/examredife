import React, { useState } from 'react';

interface OnboardingExamModalProps {
    isOpen: boolean;
    onSave: (examType: 'JAMB' | 'WAEC' | 'University') => Promise<void>;
}

const exams = [
    {
        id: 'JAMB',
        name: 'JAMB / UTME',
        description: 'Joint Admissions and Matriculation Board entrance exam for Nigerian Universities.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
        color: 'from-blue-600 to-indigo-700',
        lightBg: 'bg-blue-50 dark:bg-blue-900/10',
        borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
        id: 'WAEC',
        name: 'WAEC / WASSCE',
        description: 'West African Senior School Certificate Examination for secondary school completion.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        color: 'from-red-700 to-red-900',
        lightBg: 'bg-red-50 dark:bg-red-950/20',
        borderColor: 'border-red-200 dark:border-red-900/30'
    },
    {
        id: 'University',
        name: 'University Exams',
        description: 'Prepare for 100 & 200 Level CBT exams and semester-based assessments.',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        color: 'from-teal-600 to-teal-800',
        lightBg: 'bg-teal-50 dark:bg-teal-900/10',
        borderColor: 'border-teal-200 dark:border-teal-800'
    }
];

const OnboardingExamModal: React.FC<OnboardingExamModalProps> = ({ isOpen, onSave }) => {
    const [selectedExam, setSelectedExam] = useState<'JAMB' | 'WAEC' | 'University' | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedExam) return;
        setIsSaving(true);
        try {
            await onSave(selectedExam);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md" />

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10 animate-fade-in-up">

                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-orange-500" />

                {/* Content */}
                <div className="p-8 sm:p-12 overflow-y-auto custom-scrollbar flex-1 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 rotate-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.674a1 1 0 00.951-.69l1.519-4.674a1 1 0 00-.951-1.31H12.72l.799-3h-4.674a1 1 0 00-.951.69l-1.519 4.674a1 1 0 00.951 1.31H11.28l-.799 3z" />
                        </svg>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mb-4 tracking-tight">
                        What are you <span className="text-primary italic">preparing</span> for?
                    </h2>

                    <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 max-w-md">
                        Select your target examination to personalize your study guides, practice tests, and performance tracking.
                    </p>

                    <div className="grid grid-cols-1 gap-4 w-full">
                        {exams.map((exam) => (
                            <button
                                key={exam.id}
                                onClick={() => setSelectedExam(exam.id as any)}
                                className={`relative group p-6 rounded-3xl border-2 transition-all duration-300 text-left flex items-center gap-6
                                    ${selectedExam === exam.id
                                        ? `border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]`
                                        : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                                    }
                                `}
                            >
                                <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all bg-gradient-to-br ${exam.color} text-white shadow-lg group-hover:scale-110`}>
                                    {exam.icon}
                                </div>

                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{exam.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-snug">{exam.description}</p>
                                </div>

                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                                    ${selectedExam === exam.id ? 'border-primary bg-primary' : 'border-slate-200 dark:border-slate-600'}
                                `}>
                                    {selectedExam === exam.id && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedExam || isSaving}
                        className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-3
                            ${selectedExam && !isSaving
                                ? 'bg-primary hover:bg-primary-dark text-white hover:-translate-y-1 cursor-pointer'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
                            }
                        `}
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Personalizing...
                            </>
                        ) : (
                            <>
                                Continue
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingExamModal;
