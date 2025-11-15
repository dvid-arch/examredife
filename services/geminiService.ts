import apiService from './apiService.ts';
import { ChatMessage } from '../types.ts';


export const sendMessageToAI = async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
        const response = await apiService<{ reply: string }>('/ai/chat', {
            method: 'POST',
            body: { message, history },
        });
        return response.reply;
    } catch (error) {
        console.error("Error sending message via backend:", error);
        return (error as Error).message || "I'm having trouble connecting right now. Please try again later.";
    }
};

export const generateStudyGuide = async (subject: string, topic: string): Promise<string> => {
    try {
        const response = await apiService<{ guide: string }>('/ai/generate-guide', {
            method: 'POST',
            body: { subject, topic },
        });
        return response.guide;
    } catch (error) {
        console.error("Error generating study guide via backend:", error);
        return (error as Error).message || "Sorry, I encountered an error while generating the study guide.";
    }
};

export const researchTopic = async (searchType: 'university' | 'course', query: string): Promise<string> => {
    try {
        const response = await apiService<{ result: string }>('/ai/research', {
            method: 'POST',
            body: { searchType, query },
        });
        return response.result;
    } catch (error) {
        console.error("Error researching topic via backend:", error);
        return (error as Error).message || "I'm having trouble connecting right now. Please try again later.";
    }
};
