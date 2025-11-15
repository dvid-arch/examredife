
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Card from '../components/Card.tsx';

interface LoginPageProps {
    onLogin: () => void;
}

const Logo = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8">
            <rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6"/>
            <rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444"/>
            <rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15"/>
            <rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E"/>
        </svg>
        <span className="font-bold text-2xl text-slate-800 dark:text-white">ExamRedi</span>
    </div>
);


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would validate credentials here
        console.log('Logging in with:', { email, password });
        onLogin();
        navigate(from, { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-gray-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <Logo />
                <Card className="p-8">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-1">Welcome Back!</h1>
                    <p className="text-slate-600 dark:text-slate-300 text-center mb-6">Login to continue your exam preparation.</p>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors duration-200"
                        >
                            Login
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-6">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-primary hover:underline">
                            Sign Up
                        </Link>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;