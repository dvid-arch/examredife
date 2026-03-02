import React from 'react';
import { SignIn, SignUp } from "@clerk/clerk-react";
import Card from './Card.tsx';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialView?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialView = 'login' }) => {
    const [view, setView] = React.useState<'login' | 'register'>(initialView);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div className="max-w-md w-full my-4 sm:my-0 relative" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-white hover:text-slate-200 transition-colors z-50"
                    aria-label="Close modal"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-col items-center">
                    {view === 'login' ? (
                        <SignIn
                            routing="hash"
                            signUpUrl="/#register"
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-2xl border-none dark:bg-slate-900",
                                    headerTitle: "dark:text-white",
                                    headerSubtitle: "dark:text-slate-400",
                                    socialButtonsBlockButton: "dark:bg-slate-800 dark:border-slate-700 dark:text-white",
                                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                                    footerActionLink: "text-blue-500 hover:text-blue-600",
                                    dividerLine: "dark:bg-slate-700",
                                    dividerText: "dark:text-slate-400",
                                    formFieldLabel: "dark:text-slate-300",
                                    formFieldInput: "dark:bg-slate-800 dark:border-slate-700 dark:text-white",
                                    footer: "hidden" // Hide footer to use our own switch logic if preferred, or keep it
                                }
                            }}
                        />
                    ) : (
                        <SignUp
                            routing="hash"
                            signInUrl="/#login"
                            appearance={{
                                elements: {
                                    rootBox: "w-full",
                                    card: "shadow-2xl border-none dark:bg-slate-900",
                                    headerTitle: "dark:text-white",
                                    headerSubtitle: "dark:text-slate-400",
                                    socialButtonsBlockButton: "dark:bg-slate-800 dark:border-slate-700 dark:text-white",
                                    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                                    footerActionLink: "text-blue-500 hover:text-blue-600",
                                    dividerLine: "dark:bg-slate-700",
                                    dividerText: "dark:text-slate-400",
                                    formFieldLabel: "dark:text-slate-300",
                                    formFieldInput: "dark:bg-slate-800 dark:border-slate-700 dark:text-white",
                                    footer: "hidden"
                                }
                            }}
                        />
                    )}

                    <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
                            <button
                                onClick={() => setView(view === 'login' ? 'register' : 'login')}
                                className="font-semibold text-blue-500 hover:underline"
                            >
                                {view === 'login' ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
