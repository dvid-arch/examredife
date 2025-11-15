



import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { MenuIcon, NAV_ITEMS, AiCreditsIcon, ProfileIcon, LogoutIcon } from '../constants.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import ThemeToggle from './ThemeToggle.tsx';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
            <rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6"/>
            <rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444"/>
            <rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15"/>
            <rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E"/>
        </svg>
        <span className="font-bold text-xl text-slate-800 dark:text-white">ExamRedi</span>
    </div>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const { isAuthenticated, user, requestLogin, requestUpgrade, isLoading, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getPageTitle = () => {
        const path = location.pathname;

        // Special cases that are not in NAV_ITEMS or need an override
        if (path.startsWith('/games/memory-match')) return 'Memory Match';
        if (path.startsWith('/games/subject-sprint')) return 'Subject Sprint';
        if (path === '/challenge') return 'UTME Challenge';
        if (path === '/literature') return 'UTME Literature Books';
        if (path === '/dictionary') return 'Dictionary';
        
        // Find matching nav item, prioritizing more specific paths
        const matchingNavItems = NAV_ITEMS
            .filter(item => path.startsWith(item.path))
            .sort((a, b) => b.path.length - a.path.length);

        if (matchingNavItems.length > 0) {
            return matchingNavItems[0].name;
        }

        return 'Dashboard'; // Default fallback
    };
    
    const pageTitle = getPageTitle();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate('/question-search', { state: { query: searchQuery } });
            setSearchQuery('');
        }
    };
    
    const handleUpgradeClick = () => {
        requestUpgrade({
            title: "Upgrade to ExamRedi Pro",
            message: "Unlock your full potential and get the best results with our premium features.",
            featureList: [
                "Unlimited Practice Questions",
                "Unlimited AI Tutor Access",
                "Generate Custom Study Guides",
                "Save All Results & Track Performance",
                "Compete on the UTME Challenge Leaderboard"
            ]
        });
    };

    // Click outside handler for the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm sticky top-0 z-20 flex-shrink-0">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <button 
                            onClick={onMenuClick} 
                            className="md:hidden mr-4 text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
                            aria-label="Open navigation menu"
                        >
                            <MenuIcon />
                        </button>
                        <div className="md:hidden">
                            <Logo />
                        </div>
                        {/* Display Page Title on Desktop */}
                        <h1 className="hidden md:block text-xl font-bold text-slate-800 dark:text-white">
                           {pageTitle}
                        </h1>
                    </div>
                    
                    {/* Search Bar - fills the gap */}
                    <div className="hidden md:flex flex-1 justify-center px-8 lg:px-16">
                        <form onSubmit={handleSearch} className="w-full max-w-md relative" data-tour-id="search-bar">
                             <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon />
                            </span>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search past questions..."
                                className="w-full bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-600"
                                aria-label="Search past questions"
                            />
                        </form>
                    </div>

                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {isLoading ? (
                            <div className="flex items-center space-x-2 animate-pulse">
                                <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                                <div className="hidden md:block">
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                                    <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded mt-1"></div>
                                </div>
                            </div>
                        ) : isAuthenticated && user ? (
                           <>
                                {user.subscription === 'pro' ? (
                                    <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 font-bold px-3 py-1.5 rounded-lg text-sm">
                                        <AiCreditsIcon />
                                        <span>{user.aiCredits} AI Credits</span>
                                    </div>
                                ) : (
                                    <button onClick={handleUpgradeClick} className="hidden sm:block bg-accent text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors text-sm">
                                        Upgrade
                                    </button>
                                )}
                                <div className="relative" ref={dropdownRef}>
                                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                                        <img
                                            src="https://picsum.photos/40"
                                            alt="profile"
                                            className="w-9 h-9 rounded-full object-cover"
                                        />
                                        <div className="hidden md:block text-left">
                                            <span className="font-semibold text-sm text-gray-700 dark:text-slate-50">{user.name}</span>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 capitalize">{user.subscription} User</p>
                                        </div>
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform duration-200" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    
                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-600 py-1 z-30">
                                            <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <ProfileIcon />
                                                <span>My Profile</span>
                                            </Link>
                                            <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
                                                <div className="flex items-center gap-3">
                                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                                   <span>Dark Mode</span>
                                                </div>
                                                <ThemeToggle />
                                            </div>
                                            <div className="my-1 border-t border-slate-200 dark:border-slate-600"></div>
                                            <button onClick={() => { logout(); setIsDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                <LogoutIcon />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                             <button onClick={requestLogin} className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors text-sm">
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;