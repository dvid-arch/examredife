
import React, { useState } from 'react';
import Card from './Card.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

export interface AuthDetails {
    name?: string;
    email: string;
    password?: string;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
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

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, register } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            if (isLoginView) {
                await login({ email, password });
            } else {
                await register({ name, email, password });
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const switchView = () => {
        setIsLoginView(!isLoginView);
        setError(null);
        setPassword('');
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
                <Card className="p-8">
                    <Logo />
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-1">
                        {isLoginView ? 'Welcome Back!' : 'Create Your Account'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                        {isLoginView ? 'Login to save your progress and track performance.' : 'Join to start your journey to exam success!'}
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                         {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}
                        {!isLoginView && (
                            <div>
                                <label htmlFor="name-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    id="name-modal" type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                id="email-modal" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required
                            />
                             {isLoginView && <p className="text-xs text-slate-500 mt-1 text-center">Hint: Use 'pro@examredi.com' and any password for the Pro account.</p>}
                        </div>
                        <div>
                            <label htmlFor="password-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input
                                id="password-modal" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors disabled:bg-gray-400" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : (isLoginView ? 'Login' : 'Create Account')}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-6">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button onClick={switchView} className="font-semibold text-primary hover:underline">
                            {isLoginView ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </Card>
            </div>
        </div>
    );
};

export default AuthModal;