import React from 'react';
import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import Card from './Card.tsx';

const ErrorBoundary: React.FC = () => {
    const error = useRouteError();
    const navigate = useNavigate();

    console.error('Unhandled Route Error:', error);

    let errorMessage = "An unexpected error occurred.";
    let errorTitle = "Oops! Something went wrong";

    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            errorTitle = "Page Not Found";
            errorMessage = "Sorry, the page you're looking for doesn't exist.";
        } else if (error.status === 401) {
            errorTitle = "Unauthorized";
            errorMessage = "Please sign in to access this page.";
        } else if (error.status === 503) {
            errorTitle = "Service Unavailable";
            errorMessage = "Our servers are currently busy. Please try again later.";
        }
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
            <Card className="max-w-md w-full text-center p-8 shadow-2xl border-t-4 border-red-500">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{errorTitle}</h1>
                <p className="text-slate-600 dark:text-slate-400 mb-8">{errorMessage}</p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition-all"
                    >
                        Try Refreshing
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-slate-600 dark:text-slate-300 font-semibold py-2 hover:text-primary transition-colors"
                    >
                        Return to Dashboard
                    </button>
                </div>

                {process.env.NODE_ENV === 'development' && error instanceof Error && (
                    <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                        <p className="text-xs font-mono text-slate-400 break-all leading-relaxed bg-slate-50 dark:bg-slate-900 p-3 rounded">
                            {error.stack}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default ErrorBoundary;
