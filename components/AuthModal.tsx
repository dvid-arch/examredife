
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
            <rect x="4" y="4" width="12" height="3" rx="1.5" fill="#3B82F6" />
            <rect x="4" y="9" width="18" height="3" rx="1.5" fill="#EF4444" />
            <rect x="4" y="14" width="10" height="3" rx="1.5" fill="#FACC15" />
            <rect x="4" y="19" width="15" height="3" rx="1.5" fill="#22C55E" />
        </svg>
        <span className="font-bold text-2xl text-slate-800 dark:text-white">ExamRedi</span>
    </div>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, register } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register: registerField, handleSubmit, formState: { errors }, reset } = useForm<AuthDetails>();

    const onSubmit = async (data: AuthDetails) => {
        setError(null);
        setIsSubmitting(true);
        try {
            if (isLoginView) {
                await login(data);
            } else {
                await register(data);
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
        reset();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto" onClick={(e) => { if (!isSubmitting) onClose(); }}>
            <div className="max-w-md w-full my-4 sm:my-0" onClick={e => e.stopPropagation()}>
                <Card className="p-6 sm:p-8">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => { if (!isSubmitting) onClose(); }}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Close modal"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {/* <Logo /> */}
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-1">
                        {isLoginView ? 'Welcome Back!' : 'Create Your Account'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                        {isLoginView ? 'Login to save your progress and track performance.' : 'Join to start your journey to exam success!'}
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                                <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                            </div>
                        )}
                        {!isLoginView && (
                            <div>
                                <label htmlFor="name-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input
                                    {...registerField("name", { required: "Full name is required" })}
                                    id="name-modal" type="text"
                                    placeholder="John Doe"
                                    className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoComplete="name"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                            <input
                                {...registerField("email", {
                                    required: "Email is required",
                                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email address" }
                                })}
                                id="email-modal" type="email"
                                placeholder="you@example.com"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                autoComplete={isLoginView ? "username" : "email"}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                            {isLoginView && <p className="text-xs text-slate-500 mt-1 text-center">Hint: Use 'pro@examredi.com' and any password for the Pro account.</p>}
                        </div>
                        <div>
                            <label htmlFor="password-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                            <input
                                {...registerField("password", {
                                    required: "Password is required",
                                    minLength: isLoginView ? undefined : { value: 6, message: "Password must be at least 6 characters" }
                                })}
                                id="password-modal" type="password"
                                placeholder="••••••••"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                autoComplete={isLoginView ? "current-password" : "new-password"}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
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