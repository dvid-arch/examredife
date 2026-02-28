import { API_BASE_URL } from '../config.ts';

const getAccessToken = () => localStorage.getItem('authToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

interface RequestOptions extends RequestInit {
    body?: any;
    useAuth?: boolean;
}

// Singleton state for token refresh
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });

    failedQueue = [];
};

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

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000); // 30s timeout
    config.signal = controller.signal;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        clearTimeout(id);

        if (!response.ok) {
            // Handle token refresh on 401 Unauthorized (Expired or Invalid Token)
            if (response.status === 401 && !isRetry && endpoint !== '/auth/refresh' && useAuth) {
                if (isRefreshing) {
                    // Queue the request if a refresh is already in progress
                    return new Promise<T>((resolve, reject) => {
                        failedQueue.push({
                            resolve: (token: string) => {
                                // Update header with new token
                                if (options.headers) {
                                    (options.headers as any)['Authorization'] = `Bearer ${token}`;
                                } else {
                                    options.headers = { 'Authorization': `Bearer ${token}` };
                                }
                                // Retry request
                                resolve(apiService<T>(endpoint, options, true));
                            },
                            reject
                        });
                    });
                }

                isRefreshing = true;

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

                    console.log('Refresh token response status:', refreshResponse.status);

                    if (!refreshResponse.ok) {
                        // If refresh fails, logout
                        console.error("Session expired. Please log in again. Refresh response:", refreshResponse.status, refreshResponse.statusText);
                        processQueue(new Error("Session expired."));

                        // Dispatch event for UI to handle (e.g. show login modal)
                        window.dispatchEvent(new CustomEvent('auth:session-expired'));

                        throw new Error("Session expired. Please log in again.");
                    }

                    const newTokens = await refreshResponse.json();
                    localStorage.setItem('authToken', newTokens.accessToken);
                    localStorage.setItem('refreshToken', newTokens.refreshToken);

                    // Process queued requests with new token
                    processQueue(null, newTokens.accessToken);

                    // Retry the original request with the new token
                    return apiService<T>(endpoint, options, true);

                } catch (error) {
                    console.error("Session refresh failed:", error);
                    processQueue(error);
                    // Dispatch event for UI to handle
                    window.dispatchEvent(new CustomEvent('auth:session-expired'));
                    throw error;
                } finally {
                    isRefreshing = false;
                }
            }

            const responseData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('API Error:', {
                endpoint,
                status: response.status,
                statusText: response.statusText,
                responseData,
                fullError: responseData
            });
            let errorMsg = responseData.message || 'An API error occurred';
            if (responseData.error) errorMsg += ` (${responseData.error})`;
            if (responseData.path) errorMsg += ` [Path: ${responseData.path}]`;
            throw new Error(errorMsg);
        }

        // For 204 No Content, response.json() will fail. Handle it gracefully.
        if (response.status === 204) {
            return {} as T;
        }

        return response.json() as Promise<T>;

    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection.');
        }
        throw error;
    }
};

export default apiService;