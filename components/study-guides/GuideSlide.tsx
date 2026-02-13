import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from '../MarkdownRenderer.tsx';
import { GuideSlide as SlideType } from '../../types.ts';

interface GuideSlideProps {
    slide: SlideType;
    onComplete?: (isCorrect: boolean) => void;
    isCompleted?: boolean;
}

const GuideSlide: React.FC<GuideSlideProps> = ({ slide, onComplete, isCompleted }) => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleOptionSelect = (option: string) => {
        if (isCompleted || showExplanation) return;
        setSelectedOption(option);
        const isCorrect = option === slide.answer;
        setShowExplanation(true);
        if (onComplete) onComplete(isCorrect);
    };

    const renderContent = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="prose prose-slate dark:prose-invert max-w-none"
        >
            {slide.title && <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">{slide.title}</h2>}
            {slide.content && <MarkdownRenderer content={slide.content} />}
        </motion.div>
    );

    const renderQuestion = () => (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border-2 border-slate-100 dark:border-slate-700/50 shadow-sm"
            >
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-4 leading-tight">
                    {slide.question}
                </h3>
            </motion.div>

            <div className="grid gap-4">
                {slide.options?.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === slide.answer;
                    const showFeedback = showExplanation || isCompleted;

                    let bgClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5";
                    if (showFeedback) {
                        if (isCorrect) bgClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-emerald-100 dark:shadow-none";
                        else if (isSelected) bgClass = "bg-red-50 dark:bg-red-900/20 border-red-500 shadow-red-100 dark:shadow-none";
                        else bgClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60";
                    } else if (isSelected) {
                        bgClass = "border-primary bg-primary/5 ring-2 ring-primary/20";
                    }

                    return (
                        <motion.button
                            key={index}
                            whileHover={!showFeedback ? { x: 4 } : {}}
                            whileTap={!showFeedback ? { scale: 0.98 } : {}}
                            onClick={() => handleOptionSelect(option)}
                            disabled={showFeedback}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 text-left font-bold text-base sm:text-lg shadow-sm ${bgClass}`}
                        >
                            <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm border-2 ${isSelected ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                }`}>
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className={isCorrect && showFeedback ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}>
                                {option}
                            </span>
                            {showFeedback && isCorrect && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-auto text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            <AnimatePresence>
                {(showExplanation || isCompleted) && slide.explanation && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 sm:p-6 border-l-4 border-primary"
                    >
                        <h4 className="text-primary font-black uppercase tracking-widest text-xs mb-2">Explanation</h4>
                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                            {slide.explanation}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderSummary = () => (
        <div className="text-center space-y-6 sm:space-y-8 py-6 sm:py-12">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-yellow-500/30"
            >
                <span className="text-5xl">🏆</span>
            </motion.div>
            <div className="space-y-4">
                <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{slide.title || "Lesson Complete!"}</h2>
                <div className="max-w-md mx-auto">
                    <MarkdownRenderer content={slide.content || "Great job! You've mastered this topic."} />
                </div>
            </div>
        </div>
    );

    switch (slide.type) {
        case 'question': return renderQuestion();
        case 'summary': return renderSummary();
        default: return renderContent();
    }
};

export default GuideSlide;
