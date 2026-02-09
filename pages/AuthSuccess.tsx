import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const AuthSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithTokens } = useAuth();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            // This function should be added to AuthContext.tsx
            loginWithTokens(accessToken, refreshToken);
            navigate('/dashboard');
        } else {
            navigate('/login?error=auth_failed');
        }
    }, [searchParams, navigate, loginWithTokens]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Completing sign in...</p>
            </div>
        </div>
    );
};

export default AuthSuccess;
