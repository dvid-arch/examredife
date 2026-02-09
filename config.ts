// In production, this should point to the Render backend.
// In development, it defaults to '/api' which is handled by the Vite proxy.
export const API_BASE_URL = (import.meta as any).env.VITE_API_URL || '/api';

