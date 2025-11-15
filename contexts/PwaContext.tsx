
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

interface PwaInstallContextType {
    canInstall: boolean;
    isBannerVisible: boolean;
    showInstallBanner: () => void;
    hideInstallBanner: () => void;
    triggerInstallPrompt: () => void;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export const PwaInstallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isBannerVisible, setIsBannerVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const canInstall = !!deferredPrompt;
    
    const showInstallBanner = () => {
        if (canInstall) {
            setIsBannerVisible(true);
        }
    };
    
    const hideInstallBanner = () => {
        setIsBannerVisible(false);
    };

    const triggerInstallPrompt = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                } else {
                    console.log('User dismissed the install prompt');
                }
                setDeferredPrompt(null);
                hideInstallBanner();
            });
        }
    };

    const value = { canInstall, isBannerVisible, showInstallBanner, hideInstallBanner, triggerInstallPrompt };

    return (
        <PwaInstallContext.Provider value={value}>
            {children}
        </PwaInstallContext.Provider>
    );
};

export const usePwaInstall = () => {
    const context = useContext(PwaInstallContext);
    if (context === undefined) {
        throw new Error('usePwaInstall must be used within a PwaInstallProvider');
    }
    return context;
};