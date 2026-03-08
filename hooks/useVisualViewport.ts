import { useState, useEffect } from 'react';

/**
 * Hook to track the visual viewport height, especially useful for mobile keyboards.
 */
export const useVisualViewport = () => {
    const [viewportHeight, setViewportHeight] = useState<string>('100dvh');

    useEffect(() => {
        if (!window.visualViewport) {
            // Fallback for browsers without visualViewport support
            return;
        }

        const handleResize = () => {
            if (window.visualViewport) {
                setViewportHeight(`${window.visualViewport.height}px`);
            }
        };

        // Initial set
        handleResize();

        window.visualViewport.addEventListener('resize', handleResize);
        window.visualViewport.addEventListener('scroll', handleResize);

        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, []);

    return viewportHeight;
};

export default useVisualViewport;
