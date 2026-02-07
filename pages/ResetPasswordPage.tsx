import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import apiService from '../services/apiService';
import Card from '../components/Card';
import { AuthDetails } from '../components/AuthModal';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<AuthDetails>();
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
        if (!isStrengthValid) {
            setError("Please meet all password requirements.");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await apiService(`/auth/resetpassword/${token}`, {
                method: 'PUT',
                body: { password: data.password },
                useAuth: false
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/dashboard?auth=login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to reset password. Token may be invalid or expired.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Reset!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">Your password has been updated successfully. Redirecting you to login...</p>
                    <Link to="/dashboard?auth=login" className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-accent transition-colors">
                        Go to Login
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full p-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white text-center mb-2">Reset Password</h1>
                <p className="text-slate-600 dark:text-slate-300 text-center mb-6">
                    Enter your new password below.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                            <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="password-reset" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: { value: 8, message: "Password must be at least 8 characters" }
                                })}
                                id="password-reset"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
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

                        <div className="mt-3 space-y-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password requirements:</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full border ${strength.hasLength ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    8+ Characters
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${strength.hasNumber ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    Number
                                </span>
                                <span className={`px-2 py-1 rounded-full border ${strength.hasUpperOrSymbol ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                    Uppercase/Symbol
                                </span>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors disabled:bg-gray-400" disabled={isSubmitting}>
                        {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
