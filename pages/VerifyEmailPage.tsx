import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService';

const VerifyEmailPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                await apiService(`/auth/verifyemail/${token}`, { method: 'PUT', useAuth: false });
                setStatus('success');
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. The link may be expired.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verifying Email...</h2>
                        <p className="text-slate-600 dark:text-slate-300">Please wait while we secure your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Email Verified!</h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">Your account is now fully active.</p>
                        <Link to="/dashboard?auth=login" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-accent transition-colors">
                            Go to Dashboard
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Verification Failed</h2>
                        <p className="text-red-500 mb-6">{message}</p>
                        <Link to="/dashboard" className="text-primary hover:underline font-medium">
                            Return to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
