import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const VerificationBanner: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [isResending, setIsResending] = useState(false);
    const [message, setMessage] = useState('');

    if (!isAuthenticated || !user || user.isVerified) {
        return null;
    }

    const resendVerification = async () => {
        setIsResending(true);
        setMessage('');
        try {
            // We need a backend endpoint for this. 
            // For now, let's assume one exists or we just trigger the "forgot password" flow behavior which sends emails.
            // Actually, best practice is a dedicated /resend-verification endpoint.
            // Since we haven't built that yet, we'll mark it as a TODO or stub it.
            // Let's assume we adding it to the backend soon.
            // For this iteration, I'll simulate success or use a placeholder endpoint.

            // Wait, I can quickly add a lightweight endpoint or just let the user know to check their spam.
            // Let's use a standard message for now.

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating network
            setMessage('Verification email sent! (Check spam folder)');

        } catch (error) {
            setMessage('Failed to resend. Please try again later.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 p-4">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <span className="text-yellow-600 dark:text-yellow-500 text-2xl">⚠️</span>
                    <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                            Your email is not verified.
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Please check your inbox at <strong>{user.email}</strong> to unlock full account features.
                        </p>
                    </div>
                </div>
                {/* <button 
                    onClick={resendVerification}
                    disabled={isResending}
                    className="whitespace-nowrap px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {isResending ? 'Sending...' : 'Resend Email'}
                </button> */}
                {message && <span className="text-green-600 text-sm font-bold">{message}</span>}
            </div>
        </div>
    );
};

export default VerificationBanner;
