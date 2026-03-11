
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Card from './Card.tsx';
import apiService from '../services/apiService.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import { API_BASE_URL } from '../config.ts';

export interface AuthDetails {
    name?: string;
    email: string;
    password?: string;
    referralCode?: string;
}

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const Logo = () => (
    <div className="flex items-center justify-center mb-6 select-none">
        <div className="font-black text-3xl tracking-tight flex items-center" style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
            <span className="text-slate-700 dark:text-slate-100">Exam</span>
            <span className="text-blue-500">R</span>
            <span className="text-red-400">e</span>
            <span className="text-yellow-400">d</span>
            <span className="text-green-500">i</span>
        </div>
    </div>
);

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { login, register } = useAuth();
    const [view, setView] = useState<'login' | 'register' | 'forgot'>('login'); // Changed from isLoginView to view
    const [error, setError] = useState<string | null>(null);
    const [infoMessage, setInfoMessage] = useState<string | null>(null); // Added infoMessage state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register: registerField, handleSubmit, formState: { errors }, reset, watch } = useForm<AuthDetails>();

    // Watch password for real-time validation
    const passwordValue = watch("password", "");

    const getPasswordStrength = (pwd: string | undefined) => {
        if (!pwd) return { hasLength: false, hasNumber: false, hasUpperOrSymbol: false };
        return {
            hasLength: pwd.length >= 8,
            hasNumber: /\d/.test(pwd),
            hasUpperOrSymbol: /[A-Z@$!%*#?&]/.test(pwd)
        };
    };

    const strength = getPasswordStrength(passwordValue);
    const isStrengthValid = strength.hasLength && strength.hasNumber && strength.hasUpperOrSymbol;

    const onSubmit = async (data: AuthDetails) => {
        setError(null);
        setInfoMessage(null); // Clear infoMessage on submit
        setIsSubmitting(true);
        try {
            if (view === 'login') { // Updated conditional
                await login(data);
            } else if (view === 'register') { // Updated conditional
                if (!isStrengthValid) {
                    throw new Error("Please meet all password requirements.");
                }
                await register(data);
            } else if (view === 'forgot') { // Added forgot password logic
                // Call forgot password API
                await apiService('/auth/forgotpassword', {
                    method: 'POST',
                    body: { email: data.email },
                    useAuth: false
                });
                setInfoMessage('Password reset email sent! Please check your inbox.');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchView = (newView: 'login' | 'register' | 'forgot') => { // Updated to accept newView
        setView(newView);
        setError(null);
        setInfoMessage(null); // Clear infoMessage when switching views
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
                        {view === 'login' ? 'Welcome Back!' : view === 'register' ? 'Create Your Account' : 'Reset Password'} {/* Updated text based on view */}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                        {view === 'login' ? 'Login to save your progress and track performance.' :
                            view === 'register' ? 'Join to start your journey to exam success!' :
                                'Enter your email to receive a password reset link.'} {/* Updated text based on view */}
                    </p>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href = `${API_BASE_URL}/auth/google`;
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-700"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">Or continue with email</span>
                            </div>
                        </div>

                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                                <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                            </div>
                        )}
                        {infoMessage && ( // Added infoMessage display
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                                <p className="text-green-600 dark:text-green-400 text-sm text-center font-medium">{infoMessage}</p>
                            </div>
                        )}

                        {view === 'register' && (
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
                                autoComplete={view === 'login' ? "username" : "email"}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        {view !== 'forgot' && (
                            <div>
                                <label htmlFor="password-modal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        {...registerField("password", {
                                            required: "Password is required",
                                            minLength: view === 'login' ? undefined : { value: 8, message: "Password must be at least 8 characters" }
                                        })}
                                        id="password-modal"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                                        autoComplete={view === 'login' ? "current-password" : "new-password"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}

                                {view === 'register' && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password requirements:</p>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className={`px-2 py-1 rounded-md border ${strength.hasLength ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                8+ Characters
                                            </span>
                                            <span className={`px-2 py-1 rounded-md border ${strength.hasNumber ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                Number
                                            </span>
                                            <span className={`px-2 py-1 rounded-md border ${strength.hasUpperOrSymbol ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                Uppercase/Symbol
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {view === 'login' && (
                            <div className="flex justify-end">
                                <button type="button" onClick={() => switchView('forgot')} className="text-sm text-primary hover:underline">
                                    Forgot Password?
                                </button>
                            </div>
                        )}

                        <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors disabled:bg-gray-400" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : (view === 'login' ? 'Login' : view === 'register' ? 'Create Account' : 'Send Reset Link')}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-600 dark:text-slate-300 mt-6">
                        {view === 'login' ? "Don't have an account?" : view === 'register' ? "Already have an account?" : "Remember your password?"}{' '}
                        <button onClick={() => switchView(view === 'login' ? 'register' : 'login')} className="font-semibold text-primary hover:underline">
                            {view === 'login' ? 'Sign Up' : 'Login'}
                        </button>
                    </p>
                </Card>
            </div>
        </div>
    );
};
export default AuthModal;