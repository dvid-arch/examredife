import React from 'react';
import { Outlet } from 'react-router-dom';
import useSEO from '../hooks/useSEO.ts';

const StudyGuides: React.FC = () => {
    useSEO({
        title: 'Study Guides',
        description: 'Explore comprehensive AI-generated study guides for all your subjects. Master topics with structured content tailored for exam success.'
    });
    return (
        <div className="min-h-full">
            <Outlet />
        </div>
    );
};

export default StudyGuides;
