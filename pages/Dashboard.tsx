
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';
import useSEO from '../hooks/useSEO.ts';
import OnboardingTour from '../components/OnboardingTour.tsx';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import VerificationBanner from '../components/VerificationBanner.tsx';
import { DashboardSkeleton } from '../components/Skeletons.tsx';
import { usePastQuestions } from '../contexts/PastQuestionsContext.tsx';
import { StudyGuide } from '../types.ts';
import OnboardingSubjectModal from '../components/OnboardingSubjectModal.tsx';

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
        <div className="relative p-6 h-48 flex flex-col justify-between bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 group-hover:-translate-y-1">
            {/* Watermark Icon - Softer in light mode */}
            <div className="absolute -right-6 -bottom-6 text-gray-50/50 dark:text-gray-700/30 group-hover:text-gray-100/50 dark:group-hover:text-gray-600/30 transition-colors">
                {React.cloneElement(icon, { className: "h-32 w-32" })}
            </div>
            <div className="relative z-10 hidden sm:block"> {/* Hide icon on very small screens if needed, but usually keep */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass.replace('bg-', 'text-').replace('500', '600')} bg-opacity-10 bg-${colorClass.split('-')[1]}-50`}>
                    {/* We need to restructure how colorClass is used or pass a lighter bg class. 
                        For now, let's just make the icon generic primary or parse the color.
                        Simpler approach: Use the passed colorClass for the ICON COLOR, not background.
                     */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} text-white shadow-md shadow-${colorClass.split('-')[1]}-200`}>
                        {React.cloneElement(icon, { className: "h-6 w-6" })}
                    </div>
                </div>
            </div>
            {/* Mobile layout adjustment: Icon and Text inline? No, keep stacked for cards. */}
            <div className="relative z-10 sm:hidden">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass} text-white shadow-md`}>
                    {React.cloneElement(icon, { className: "h-5 w-5" })}
                </div>
            </div>

            <div className="relative z-10 mt-auto">
                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 leading-tight mb-1 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-2">{description}</p>
            </div>
        </div>
    </Link>
);

const WelcomeBanner = () => {
    const { isAuthenticated, user } = useAuth();
    const { streak, estimatedScore } = useUserProgress();

    // Calculate percentage for progress circle (400 is max score)
    const scorePercentage = (estimatedScore / 400) * 100;
    const strokeDashoffset = 100 - scorePercentage;

    return (
        <div data-tour-id="welcome-banner" className="bg-primary text-white p-8 rounded-2xl shadow-lg shadow-primary/20 relative overflow-hidden mb-8 bg-grain">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>

            <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 tracking-tight">
                            {isAuthenticated && user ? `Hello, ${user.name} 👋` : "Welcome to ExamRedi!"}
                        </h1>
                        <p className="text-blue-50 text-lg max-w-xl font-medium leading-relaxed">
                            {isAuthenticated
                                ? "Your AI study assistant is ready. What would you like to learn today?"
                                : "The smartest way to prepare for your exams. Join thousands of students acing their tests."
                            }
                        </p>
                    </div>

                    {isAuthenticated && (
                        <div className="flex gap-4">
                            {/* Streak Badge */}
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                <span className="text-2xl">🔥</span>
                                <div>
                                    <span className="block text-xl font-bold leading-none">{streak}</span>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100">Day Streak</span>
                                </div>
                            </div>

                            {/* Estimated Score Ring */}
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20">
                                <div className="relative w-10 h-10">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-blue-900/30" />
                                        <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white" strokeDasharray="100" strokeDashoffset={strokeDashoffset} style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                                    </svg>
                                </div>
                                <div>
                                    <span className="block text-xl font-bold leading-none">{estimatedScore}</span>
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-100">Est. Score</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link to="/practice" className="bg-white text-primary font-bold py-3 px-8 rounded-lg hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md">
                        Start Practice
                    </Link>
                    <Link to="/challenge" className="bg-primary-dark/30 text-white border border-white/20 font-semibold py-3 px-8 rounded-lg hover:bg-primary-dark/50 transition-all duration-200">
                        Daily Challenge
                    </Link>
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    useSEO({
        title: 'Dashboard',
        description: 'Track your learning progress, access past questions, and engage with AI study tools on your ExamRedi dashboard.'
    });
    const { isAuthenticated, user, updateUser, isLoading: isAuthLoading } = useAuth();
    const { recentActivity, studyProgress, calculateTopicStatus } = useUserProgress();
    const { guides, fetchGuides, isLoading: isGuidesLoading } = usePastQuestions();
    const [showTour, setShowTour] = useState(false);
    const needsSubjectSelection = isAuthenticated && (!user?.preferredSubjects || user.preferredSubjects.length < 4);

    // State for calculated weak areas
    const [weakAreas, setWeakAreas] = useState<{ id: string, title: string, subject: string, link: string }[]>([]);

    // Calculate Weak Areas on mount
    useEffect(() => {
        const fetchGuidesAndIdentifyWeaknesses = async () => {
            if (!isAuthenticated) return;

            // 1. Identify stale/lost/shaky IDs from progress
            const problemIds = Object.keys(studyProgress || {}).filter(id => {
                const status = calculateTopicStatus(id);
                return status === 'stale' || studyProgress[id].confidence === 'lost' || studyProgress[id].confidence === 'shaky';
            });

            if (problemIds.length === 0) {
                setWeakAreas([]);
                return;
            }

            // 2. Fetch guides to find titles and paths
            try {
                const fetchedGuides = await fetchGuides();
                const weaknesses: { id: string, title: string, subject: string, link: string }[] = [];
                const isAdmin = user?.role === 'admin';
                const preferred = user?.preferredSubjects || [];

                // Optimized search
                for (const guide of fetchedGuides) {
                    // Check if this subject should be shown
                    const isEnglish = ['english', 'english language', 'use of english'].includes(guide.subject.toLowerCase());
                    const isPreferred = preferred.some(p => p.toLowerCase() === guide.subject.toLowerCase() || guide.id.toLowerCase() === p.toLowerCase());

                    if (!isAdmin && preferred.length > 0 && !isPreferred && !isEnglish) continue;

                    for (const topic of guide.topics) {
                        if (problemIds.includes(topic.id)) {
                            weaknesses.push({
                                id: topic.id,
                                title: topic.title,
                                subject: guide.subject,
                                link: `/study-guides/${guide.id}/${topic.id}`
                            });
                        }
                    }
                }
                setWeakAreas(weaknesses.slice(0, 3));
            } catch (err) {
                console.error("Failed to fetch guides for weak areas", err);
            }
        };

        fetchGuidesAndIdentifyWeaknesses();
    }, [isAuthenticated, studyProgress, calculateTopicStatus, fetchGuides]);


    // Filter and sort activities for "Continue Studying" by most recent activity
    const continueStudyingActivities = useMemo(() => {
        return [...recentActivity].sort((a, b) => b.timestamp - a.timestamp);
    }, [recentActivity]);

    // Close tour when navigating away
    useEffect(() => {
        const handleHashChange = () => {
            setShowTour(false);
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const tourCompleted = localStorage.getItem('examRediOnboardingCompleted');
        if (isAuthenticated && tourCompleted !== 'true' && !needsSubjectSelection) {
            const timer = setTimeout(() => {
                if (window.innerWidth >= 768) { // Only show on desktop
                    setShowTour(true);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, needsSubjectSelection]);

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

    if (isAuthLoading) return <DashboardSkeleton />;

    const handleSaveSubjects = async (subjects: string[]) => {
        if (updateUser) {
            await updateUser({ preferredSubjects: subjects });
        }
    };

    return (
        <div className="space-y-8">
            <OnboardingSubjectModal
                isOpen={needsSubjectSelection}
                onSave={handleSaveSubjects}
            />
            {showTour && <OnboardingTour steps={tourSteps} onComplete={handleTourComplete} />}
            <VerificationBanner />
            <WelcomeBanner />

            {/* Weak Areas Widget */}
            {isAuthenticated && weakAreas.length > 0 && (
                <section className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Focus Areas</h2>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Based on your activity, we recommend reviewing these topics:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
                        {weakAreas.map((area, idx) => {
                            const isPro = user?.subscription === 'pro' || user?.role === 'admin';
                            const isBlurred = !isPro && idx > 0;

                            return (
                                <Link
                                    key={area.id}
                                    to={isBlurred ? "/settings" : area.link}
                                    className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group ${isBlurred ? 'opacity-30 blur-[1px]' : ''}`}
                                >
                                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider group-hover:text-primary transition-colors">{area.subject}</span>
                                    <h4 className="font-bold text-slate-800 dark:text-white leading-tight">{area.title}</h4>
                                    <div className="mt-auto pt-2 text-xs font-bold text-orange-500 flex items-center gap-1">
                                        {isBlurred ? "Unlock Topic" : "Review Now"} <span>→</span>
                                    </div>
                                </Link>
                            );
                        })}

                        {user?.subscription === 'free' && weakAreas.length > 1 && (
                            <div className="absolute inset-0 left-1/3 bg-gradient-to-r from-transparent via-orange-50/80 dark:via-orange-950/80 to-orange-50 dark:to-orange-950 flex items-center justify-end pr-8 rounded-2xl">
                                <Link to="/settings" className="bg-primary text-white font-bold py-2.5 px-6 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zM7 7a3 3 0 116 0v2H7V7z" />
                                    </svg>
                                    Unlock Deep Insights
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {isAuthenticated && continueStudyingActivities.length > 0 && (
                <section className="relative">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Continue Studying</h2>
                        <Link to="/journey" className="text-primary text-sm font-semibold hover:underline">View All</Link>
                    </div>

                    <div className="flex overflow-x-auto pb-6 gap-5 snap-x no-scrollbar px-1 -mx-1">
                        {continueStudyingActivities.slice(0, 5).map((activity) => (
                            <div key={activity.id} className="flex-none w-[300px] snap-start flex flex-col bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-700 group relative">
                                {activity.mastered && (
                                    <div className="absolute top-3 right-3 bg-yellow-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10 animate-bounce-subtle">
                                        MASTERED 🏆
                                    </div>
                                )}
                                <Link
                                    to={activity.path}
                                    state={{
                                        ...activity.state,
                                        isRetake: true,
                                        timestamp: Date.now()
                                    }}
                                    className="flex items-center gap-4 flex-1 min-w-0 mb-3"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === 'quiz' ? 'bg-blue-100 text-blue-600' :
                                        activity.type === 'guide' ? 'bg-pink-100 text-pink-600' : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {activity.type === 'quiz' ? '📝' : activity.type === 'guide' ? '📖' : '🎮'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800 dark:text-white truncate text-base">{activity.title}</h3>
                                            {activity.score !== undefined && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(activity.score / (activity.maxScore || 1)) >= 0.7 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {Math.round((activity.score / (activity.maxScore || 1)) * 100)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                                {activity.subtitle || activity.type}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                <div className="flex items-center space-x-3 mt-auto">
                                    {activity.type === 'quiz' ? (
                                        activity.score !== undefined ? (
                                            <div className="flex w-full gap-2">
                                                <Link
                                                    to={activity.path}
                                                    state={{
                                                        ...activity.state,
                                                        isRetake: true,
                                                        timestamp: Date.now()
                                                    }}
                                                    className="flex-1 bg-primary text-white text-center py-2 px-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-green-700 transition-colors"
                                                >
                                                    Practice Again
                                                </Link>
                                                <Link
                                                    to="/performance"
                                                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-center py-2 px-3 rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors"
                                                >
                                                    Analysis
                                                </Link>
                                            </div>
                                        ) : (
                                            <Link
                                                to={activity.path}
                                                state={{
                                                    ...activity.state,
                                                    isRetake: false,
                                                    timestamp: Date.now()
                                                }}
                                                className={`w-full text-center py-2 px-4 rounded-lg text-xs sm:text-sm font-bold transition-colors ${activity.state?.mode === 'mock'
                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none'
                                                    : 'bg-primary text-white hover:bg-green-700'
                                                    }`}
                                            >
                                                {activity.state?.mode === 'mock' ? 'Abandoned Exam' : 'Resume Session'}
                                            </Link>
                                        )
                                    ) : (
                                        <Link
                                            to={activity.path}
                                            state={activity.state}
                                            className="w-full bg-primary/10 text-primary text-center py-2 px-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-primary hover:text-white transition-colors"
                                        >
                                            {activity.type === 'game' ? 'Play Again' : 'Resume Session'}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}

                        {recentActivity.length > 3 && (
                            <Link
                                to="/journey"
                                className="flex-none w-[140px] snap-start flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all group p-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <span className="text-primary">➡️</span>
                                </div>
                                <span className="font-bold text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">See All</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{recentActivity.length - 3} more</span>
                            </Link>
                        )}
                    </div>
                </section>
            )}

            <section>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Study Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {tiles.map((tile) => (
                        <DashboardTile key={tile.title} {...tile} />
                    ))}
                </div>
            </section>

            <div className="bg-white dark:bg-gray-900/80 p-3 rounded-lg shadow-sm text-center">
                <p className="text-slate-700 dark:text-slate-300 text-sm">
                    <span className="font-bold text-primary mr-2">Tip:</span> Consistent practice is the key to mastering any subject. Try a new topic today!
                </p>
            </div>
        </div >
    );
};

export default Dashboard;