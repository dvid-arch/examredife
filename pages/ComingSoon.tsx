
import React from 'react';
import Card from '../components/Card.tsx';

interface ComingSoonProps {
  title: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <Card className="max-w-md">
            <div className="bg-primary-light dark:bg-primary/20 text-primary rounded-full p-4 inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h1>
            <h2 className="text-4xl font-extrabold text-primary mb-4">Coming Soon!</h2>
            <p className="text-slate-600 dark:text-slate-300">
                We're working hard to bring you this feature. Stay tuned for updates!
            </p>
        </Card>
    </div>
  );
};

export default ComingSoon;