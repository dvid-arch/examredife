import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, LogoutIcon, InstallAppIcon } from '../constants.tsx';
import { NavItemType } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { usePwaInstall } from '../contexts/PwaContext.tsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const Logo = () => (
    <div className="flex items-center space-x-2 px-4 mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
            <rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6"/>
            <rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444"/>
            <rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15"/>
            <rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E"/>
        </svg>
        <span className="font-bold text-xl text-slate-800 dark:text-white">ExamRedi</span>
    </div>
);

const NavItem: React.FC<{ item: NavItemType }> = ({ item }) => {
    const navLinkProps: { [key: string]: any } = {};
    if (item.path === '/ai-buddy') navLinkProps['data-tour-id'] = 'ai-tutor-nav';
    if (item.path === '/performance') navLinkProps['data-tour-id'] = 'performance-nav';

    return (
        <NavLink
            to={item.path}
            {...navLinkProps}
            className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                    ? 'bg-primary-light dark:bg-primary/20 text-primary font-semibold'
                    : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`
            }
        >
            {item.icon}
            <span>{item.name}</span>
        </NavLink>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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
            className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col p-4 transform transition-transform duration-300 ease-in-out z-40
            ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            md:relative md:translate-x-0 md:z-auto`}
        >
            <Logo />
            <nav className="flex-1 space-y-2 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                    <NavItem key={item.path} item={item} />
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