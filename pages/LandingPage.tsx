
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
            <rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6"/>
            <rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444"/>
            <rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15"/>
            <rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E"/>
        </svg>
        <span className="font-bold text-xl text-slate-800">ExamRedi</span>
    </div>
);

const LandingHeader: React.FC = () => (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <Logo />
            <div className="flex items-center gap-4">
                <Link to="/login" className="font-semibold text-primary hover:underline">Login</Link>
                <Link to="/register" className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors">Get Started</Link>
            </div>
        </div>
    </header>
);

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="w-14 h-14 mb-4 rounded-full bg-primary-light text-primary flex items-center justify-center">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600">{description}</p>
    </div>
);

const LandingPage: React.FC = () => {
    return (
        <div className="bg-slate-50 min-h-screen">
            <LandingHeader />
            <main>
                {/* Hero Section */}
                <section className="py-20 md:py-32 text-center bg-white">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight">
                            Ace Your Exams with <span className="text-primary">AI-Powered</span> Study Tools
                        </h1>
                        <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
                            ExamRedi provides everything you need to succeed. From interactive practice sessions and AI tutors to dynamic study guides and educational games.
                        </p>
                        <div className="mt-10">
                            <Link to="/register" className="bg-primary text-white font-bold py-4 px-10 rounded-lg text-lg hover:bg-accent transition-transform hover:scale-105 inline-block">
                                Start Studying for Free
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Your Ultimate Study Companion</h2>
                            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
                                We've built a comprehensive platform to address all your study needs and help you achieve your best results.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard 
                                title="Practice Questions"
                                description="Access a vast library of past questions for UTME and other exams. Practice in a simulated environment and track your progress."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                            />
                             <FeatureCard 
                                title="AI Tutor"
                                description="Your personal AI-buddy is available 24/7. Ask questions, get hints, and understand complex topics with ease."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                            />
                             <FeatureCard 
                                title="AI Study Guides"
                                description="Generate custom study guides on any subject or topic instantly. Your learning, personalized and efficient."
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                            />
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-white border-t py-8">
                     <div className="container mx-auto px-4 text-center text-slate-500">
                        <p>&copy; {new Date().getFullYear()} ExamRedi. All rights reserved.</p>
                     </div>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
