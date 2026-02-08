import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Reset scroll of the main content container
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.scrollTo(0, 0);
        } else {
            // Fallback for pages outside MainLayout
            window.scrollTo(0, 0);
        }
    }, [pathname]);

    return null;
};

export default ScrollToTop;
