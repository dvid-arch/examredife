import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.tsx';

const AdminDashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 13a5.995 5.995 0 01-3 5.197z" /></svg>;
const ContentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const BackToAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;


const navItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <AdminDashboardIcon /> },
    { path: '/admin/users', name: 'Manage Users', icon: <UsersIcon /> },
    { path: '/admin/content', name: 'Manage Content', icon: <ContentIcon /> },
];

const getLocationTitle = (pathname: string) => {
    if (pathname.includes('/users')) return 'Manage Users';
    if (pathname.includes('/content')) return 'Manage Content';
    return 'Admin Dashboard';
};

const AdminHeader: React.FC<{ onMenuClick: () => void; title: string }> = ({ onMenuClick, title }) => (
    <header className="md:hidden bg-slate-800 text-white p-4 flex items-center shadow-md sticky top-0 z-20">
        <button onClick={onMenuClick} className="mr-4 text-slate-300 hover:text-white">
            <MenuIcon />
        </button>
        <h1 className="text-xl font-bold">{title}</h1>
    </header>
);

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden ${isOpen ? 'block' : 'hidden'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <aside 
                className={`fixed inset-y-0 left-0 w-64 bg-slate-800 text-white flex flex-col p-4 transform transition-transform duration-300 ease-in-out z-40
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:z-auto`}
            >
                 <div className="flex items-center space-x-2 px-4 mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7"><rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6"/><rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444"/><rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15"/><rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E"/></svg>
                    <span className="text-xl flex flex-col"><span className="font-bold">ExamRedi</span> <span className="text-sm">Admin</span></span>
                </div>
                <nav className="flex-1 space-y-2">
                     {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                                    isActive ? 'bg-primary/80 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700'
                                }`
                            }
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto">
                     <div className="text-center p-2 mb-4">
                        <p className="text-sm font-semibold">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                        <BackToAppIcon />
                        <span>Back to App</span>
                    </button>
                </div>
            </aside>
        </>
    )
}

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const title = getLocationTitle(location.pathname);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 font-sans">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
            <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} title={title} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                 <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    </div>
  );
};

export default AdminLayout;