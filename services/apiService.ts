import { API_BASE_URL } from '../config.ts';

interface RequestOptions extends RequestInit {
    body?: any;
    useAuth?: boolean;
}

const apiService = async <T>(endpoint: string, options: RequestOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {}, useAuth = true } = options;

    const config: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
    };

    if (useAuth) {
        let token: string | null = null;

        // Try to get token from Clerk if available
        if ((window as any).Clerk?.session) {
            try {
                token = await (window as any).Clerk.session.getToken();
            } catch (e) {
                console.error("Error getting Clerk token:", e);
            }
        }

        // Fallback to localStorage (Legacy)
        if (!token) {
            token = localStorage.getItem('authToken');
        }

        if (token) {
            (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    config.signal = controller.signal;

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 401 && useAuth) {
                console.warn('Session expired or unauthorized.');
                // Dispatch event for UI to handle (e.g. show login modal)
                window.dispatchEvent(new CustomEvent('auth:session-expired'));
                throw new Error("Session expired. Please log in again.");
            }

            const responseData = await response.json().catch(() => ({ message: response.statusText }));
            console.error('API Error:', {
                endpoint,
                status: response.status,
                statusText: response.statusText,
                responseData,
            });
            let errorMsg = responseData.message || 'An API error occurred';
            if (responseData.error) errorMsg += ` (${responseData.error})`;
            throw new Error(errorMsg);
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json() as Promise<T>;

    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection.');
        }
        throw error;
    }
};

export default apiService;