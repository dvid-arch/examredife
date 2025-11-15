
import React from 'react';
import { usePwaInstall } from '../contexts/PwaContext.tsx';

const PwaInstallBanner: React.FC = () => {
    const { isBannerVisible, hideInstallBanner, triggerInstallPrompt } = usePwaInstall();

    if (!isBannerVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
            <div className="bg-white rounded-lg shadow-2xl p-4 max-w-sm w-full flex items-center gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-light text-primary rounded-md flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                </div>
                <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">Get the ExamRedi App!</p>
                    <p className="text-slate-600 text-xs">Install for a better experience and offline access.</p>
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={triggerInstallPrompt}
                            className="text-xs bg-primary text-white font-semibold px-3 py-1 rounded hover:bg-accent transition-colors"
                        >
                            Install
                        </button>
                        <button
                            onClick={hideInstallBanner}
                            className="text-xs font-semibold text-slate-500 px-3 py-1 rounded hover:bg-slate-100"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PwaInstallBanner;