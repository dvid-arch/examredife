import React, { useState } from 'react';
import { InlineQuestion } from '../types.ts';

interface CheckpointCardProps {
    question: InlineQuestion;
    onResult?: (isCorrect: boolean) => void;
}

const CheckpointCard: React.FC<CheckpointCardProps> = ({ question, onResult }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const optionLabels = ['A', 'B', 'C', 'D'];
    const isCorrect = selectedOption === question.answer;

    const handleOptionSelect = (label: string) => {
        if (!isSubmitted) {
            setSelectedOption(label);
        }
    };

    const handleSubmit = () => {
        if (selectedOption) {
            setIsSubmitted(true);
            if (onResult) {
                onResult(selectedOption === question.answer);
            }
        }
    };

    return (
        <div className="my-10 bg-white dark:bg-slate-900 rounded-[32px] border-2 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-primary/5 p-4 sm:px-8 flex items-center gap-3 border-b border-primary/10">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                </div>
                <h4 className="font-black text-primary uppercase tracking-widest text-xs">Knowledge Checkpoint</h4>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
                <p className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white leading-relaxed">
                    {question.question}
                </p>

                <div className="grid grid-cols-1 gap-3">
                    {question.options.map((option, index) => {
                        const label = optionLabels[index];
                        const isSelected = selectedOption === label;
                        const showResult = isSubmitted;
                        const isThisCorrect = label === question.answer;

                        let buttonClass = "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group ";
                        if (!showResult) {
                            buttonClass += isSelected
                                ? "border-primary bg-primary/5 text-primary shadow-sm"
                                : "border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800/50";
                        } else {
                            if (isThisCorrect) {
                                buttonClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400";
                            } else if (isSelected && !isCorrect) {
                                buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                            } else {
                                buttonClass += "border-slate-100 dark:border-slate-800 opacity-50";
                            }
                        }

                        return (
                            <button
                                key={index}
                                onClick={() => handleOptionSelect(label)}
                                disabled={isSubmitted}
                                className={buttonClass}
                            >
                                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-sm transition-all ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                    }`}>
                                    {label}
                                </div>
                                <span className="font-bold">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedOption}
                        className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg ${selectedOption
                            ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Submit Answer
                    </button>
                ) : (
                    <div className={`p-6 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-500 ${isCorrect ? 'bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{isCorrect ? '🎉' : '💡'}</span>
                            <span className="font-black uppercase tracking-widest text-xs">
                                {isCorrect ? 'Excellent! Correct' : 'Not quite right'}
                            </span>
                        </div>
                        <p className="text-sm font-bold leading-relaxed opacity-90">
                            {question.explanation}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckpointCard;
