
import React, { useEffect } from 'react';

interface SchemaProps {
    type: 'Quiz' | 'Course' | 'FAQPage' | 'BreadcrumbList' | 'Article' | 'WebPage';
    data: any;
}

/**
 * SchemaMarkup Component
 * Injects JSON-LD structured data into the <head> of the document.
 * This helps Google understand the content hierarchy and display "Rich Results".
 */
const SchemaMarkup: React.FC<SchemaProps> = ({ type, data }) => {
    useEffect(() => {
        // Create the script element
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = `schema-${type.toLowerCase()}`;

        // Construct the full JSON-LD object
        const schemaObject = {
            "@context": "https://schema.org",
            "@type": type,
            ...data
        };

        script.innerHTML = JSON.stringify(schemaObject);

        // Remove existing schema of same type if any
        const existingScript = document.getElementById(script.id);
        if (existingScript) {
            document.head.removeChild(existingScript);
        }

        // Add to head
        document.head.appendChild(script);

        // Cleanup on unmount
        return () => {
            const currentScript = document.getElementById(script.id);
            if (currentScript) {
                document.head.removeChild(currentScript);
            }
        };
    }, [type, data]);

    return null; // This component doesn't render anything to the DOM
};

export default SchemaMarkup;
