import { API_BASE_URL } from '../config.ts';

const getAccessToken = () => localStorage.getItem('authToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

interface RequestOptions extends RequestInit {
    body?: any;
    useAuth?: boolean;
}

const apiService = async <T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> => {
    const { method = 'GET', body, headers = {}, useAuth = true } = options;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (useAuth) {
        const token = getAccessToken();
        if (token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        // Handle token refresh on 401 Unauthorized
        if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh' && useAuth) {
            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) {
                    throw new Error("No refresh token available.");
                }

                const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken }),
                });

                if (!refreshResponse.ok) {
                     // If refresh fails, logout
                    console.error("Session expired. Please log in again.");
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('examRediUser');
                    window.location.href = '/'; // Full page reload to reset state
                    throw new Error("Session expired. Please log in again.");
                }

                const newTokens = await refreshResponse.json();
                localStorage.setItem('authToken', newTokens.accessToken);
                localStorage.setItem('refreshToken', newTokens.refreshToken);

                // Retry the original request with the new token
                return apiService<T>(endpoint, options, true);

            } catch (error) {
                console.error("Session refresh failed:", error);
                // Force logout by clearing all auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('examRediUser');
                window.location.href = '/'; 
                throw error;
            }
        }

        const responseData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(responseData.message || 'An API error occurred');
    }
    
    // For 204 No Content, response.json() will fail. Handle it gracefully.
    if (response.status === 204) {
        return {} as T;
    }

    return response.json() as Promise<T>;
};

export default apiService;