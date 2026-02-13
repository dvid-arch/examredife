import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '../../services/apiService.ts';
import { StudyGuide } from '../../types.ts';
import { useUserProgress } from '../../contexts/UserProgressContext.tsx';
import GuideSlide from '../../components/study-guides/GuideSlide.tsx';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';

const GuideReader: React.FC = () => {
    const { category, slug } = useParams<{ category: string, slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addActivity } = useUserProgress();
    const [guide, setGuide] = useState<StudyGuide | null>(location.state?.guide || null);
    const [isLoading, setIsLoading] = useState(!guide);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [completedSlides, setCompletedSlides] = useState<number[]>([]);

    useEffect(() => {
        if (!guide) {
            const fetchGuide = async () => {
                try {
                    const data: StudyGuide[] = await apiService('/data/guides');
                    const match = data.find(g =>
                        g.subject.toLowerCase().replace(/\s+/g, '-') === category &&
                        g.title.toLowerCase().replace(/\s+/g, '-') === slug
                    );
                    if (match) {
                        setGuide(match);
                    }
                } catch (error) {
                    console.error("Failed to fetch guide", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchGuide();
        }
    }, [category, slug, guide]);

    // Track activity & progress
    const updateProgress = useCallback((index: number, isFinal: boolean = false) => {
        if (!guide) return;

        const totalSlides = guide.slides?.length || 1;
        const progressPercent = Math.round(((index + 1) / totalSlides) * 100);

        addActivity({
            id: guide.id,
            title: guide.title,
            subtitle: `${guide.subject} • ${isFinal ? 'Completed' : `Slide ${index + 1}/${totalSlides}`}`,
            path: `/study-guides/${category}/${slug}`,
            type: 'guide',
            state: { currentSlide: index, completedSlides },
            progress: progressPercent
        });
    }, [guide, category, slug, addActivity, completedSlides]);

    useEffect(() => {
        if (guide) {
            updateProgress(currentSlideIndex);
        }
    }, [currentSlideIndex, guide, updateProgress]);

    const handleSlideComplete = (isCorrect: boolean) => {
        if (!completedSlides.includes(currentSlideIndex)) {
            setCompletedSlides(prev => [...prev, currentSlideIndex]);
        }
    };

    const nextSlide = () => {
        if (guide?.slides && currentSlideIndex < guide.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-bold animate-pulse">Loading interactive lesson...</div>;
    if (!guide) return <div className="p-12 text-center text-red-500 font-bold">Guide not found.</div>;

    const hasSlides = guide.slides && guide.slides.length > 0;
    const currentSlide = hasSlides ? guide.slides![currentSlideIndex] : null;
    const isLastSlide = hasSlides && currentSlideIndex === guide.slides!.length - 1;
    const canGoNext = !hasSlides || currentSlide?.type === 'content' || currentSlide?.type === 'summary' || completedSlides.includes(currentSlideIndex);

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate(`/study-guides/${category}`)}
                    className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors font-bold"
                >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                    </div>
                </button>

                {hasSlides && (
                    <div className="flex-1 max-w-xs mx-8">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            <span>Step {currentSlideIndex + 1} of {guide.slides!.length}</span>
                            <span>{Math.round(((currentSlideIndex + 1) / guide.slides!.length) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentSlideIndex + 1) / guide.slides!.length) * 100}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                            />
                        </div>
                    </div>
                )}

                <div className="shrink-0">
                    <span className="text-xs font-black uppercase tracking-tighter text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                        {guide.subject}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative min-h-[60vh] flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlideIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1"
                    >
                        {hasSlides ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 sm:p-12 mb-24">
                                <GuideSlide
                                    slide={currentSlide!}
                                    onComplete={handleSlideComplete}
                                    isCompleted={completedSlides.includes(currentSlideIndex)}
                                />
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12">
                                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tighter">{guide.title}</h1>
                                <MarkdownRenderer content={guide.content} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Fixed Bottom Navigation */}
                {hasSlides && (
                    <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 z-50">
                        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                            <button
                                onClick={prevSlide}
                                disabled={currentSlideIndex === 0}
                                className="flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            <div className="flex-1 flex justify-center">
                                {isLastSlide ? (
                                    <Link
                                        to={`/practice/topic/${guide.subject.toLowerCase()}/${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                                        className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl text-lg hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-105 active:scale-95"
                                    >
                                        <span className="text-2xl">⚡</span>
                                        Start Topic Test
                                    </Link>
                                ) : (
                                    <motion.button
                                        whileHover={canGoNext ? { scale: 1.02 } : {}}
                                        whileTap={canGoNext ? { scale: 0.98 } : {}}
                                        onClick={nextSlide}
                                        disabled={!canGoNext}
                                        className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 font-black py-4 px-12 rounded-2xl text-lg shadow-xl transition-all ${canGoNext
                                            ? 'bg-primary text-white shadow-primary/30 hover:bg-accent'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-70'
                                            }`}
                                    >
                                        {currentSlide?.type === 'question' ? 'Continue' : 'Next Step'}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </motion.button>
                                )}
                            </div>

                            <div className="hidden sm:block w-14" /> {/* Spacer for balance */}
                        </div>
                    </div>
                )}
            </div>

            {/* Non-sliding Fallback / Legacy Content */}
            {!hasSlides && (
                <div className="mt-8 p-10 border-t-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-3xl text-center">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3">Ready to master this?</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 font-bold text-lg">Test your knowledge with official past questions.</p>
                    <Link
                        to={`/practice/topic/${guide.subject.toLowerCase()}/${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center gap-3 bg-primary text-white font-black py-5 px-10 rounded-2xl hover:bg-accent transition-all duration-300 shadow-2xl hover:scale-105 active:scale-95 text-xl"
                    >
                        ⚡ Start Practice Test
                    </Link>
                </div>
            )}
        </div>
    );
};

export default GuideReader;
