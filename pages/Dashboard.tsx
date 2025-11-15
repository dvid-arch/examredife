

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import OnboardingTour from '../components/OnboardingTour.tsx';

// FIX: Changed icon components to accept props to allow className to be passed via React.cloneElement.
const PracticeIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const ClassroomIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const SearchIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PerformanceIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GamesIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>;
const BookIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const ChallengeIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>;
// FIX: Redefined CareerIcon locally to accept props, fixing the type error with React.cloneElement.
const CareerIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const DictionaryIcon = (props: React.ComponentProps<"svg">) => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;

const tiles = [
    { title: 'Practice For UTME', description: 'Simulate exams & create custom quizzes.', colorClass: 'bg-blue-500', path: '/practice', icon: <PracticeIcon />, tourId: 'practice-tile' },
    { title: 'Classroom', description: 'Access curated study guides and materials.', colorClass: 'bg-pink-500', path: '/study-guides', icon: <ClassroomIcon /> },
    { title: 'Question Search', description: 'Find any past question in seconds.', colorClass: 'bg-green-500', path: '/question-search', icon: <SearchIcon /> },
    { title: 'Performance Analysis', description: 'Track your scores and identify weak spots.', colorClass: 'bg-orange-500', path: '/performance', icon: <PerformanceIcon /> },
    { title: 'Educational Games', description: 'Learn while having fun with interactive games.', colorClass: 'bg-yellow-500', path: '/games', icon: <GamesIcon /> },
    { title: 'UTME Literature Books', description: 'Review key themes from official books.', colorClass: 'bg-purple-500', path: '/literature', icon: <BookIcon /> },
    { title: 'UTME Challenge', description: 'Compete on the leaderboard in real-time.', colorClass: 'bg-red-500', path: '/challenge', icon: <ChallengeIcon /> },
    { title: 'Career & Institutions', description: 'Explore university and course information.', colorClass: 'bg-indigo-500', path: '/career-institutions', icon: <CareerIcon /> },
    { title: 'Dictionary', description: 'Look up words and definitions instantly.', colorClass: 'bg-teal-500', path: '/dictionary', icon: <DictionaryIcon /> },
];

// FIX: Changed icon prop type to be more specific, allowing React.cloneElement to pass a className without a type error.
const DashboardTile: React.FC<{ title: string; description: string; colorClass: string; path: string; icon: React.ReactElement<{ className?: string }>; tourId?: string; }> = ({ title, description, colorClass, path, icon, tourId }) => (
    <Link to={path} className="block group" data-tour-id={tourId}>
        <div className="relative p-5 h-48 flex flex-col justify-between bg-slate-800 dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-primary/30 transition-all duration-300 overflow-hidden group-hover:-translate-y-1">
            {/* Watermark Icon */}
            <div className="absolute -right-5 -bottom-5 text-slate-700/50 dark:text-gray-700/50">
                 {React.cloneElement(icon, { className: "h-24 w-24" })}
            </div>
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClass}`}>
                     {React.cloneElement(icon, { className: "h-6 w-6 text-white" })}
                </div>
            </div>
            <div className="relative z-10 mt-auto">
                <h3 className="font-bold text-xl text-white">{title}</h3>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
        </div>
    </Link>
);

const WelcomeBanner = () => {
    const { isAuthenticated, user } = useAuth();
    return (
        <div data-tour-id="welcome-banner" className="bg-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-green-600 rounded-full opacity-30"></div>
            <div className="absolute -left-12 bottom-4 w-40 h-40 bg-green-600 rounded-full opacity-20 transform rotate-45"></div>
            <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-bold">
                    {isAuthenticated && user ? `Welcome back, ${user.name}!` : "Welcome to ExamRedi!"}
                </h1>
                <p className="mt-2 text-green-100 max-w-2xl">
                     {isAuthenticated 
                        ? "Ready to ace your exams? Let's dive into some practice questions or review your study guides."
                        : "The best way to prepare for your exams. Dive into practice questions, AI-powered guides, and more."
                     }
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <Link to="/practice" className="bg-white text-primary font-bold py-3 px-6 rounded-lg hover:bg-green-100 transition-colors duration-200 text-center">Start Practice Session</Link>
                    <Link to={isAuthenticated ? "/performance" : "/practice"} className="bg-transparent border-2 border-white font-semibold py-3 px-6 rounded-lg hover:bg-white hover:text-primary transition-colors duration-200 text-center">
                        {isAuthenticated ? "View Performance" : "Explore Features"}
                    </Link>
                </div>
            </div>
        </div>
    );
};


const Dashboard: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const tourCompleted = localStorage.getItem('examRediOnboardingCompleted');
        if (isAuthenticated && tourCompleted !== 'true') {
            const timer = setTimeout(() => {
                 if (window.innerWidth >= 768) { // Only show on desktop
                    setShowTour(true);
                 }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated]);

    const handleTourComplete = () => {
        localStorage.setItem('examRediOnboardingCompleted', 'true');
        setShowTour(false);
    };
    
    const tourSteps: {
        selector: string;
        title: string;
        content: string;
        position?: 'top' | 'bottom' | 'left' | 'right';
    }[] = [
        {
            selector: '[data-tour-id="welcome-banner"]',
            title: 'Welcome to ExamRedi!',
            content: "This is your dashboard, the starting point for all your study activities. Let's take a quick look around.",
            position: 'bottom',
        },
        {
            selector: '[data-tour-id="practice-tile"]',
            title: 'Practice for Exams',
            content: 'This is where you can take simulated UTME exams or create custom practice sessions on any subject.',
            position: 'bottom',
        },
        {
            selector: '[data-tour-id="ai-tutor-nav"]',
            title: 'Your Personal AI Tutor',
            content: "Stuck on a concept? Your AI-buddy is here to help you 24/7 with explanations, hints, and practice questions.",
            position: 'right',
        },
        {
            selector: '[data-tour-id="search-bar"]',
            title: 'Search Past Questions',
            content: 'Instantly find any past question by typing a keyword here. It\'s a powerful tool for focused study.',
            position: 'bottom',
        },
        {
            selector: '[data-tour-id="performance-nav"]',
            title: 'Track Your Performance',
            content: 'After completing quizzes, come here to see your scores, track your progress, and identify your strengths and weaknesses.',
            position: 'right',
        },
    ];

    return (
        <div className="space-y-6">
            {showTour && <OnboardingTour steps={tourSteps} onComplete={handleTourComplete} />}
            <WelcomeBanner />

            <div>
                 <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Explore Your Tools</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tiles.map((tile) => (
                        <DashboardTile key={tile.title} {...tile} />
                    ))}
                </div>
            </div>

             <div className="bg-white dark:bg-gray-900/80 p-3 rounded-lg shadow-sm text-center">
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <span className="font-bold text-primary mr-2">Tip:</span> Consistent practice is the key to mastering any subject. Try a new topic today!
                </p>
            </div>
        </div>
    );
};

export default Dashboard;