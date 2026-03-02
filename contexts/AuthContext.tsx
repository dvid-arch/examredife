import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useUser, useAuth, useSignIn, useSignUp } from '@clerk/clerk-react';
import AuthModal, { AuthDetails } from '../components/AuthModal.tsx';
import UpgradeModal, { UpgradeRequest } from '../components/UpgradeModal.tsx';
import { useToasts } from './ToastContext.tsx';
import { User } from '../types.ts';
import apiService from '../services/apiService.ts';

// The User type from backend might be slightly different.
export interface UserProfile extends User {
    id: string;
    email: string;
    role: 'user' | 'admin';
    isVerified?: boolean;
}

interface AuthContextType {
    isAuthenticated: boolean;
    user: UserProfile | null;
    login: (details: AuthDetails) => Promise<void>;
    register: (details: AuthDetails) => Promise<void>;
    logout: () => void;
    requestLogin: () => void;
    requestUpgrade: (request: UpgradeRequest) => void;
    upgradeToPro: () => void;
    updateUser: (details: Partial<UserProfile>) => Promise<void>;
    useAiCredit: () => Promise<void>;
    incrementMessageCount: () => Promise<{ success: boolean; remaining: number }>;
    loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
    isLoading: boolean;
    justRegistered: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoaded: isClerkLoaded, user: clerkUser } = useUser();
    const { isLoaded: isAuthLoaded, isSignedIn, signOut, getToken } = useAuth();
    const { signIn, isLoaded: isSignInLoaded } = useSignIn();
    const { signUp, isLoaded: isSignUpLoaded } = useSignUp();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
    const [justRegistered, setJustRegistered] = useState(false);
    const { success, error: toastError } = useToasts();

    const isLoading = !isClerkLoaded || !isAuthLoaded;

    // Map Clerk user to UserProfile
    useEffect(() => {
        if (isSignedIn && clerkUser) {
            const profile: UserProfile = {
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                role: (clerkUser.publicMetadata.role as 'user' | 'admin') || 'user',
                firstName: clerkUser.firstName || '',
                lastName: clerkUser.lastName || '',
                isVerified: !!clerkUser.emailAddresses.find(e => e.emailAddress === clerkUser.primaryEmailAddress?.emailAddress)?.verification.status === 'verified',
                // Keep other fields from metadata if they exist
                ...(clerkUser.publicMetadata as any)
            };
            setUser(profile);
            localStorage.setItem('examRediUser', JSON.stringify(profile));

            // Sync with backend on first load if needed
            fetchBackendUserProfile();
        } else {
            setUser(null);
            localStorage.removeItem('examRediUser');
        }
    }, [isSignedIn, clerkUser]);

    const fetchBackendUserProfile = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const profile = await apiService<UserProfile>('/auth/profile');
            // Merge backend metadata (credits, etc.) with Clerk user data
            setUser(prev => prev ? { ...prev, ...profile } : profile);
        } catch (error) {
            console.error("Failed to sync profile with backend", error);
        }
    };

    // Listen for ?auth=login or ?auth=register in the URL to auto-open the modal
    useEffect(() => {
        if (isLoading) return;

        // Since we use HashRouter, the query params are often after the #
        const hash = window.location.hash;
        const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(queryPart || window.location.search);
        const authAction = params.get('auth');

        if (authAction === 'login' && !isSignedIn && !isAuthModalOpen) {
            window.history.pushState({ modal: 'auth' }, '');
            setIsAuthModalOpen(true);

            // Clean up the URL by removing the auth param
            const newParams = new URLSearchParams(params);
            newParams.delete('auth');
            const newQuery = newParams.toString();
            const basePath = hash.split('?')[0];
            window.location.hash = newQuery ? `${basePath}?${newQuery}` : basePath;
        }
    }, [isLoading, isSignedIn, isAuthModalOpen]);

    const login = async (details: AuthDetails) => {
        if (!isSignInLoaded) return;
        try {
            const result = await signIn.create({
                identifier: details.email,
                password: details.password,
            });

            if (result.status === "complete") {
                setIsAuthModalOpen(false);
                window.location.hash = '#/dashboard';
            } else {
                console.log("Incomplete login:", result);
                throw new Error("Additional verification required. Please use the login page.");
            }
        } catch (error: any) {
            console.error('Login error:', error);
            throw new Error(error.errors?.[0]?.message || 'Login failed');
        }
    };

    const register = async (details: AuthDetails) => {
        if (!isSignUpLoaded) return;
        try {
            const result = await signUp.create({
                emailAddress: details.email,
                password: details.password,
            });

            // In a real flow, Clerk might require email verification here.
            // For now, assume simple complete or handled by Clerk component.
            if (result.status === "complete") {
                setJustRegistered(true);
                setIsAuthModalOpen(false);
                window.location.hash = '#/dashboard';
            } else {
                throw new Error("Registration started. Check your email for verification.");
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            throw new Error(error.errors?.[0]?.message || 'Registration failed');
        }
    };

    const logout = async () => {
        await signOut();
        window.location.hash = '#/dashboard';
    };

    const requestLogin = () => {
        if (!isAuthModalOpen) {
            window.history.pushState({ modal: 'auth' }, '');
            setIsAuthModalOpen(true);
        }
    };

    const requestUpgrade = (request: UpgradeRequest) => {
        setUpgradeRequest(request);
        if (!isUpgradeModalOpen) {
            window.history.pushState({ modal: 'upgrade' }, '');
            setIsUpgradeModalOpen(true);
        }
    };

    const upgradeToPro = async () => {
        console.log("Upgrade requested.");
    };

    const updateUser = async (details: Partial<UserProfile>) => {
        if (user) {
            try {
                // Update in backend
                const updatedUser = await apiService<UserProfile>('/user/profile', {
                    method: 'PUT',
                    body: details
                });
                setUser(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
            } catch (error) {
                console.error("Failed to update user profile on backend:", error);
                setUser(prev => prev ? { ...prev, ...details } : null);
            }
        }
    };

    const useAiCredit = async () => {
        await fetchBackendUserProfile();
    };

    const incrementMessageCount = async (): Promise<{ success: boolean; remaining: number }> => {
        await fetchBackendUserProfile();
        if (!user) return { success: false, remaining: 0 };
        if (user.subscription === 'pro') return { success: true, remaining: Infinity };

        const FREE_TIER_MESSAGES = 5;
        const remaining = FREE_TIER_MESSAGES - (user.dailyMessageCount || 0);
        return { success: remaining > 0, remaining };
    };

    const loginWithTokens = async (accessToken: string, refreshToken: string) => {
        // NO LONGER USED with Clerk
        console.warn("loginWithTokens is legacy and not supported with Clerk.");
    };

    const value = {
        isAuthenticated: !!isSignedIn,
        user,
        login,
        register,
        logout,
        requestLogin,
        requestUpgrade,
        upgradeToPro,
        updateUser,
        useAiCredit,
        incrementMessageCount,
        loginWithTokens,
        isLoading,
        justRegistered
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {!isLoading && (
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => {
                        if (isAuthModalOpen) {
                            window.history.back();
                            setIsAuthModalOpen(false);
                        }
                    }}
                />
            )}
            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => {
                    if (isUpgradeModalOpen) {
                        window.history.back();
                        setIsUpgradeModalOpen(false);
                    }
                }}
                request={upgradeRequest}
            />
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};