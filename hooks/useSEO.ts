import { useEffect } from 'react';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    keywords?: string[];
}

const useSEO = ({ title, description, canonical, keywords }: SEOProps) => {
    useEffect(() => {
        // Handle Title
        const baseTitle = 'ExamRedi AI Study Platform';
        const fullTitle = title ? `${title} | ExamRedi` : baseTitle;
        document.title = fullTitle;

        // Handle Description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description || 'Master your exams with AI-powered study guides, past questions, and engaging learning tools on ExamRedi.');

        // Handle Keywords
        if (keywords && keywords.length > 0) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', keywords.join(', '));
        }

        // Handle Canonical Link
        if (canonical) {
            let linkCanonical = document.querySelector('link[rel="canonical"]');
            if (!linkCanonical) {
                linkCanonical = document.createElement('link');
                linkCanonical.setAttribute('rel', 'canonical');
                document.head.appendChild(linkCanonical);
            }
            linkCanonical.setAttribute('href', canonical);
        }
    }, [title, description, canonical, keywords]);
};

export default useSEO;
