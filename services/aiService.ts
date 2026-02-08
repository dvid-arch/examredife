import apiService from './apiService.ts';
import { ChatMessage } from '../types.ts';



const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    try {
        return await fn();
    } catch (error: any) {
        if (retries === 0) throw error;

        // Don't retry client errors (4xx) except 429
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw error;
        }

        console.log(`Retrying AI request... Attempts left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 2);
    }
};

export const sendMessageToAI = async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
        const response = await withRetry(() => apiService<{ reply: string }>('/ai/chat', {
            method: 'POST',
            body: { message, history },
        }));
        return response.reply;
    } catch (error) {
        console.error("Error sending message via backend:", error);
        throw error; // Let UI handle the error message
    }
};

export const generateStudyGuide = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await withRetry(() => apiService<{ guide: string }>('/ai/generate-guide', {
            method: 'POST',
            body: { subject, topic },
        }));
        return response.guide;
    } catch (error) {
        console.error("Error generating study guide via backend:", error);
        throw error;
    }
};

export const researchTopic = async (searchType: 'university' | 'course', query: string): Promise<string> => {
    try {
        const response = await withRetry(() => apiService<{ result: string }>('/ai/research', {
            method: 'POST',
            body: { searchType, query },
        }));
        return response.result;
    } catch (error) {
        console.error("Error researching topic via backend:", error);
        throw error;
    }
};