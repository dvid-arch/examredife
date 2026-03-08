import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { NAV_ITEMS, LogoutIcon, InstallAppIcon } from '../constants.tsx';
import { NavItemType } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';
import UserAvatar from './UserAvatar.tsx';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate?: () => void;
}

const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Logo = () => (
    <div className="flex items-center px-4 mb-6 select-none">
        <div className="font-black text-2xl md:text-3xl tracking-tight flex items-center" style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
            <span className="text-slate-700 dark:text-slate-100">Exam</span>
            <span className="text-blue-500">R</span>
            <span className="text-red-400">e</span>
            <span className="text-yellow-400">d</span>
            <span className="text-green-500">i</span>
        </div>
    </div>
);

const NavItem: React.FC<{ item: NavItemType; onClick?: () => void }> = ({ item, onClick }) => {
    const navLinkProps: { [key: string]: any } = {};
    if (item.path === '/ai-buddy') navLinkProps['data-tour-id'] = 'ai-tutor-nav';
    if (item.path === '/performance') navLinkProps['data-tour-id'] = 'performance-nav';

    return (
        <NavLink
            to={item.path}
            {...navLinkProps}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 mx-2 ${isActive
                    ? 'bg-primary-light dark:bg-primary/20 text-primary font-bold shadow-sm'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                }`
            }
        >
            {item.icon}
            <span>{item.name}</span>
        </NavLink>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate }) => {
    const { isAuthenticated, user, logout, requestLogin, requestUpgrade, isLoading } = useAuth();
    const { canInstall, triggerInstallPrompt } = usePwaInstall();

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

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>

            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 flex flex-col py-4 transform transition-transform duration-300 ease-in-out z-40 h-full max-h-screen max-h-[100dvh]
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:z-auto`}
            >
                <Link to="/dashboard" onClick={onClose} className="hover:opacity-80 transition-opacity">
                    <Logo />
                </Link>
                <nav className="flex-1 space-y-2 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.path} item={item} onClick={onNavigate || onClose} />
                    ))}
                </nav>

                {user?.role === 'admin' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <NavLink
                            to="/admin"
                            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 font-semibold"
                        >
                            <AdminIcon />
                            <span>Admin Panel</span>
                        </NavLink>
                    </div>
                )}

                <div className="mt-auto space-y-2">
                    {isLoading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                        </div>
                    ) : isAuthenticated && user ? (
                        <>
                            <div className="px-2 mb-2">
                                <Link to="/profile" onClick={onNavigate || onClose} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-gray-100 dark:border-slate-800">
                                    <UserAvatar name={user.name} photoURL={user.photoURL} size="sm" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.subscription} Plan</p>
                                    </div>
                                </Link>
                            </div>
                            {user.subscription === 'free' ? (
                                <button onClick={handleUpgradeClick} className="w-full bg-accent text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200">
                                    Upgrade to Pro
                                </button>
                            ) : (
                                canInstall && (
                                    <button onClick={triggerInstallPrompt} className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200">
                                        <InstallAppIcon />
                                        <span>Install App</span>
                                    </button>
                                )
                            )}
                        </>
                    ) : (
                        <button onClick={requestLogin} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-accent transition-colors">
                            Login / Sign Up
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Sidebar;