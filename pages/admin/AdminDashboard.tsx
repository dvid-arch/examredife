import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';

interface AdminStats {
    users: number;
    papers: number;
    questions: number;
    guides: number;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card className={`relative overflow-hidden`}>
        <div className={`absolute -top-3 -right-3 w-16 h-16 ${color} rounded-full opacity-20 dark:opacity-30`}></div>
        <div className="relative flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{title}</p>
            </div>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats>({
        users: 0,
        papers: 0,
        questions: 0,
        guides: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiService<AdminStats>('/admin/stats');
                setStats(data);
            } catch (error) {
                console.error("Failed to fetch admin stats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard 
                    title="Total Users" 
                    value={isLoading ? '...' : stats.users}
                    color="bg-blue-200 dark:bg-blue-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-800 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 13a5.995 5.995 0 01-3 5.197z" /></svg>}
                />
                 <StatCard 
                    title="Past Papers" 
                    value={isLoading ? '...' : stats.papers}
                    color="bg-green-200 dark:bg-green-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                 <StatCard 
                    title="Total Questions" 
                    value={isLoading ? '...' : stats.questions}
                    color="bg-yellow-200 dark:bg-yellow-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-800 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                 <StatCard 
                    title="Study Guides" 
                    value={isLoading ? '...' : stats.guides}
                    color="bg-purple-200 dark:bg-purple-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-800 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
            </div>

            <Card>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <Link to="/admin/users" className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Manage Users</Link>
                    <Link to="/admin/content" className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Manage Content</Link>
                </div>
            </Card>

        </div>
    );
};

export default AdminDashboard;