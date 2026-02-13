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

    const renderIcon = () => {
        switch (activeNudge.icon) {
            case 'trophy':
                return <span className="text-3xl animate-bounce">🏆</span>;
            case 'fire':
                return <span className="text-3xl animate-pulse">🔥</span>;
            case 'rocket':
                return <span className="text-3xl hover:translate-y-1 transition-transform">🚀</span>;
            case 'gift':
                return <span className="text-3xl">🎁</span>;
            default:
                return <span className="text-3xl">✨</span>;
        }
    };

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] max-w-sm w-full transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
                }`}
        >
            <div className="relative group overflow-hidden rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 shadow-2xl p-6 ring-1 ring-black/5">
                {/* Decorative Gradient Background */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />

                <button
                    onClick={dismissNudge}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                <div className="flex gap-5 items-start">
                    <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-600">
                        {renderIcon()}
                    </div>

                    <div className="flex-1">
                        <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight mb-1">{activeNudge.title}</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">{activeNudge.message}</p>

                        {activeNudge.actionPath && (
                            <Link
                                to={activeNudge.actionPath}
                                onClick={dismissNudge}
                                className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-xl text-sm hover:bg-accent transition-all shadow-lg shadow-primary/20 active:scale-95"
                                style={{ backgroundColor: activeNudge.ctaColor }}
                            >
                                {activeNudge.actionLabel || 'Check it out'}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SmartNudge;
