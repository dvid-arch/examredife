import { useState, useEffect } from 'react';

/**
 * Hook to track the visual viewport height, especially useful for mobile keyboards.
 */
export interface ViewportData {
    height: string;
    offsetTop: number;
}

export const useVisualViewport = () => {
    const [viewport, setViewport] = useState<ViewportData>({
        height: '100dvh',
        offsetTop: 0
    });

    useEffect(() => {
        if (!window.visualViewport) return;

        const handleResize = () => {
            if (window.visualViewport) {
                // Prevent browser from scrolling the layout viewport
                window.scrollTo(0, 0);

                setViewport({
                    height: `${window.visualViewport.height}px`,
                    offsetTop: window.visualViewport.offsetTop
                });
            }
        };

        handleResize();

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, []);

    return viewport;
};

export default useVisualViewport;
