import { useState, useCallback, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const heartbeatInterval = useRef<number | null>(null);
    const chunksRef = useRef<string[]>([]);
    const currentChunkIndex = useRef(0);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
            heartbeatInterval.current = null;
        }
        setIsSpeaking(false);
        setIsPaused(false);
        chunksRef.current = [];
        currentChunkIndex.current = 0;
    }, []);

    const playNextChunk = useCallback(() => {
        if (currentChunkIndex.current >= chunksRef.current.length) {
            stop();
            return;
        }

        const text = chunksRef.current[currentChunkIndex.current];
        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('en'))
            || voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            currentChunkIndex.current++;
            playNextChunk();
        };

        utterance.onerror = (e) => {
            console.error('Speech synthesis error:', e);
            stop();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, [stop]);

    const speak = useCallback((text: string) => {
        stop();

        // Remove markdown formatting and improve LaTeX reading
        const cleanText = text
            .replace(/\\times/g, ' times ')
            .replace(/\\div/g, ' divided by ')
            .replace(/\\pm/g, ' plus or minus ')
            .replace(/\\neq/g, ' not equal to ')
            .replace(/\\approx/g, ' approximately ')
            .replace(/\\le/g, ' less than or equal to ')
            .replace(/\\ge/g, ' greater than or equal to ')
            .replace(/\$/g, '') // Remove LaTeX delimiters
            .replace(/\{([^}]+)\}/g, '$1') // Remove LaTeX braces but keep content
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
            .replace(/[#*`_~]/g, '') // Remove basic markdown
            .replace(/\n+/g, ' '); // Replace newlines with spaces

        // Chunking: Split into sentences or max ~200 characters
        // This prevents Chrome's silence-after-15s bug and 4000 char limits
        const sentences = cleanText.split(/([.!?]+\s+)/);
        const chunks: string[] = [];
        let currentChunk = '';

        for (const part of sentences) {
            if (currentChunk.length + part.length > 200) {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = part;
            } else {
                currentChunk += part;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        chunksRef.current = chunks;
        currentChunkIndex.current = 0;
        setIsSpeaking(true);

        // Heartbeat to keep speech synthesis alive in some browsers (Chrome bug)
        if (!heartbeatInterval.current) {
            heartbeatInterval.current = window.setInterval(() => {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                }
            }, 10000);
        }

        playNextChunk();
    }, [stop, playNextChunk]);

    const pause = useCallback(() => {
        window.speechSynthesis.pause();
        setIsPaused(true);
    }, []);

    const resume = useCallback(() => {
        window.speechSynthesis.resume();
        setIsPaused(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stop();
        };
    }, [stop]);

    // Ensure voices are loaded (some browsers load them asynchronously)
    useEffect(() => {
        const handleVoicesChanged = () => {
            window.speechSynthesis.getVoices();
        };
        window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
        // Trigger once immediately
        handleVoicesChanged();
        return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        };
    }, []);

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isPaused,
        hasSupport: typeof window !== 'undefined' && 'speechSynthesis' in window
    };
};

export default useTextToSpeech;
