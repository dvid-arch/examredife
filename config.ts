// In production, this should point to the Render backend.
// In development, it defaults to '/api' which is handled by the Vite proxy.
const rawBaseUrl = (import.meta as any).env.VITE_API_URL || '/api';
// Ensure that if a full URL is provided, it handles the /api suffix correctly
export const API_BASE_URL = rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api')
    ? `${rawBaseUrl}/api`
    : rawBaseUrl;

