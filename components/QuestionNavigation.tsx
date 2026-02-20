
import React, { useState } from 'react';
import { ChallengeQuestion } from '../types.ts';

interface QuestionNavigationProps {
    questions: ChallengeQuestion[];
    currentQuestionIndex: number;
    userAnswers: { [key: string]: string };
    onJumpToQuestion: (index: number) => void;
    activeSubject: string;
    onSubjectChange: (subject: string) => void;
    subjects: string[];
    isFinished: boolean;
    guestAnswerLimitReached: boolean;
    isAuthenticated: boolean;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
    questions,
    currentQuestionIndex,
    userAnswers,
    onJumpToQuestion,
    activeSubject,
    onSubjectChange,
    subjects,
    isFinished,
    guestAnswerLimitReached,
    isAuthenticated
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Group questions by subject
    const questionsBySubject = questions.reduce((acc, q, index) => {
        if (!acc[q.subject]) acc[q.subject] = [];
        acc[q.subject].push({ ...q, globalIndex: index });
        return acc;
    }, {} as Record<string, (ChallengeQuestion & { globalIndex: number })[]>);

    return (
        <>
            {/* Mobile/Tablet Toggle Button (Floating) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-4 right-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all"
                aria-label="Toggle Question Grid"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar / Drawer */}
            <div className={`
                fixed top-0 right-0 h-full bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out w-80 flex flex-col
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:relative lg:translate-x-0 lg:w-72 lg:shadow-none lg:border-l lg:border-gray-200 lg:bg-gray-50
            `}>
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white lg:bg-transparent">
                    <h3 className="font-bold text-lg text-slate-800">Question Palette</h3>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {subjects.map(subject => (
                        <div key={subject} className="mb-6">
                            <button
                                onClick={() => onSubjectChange(subject)}
                                className={`w-full text-left font-bold text-sm mb-3 px-2 py-1 rounded-md transition-colors ${activeSubject === subject ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-gray-100'
                                    }`}
                            >
                                {subject}
                            </button>

                            <div className="grid grid-cols-5 gap-2">
                                {questionsBySubject[subject].map((q, localIndex) => {
                                    const globalIndex = q.globalIndex;
                                    const isCurrent = globalIndex === currentQuestionIndex;
                                    const isAnswered = userAnswers[q.id] !== undefined;

                                    let isLocked = false;
                                    if (!isAuthenticated && guestAnswerLimitReached && !isAnswered) {
                                        isLocked = true;
                                    }

                                    let buttonClass = 'bg-white border text-slate-600 hover:border-primary/50';

                                    if (isLocked) {
                                        buttonClass = 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed';
                                    } else if (isAnswered) {
                                        buttonClass = 'bg-green-100 border-green-300 text-green-700';
                                    } else if (isCurrent) {
                                        // Handled below for priority
                                    }

                                    // Priority styles
                                    if (isCurrent) {
                                        buttonClass = 'bg-primary text-white border-primary shadow-md ring-2 ring-primary ring-offset-1';
                                    }

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => {
                                                if (!isLocked) {
                                                    onJumpToQuestion(globalIndex);
                                                    if (window.innerWidth < 1024) setIsOpen(false); // Close on mobile selection
                                                }
                                            }}
                                            className={`
                                                h-10 w-full rounded-lg text-xs font-bold flex items-center justify-center transition-all duration-200
                                                ${buttonClass}
                                            `}
                                            disabled={isLocked}
                                        >
                                            {isLocked ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                localIndex + 1
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white lg:bg-transparent text-xs text-slate-500">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div>
                        <span>Answered</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-primary border border-primary"></div>
                        <span>Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-white border border-gray-200"></div>
                        <span>Unanswered</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuestionNavigation;
