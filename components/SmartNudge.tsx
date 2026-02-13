import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEngagement } from '../contexts/EngagementContext.tsx';
import { EngagementNudge } from '../types.ts';

const SmartNudge: React.FC = () => {
    const { activeNudge, dismissNudge } = useEngagement();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (activeNudge) {
            // Delay visibility for entry animation
            const timer = setTimeout(() => setIsVisible(true), 100);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [activeNudge]);

    if (!activeNudge) return null;

    const isModal = activeNudge.type === 'MODAL';

    const renderIcon = () => {
        switch (activeNudge.icon) {
            case 'trophy':
                return <span className="text-3xl sm:text-4xl animate-bounce">🏆</span>;
            case 'fire':
                return <span className="text-3xl sm:text-4xl animate-pulse">🔥</span>;
            case 'rocket':
                return <span className="text-3xl sm:text-4xl hover:translate-y-1 transition-transform">🚀</span>;
            case 'gift':
                return <span className="text-3xl sm:text-4xl">🎁</span>;
            case 'heart':
                return <span className="text-3xl sm:text-4xl animate-pulse text-red-500">❤️</span>;
            default:
                return <span className="text-3xl sm:text-4xl">✨</span>;
        }
    };

    return (
        <>
            {/* Modal Backdrop */}
            {isModal && (
                <div
                    className={`fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={dismissNudge}
                />
            )}

            <div
                className={`fixed z-[100] transition-all duration-500 transform 
                    ${isModal
                        ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md w-[90%]'
                        : 'bottom-6 right-6 max-w-sm w-full'
                    }
                    ${isVisible ? 'translate-y-0 opacity-100 scale-100' : isModal ? 'translate-y-0 opacity-0 scale-90' : 'translate-y-12 opacity-0 scale-95'}
                `}
            >
                <div className={`relative group overflow-hidden rounded-[2rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-2 border-white/50 dark:border-slate-700/50 shadow-2xl p-8 ring-1 ring-black/5`}>
                    {/* Decorative Gradient Background */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                    <button
                        onClick={dismissNudge}
                        className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 z-10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <div className={`flex flex-col items-center text-center gap-6`}>
                        <div className="shrink-0 w-20 h-20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-600">
                            {renderIcon()}
                        </div>

                        <div className="flex-1 space-y-2">
                            <h4 className="font-black text-slate-800 dark:text-white text-2xl sm:text-3xl leading-tight tracking-tight">{activeNudge.title}</h4>
                            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed font-medium">{activeNudge.message}</p>
                        </div>

                        {activeNudge.actionPath && (
                            <Link
                                to={activeNudge.actionPath}
                                onClick={dismissNudge}
                                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-black py-4 px-8 rounded-2xl text-lg hover:bg-accent transition-all shadow-xl shadow-primary/30 active:scale-95 group/btn"
                                style={{ backgroundColor: activeNudge.ctaColor }}
                            >
                                {activeNudge.actionLabel || 'Check it out'}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        )}

                        {isModal && (
                            <button
                                onClick={dismissNudge}
                                className="text-slate-400 dark:text-slate-500 text-sm font-bold hover:text-slate-600 transition-colors uppercase tracking-widest pt-2"
                            >
                                Maybe Later
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default SmartNudge;
