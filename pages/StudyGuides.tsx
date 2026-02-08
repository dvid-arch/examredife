import React from 'react';
import { Outlet } from 'react-router-dom';

const StudyGuides: React.FC = () => {
    return (
        <div className="min-h-full">
            <Outlet />
        </div>
    );
};

export default StudyGuides;
