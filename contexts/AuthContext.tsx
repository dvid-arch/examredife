import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthModal, { AuthDetails } from '../components/AuthModal.tsx';
import UpgradeModal, { UpgradeRequest } from '../components/UpgradeModal.tsx';
import { User } from '../types.ts';
import apiService from '../services/apiService.ts';

// The User type from backend might be slightly different.
// The backend returns this from /profile
export interface UserProfile extends User {
    id: string;
    email: string;
    role: 'user' | 'admin';
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
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const fetchUserProfile = async () => {
        try {
            const profile = await apiService<UserProfile>('/auth/profile');
            setUser(profile);
            setIsAuthenticated(true);
            localStorage.setItem('examRediUser', JSON.stringify(profile));
            return profile;
        } catch (error) {
            // If the failure is a network error (backend down / proxy ECONNREFUSED),
            // don't immediately log out the user — just return null and keep client state.
            const msg = (error && (error as any).message) || '';
            const isNetworkError = /failed to fetch|networkerror|ec[oa]nnrefused/i.test(msg);
            console.error("Failed to fetch user profile.", error);
            if (isNetworkError) {
                // Don't clear local session on transient network/backend errors.
                // Just return null; callers should handle null profile.
                return null;
            }

            // For other errors (e.g., 401/403), perform logout to clear invalid session
            await logout();
            return null;
        }
    };

    // Check for persisted user token on initial load
    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            const refreshToken = localStorage.getItem('refreshToken');

            if (token && refreshToken) {
                await fetchUserProfile();
            }
            
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    // When the user returns to the tab or the window gains focus, try to refresh profile
    // This helps avoid being unexpectedly logged out after the access token expires while the tab was inactive.
    useEffect(() => {
        const handleVisibilityOrFocus = () => {
            if (document.visibilityState === 'visible') {
                const token = localStorage.getItem('authToken');
                const refreshToken = localStorage.getItem('refreshToken');
                if (token && refreshToken) {
                    // attempt to refresh profile (apiService will rotate tokens if needed)
                    fetchUserProfile().catch(() => { /* ignore errors here — fetchUserProfile will handle logout */ });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
            window.removeEventListener('focus', handleVisibilityOrFocus);
        };
    }, []);

    const handleAuthSuccess = (data: any, navigatePath = '/dashboard') => {
        const { accessToken, refreshToken, ...userData } = data;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        localStorage.setItem('examRediUser', JSON.stringify(userData));
        localStorage.setItem('authToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        setIsAuthModalOpen(false);
        setIsLoading(false);
        
        if (userData.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            navigate(navigatePath);
        }
    };

    const login = async (details: AuthDetails) => {
        setIsLoading(true);
        try {
            const data = await apiService('/auth/login', {
                method: 'POST',
                body: details,
                useAuth: false,
            });
            handleAuthSuccess(data);
        } catch (error) {
            // Clear any stale user data and tokens on failed login
            localStorage.removeItem('examRediUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
            // Optionally, show error to user (could use a toast/alert)
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (details: AuthDetails) => {
        setIsLoading(true);
        try {
            const data = await apiService('/auth/register', {
                method: 'POST',
                body: details,
                useAuth: false,
            });
            handleAuthSuccess(data);
        } catch (error) {
            // Clear any stale user data and tokens on failed register
            localStorage.removeItem('examRediUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsAuthenticated(false);
            // Optionally, show error to user (could use a toast/alert)
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Invalidate the refresh token on the backend
            await apiService('/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error("Logout failed on backend, clearing client session anyway.", error);
        } finally {
            localStorage.removeItem('examRediUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
            setIsAuthenticated(false);
            setUser(null);
            navigate('/dashboard');
        }
    };
    
    const requestLogin = () => {
        setIsAuthModalOpen(true);
    };

    const requestUpgrade = (request: UpgradeRequest) => {
        setUpgradeRequest(request);
        setIsUpgradeModalOpen(true);
    };
    
    const upgradeToPro = async () => {
        if (user) {
            try {
                // In a real app, this would trigger a payment flow.
                // Here we just update the user's status on the backend.
                const updatedUser = await apiService<UserProfile>(`/admin/users/${user.id}/subscription`, {
                    method: 'PUT',
                    body: { subscription: 'pro' }
                });
                setUser(updatedUser);
                localStorage.setItem('examRediUser', JSON.stringify(updatedUser));
                setIsUpgradeModalOpen(false);
            } catch (error) {
                 console.error("Failed to upgrade user:", error);
                 alert("Could not complete upgrade. Please try again.");
            }
        }
    };

    const updateUser = async (details: Partial<UserProfile>) => {
        // This is a local-only update for now as there's no backend endpoint for it.
        if (user) {
            const updatedUser = { ...user, ...details };
            setUser(updatedUser);
            localStorage.setItem('examRediUser', JSON.stringify(updatedUser));
        }
    };

    const useAiCredit = async () => {
        // Credit usage is handled on the backend during the API call.
        // We refetch the profile to get the latest credit count.
        await fetchUserProfile();
    };
    
    const incrementMessageCount = async (): Promise<{ success: boolean; remaining: number }> => {
        // Message count is handled on the backend. We refetch the profile.
        const updatedProfile = await fetchUserProfile();
        if(!updatedProfile) return { success: false, remaining: 0 };
        
        if (updatedProfile.subscription === 'pro') return { success: true, remaining: Infinity };
        
        const FREE_TIER_MESSAGES = 5;
        const remaining = FREE_TIER_MESSAGES - updatedProfile.dailyMessageCount;
        
        return { success: remaining > 0, remaining };
    };

    const value = { isAuthenticated, user, login, register, logout, requestLogin, requestUpgrade, upgradeToPro, updateUser, useAiCredit, incrementMessageCount, isLoading };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {!isLoading && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
            <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} request={upgradeRequest} />
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