import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const VerificationBanner: React.FC = () => {
    const { user, isAuthenticated, justRegistered } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');

    if (!isAuthenticated || !user || user.isVerified) {
        return null;
    }

    const resendVerification = async () => {
        setIsResending(true);
        setMessage('');
        try {
            await apiService('/auth/resend-verification', {
                method: 'POST',
            });
            setMessage('Verification email sent! (Check spam folder)');
        } catch (error: any) {
            setMessage(error.message || 'Failed to resend. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-yellow-600 dark:text-yellow-500 text-2xl">
                        {justRegistered ? '🎉' : '⚠️'}
                    </span>
                    <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            {justRegistered ? 'Welcome to ExamRedi!' : 'Your email is not verified.'}
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            {justRegistered
                                ? `We've sent a verification email to `
                                : 'Please check your inbox at '
                            }
                            <strong>{user.email}</strong> to unlock full account features.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {message && (
                        <span className={`text-sm font-bold ${message.includes('sent') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {message}
                        </span>
                    )}
                    <button
                        onClick={resendVerification}
                        disabled={isResending}
                        className="whitespace-nowrap px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isResending ? 'Sending...' : 'Resend Email'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VerificationBanner;
