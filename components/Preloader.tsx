import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreload } from '../contexts/PreloadContext.tsx';

const PRELOAD_MESSAGES = [
    "Preparing your personalized study plan...",
    "Gathering the latest past questions...",
    "Syncing your progress...",
    "Optimizing your learning experience...",
    "Almost there, stay focused!",
    "Ready to crush your exams!"
];

const Preloader: React.FC = () => {
    const { progress, isComplete, error, retry } = usePreload();

    // Select message based on progress
    const messageIndex = Math.min(
        Math.floor((progress / 100) * PRELOAD_MESSAGES.length),
        PRELOAD_MESSAGES.length - 1
    );

    return (
        <AnimatePresence>
            {!isComplete && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-950 overflow-hidden"
                >
                    {/* Background Decorative Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 90, 0],
                                opacity: [0.1, 0.2, 0.1]
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                rotate: [0, -90, 0],
                                opacity: [0.1, 0.15, 0.1]
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full"
                        />
                    </div>

                    <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
                        {/* Logo placeholder - replace with actual logo if available */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="mb-12 text-center"
                        >
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-tr from-primary to-blue-600 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center">
                                <span className="text-4xl font-black text-white italic">ER</span>
                            </div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
                                ExamRedi
                            </h1>
                        </motion.div>

                        {error ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center"
                            >
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl mb-6 text-sm border border-red-100 dark:border-red-900/30">
                                    {error}
                                </div>
                                <button
                                    onClick={retry}
                                    className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                >
                                    Try Again
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Progress Bar Container */}
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                        className="h-full bg-gradient-to-r from-primary to-blue-500 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                                    />
                                </div>

                                {/* Progress Text */}
                                <div className="flex justify-between w-full mb-8 text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                                    <span>Loading Data</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>

                                {/* Message Carousel */}
                                <div className="h-8 flex items-center justify-center overflow-hidden w-full">
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={messageIndex}
                                            initial={{ y: 20, opacity: 0 }}
                                            animate={{ y: 0, opacity: 1 }}
                                            exit={{ y: -20, opacity: 0 }}
                                            className="text-sm font-medium text-slate-600 dark:text-gray-300 text-center italic"
                                        >
                                            {PRELOAD_MESSAGES[messageIndex]}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-10 text-xs text-slate-400 dark:text-gray-600 font-medium"
                    >
                        Powered by ExamRedi AI
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Preloader;
