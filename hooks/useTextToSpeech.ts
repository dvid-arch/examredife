import { useState, useCallback, useEffect, useRef } from 'react';

export const useTextToSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const chunksRef = useRef<string[]>([]);
    const currentChunkIndex = useRef(0);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
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
        const sentences = cleanText.match(/[^.!?]+[.!?]+|[^.!?]+/g)?.map(s => s.trim()).filter(Boolean) || [];
        const chunks: string[] = [];

        for (const sentence of sentences) {
            let text = sentence;
            while (text.length > 0) {
                if (text.length <= 200) {
                    chunks.push(text);
                    break;
                }
                let breakIdx = text.lastIndexOf(',', 200);
                if (breakIdx === -1) breakIdx = text.lastIndexOf(' ', 200);
                if (breakIdx === -1) breakIdx = 200;

                chunks.push(text.substring(0, breakIdx + 1).trim());
                text = text.substring(breakIdx + 1).trim();
            }
        }

        let combinedChunks: string[] = [];
        let currentCombined = '';
        for (const chunk of chunks) {
            if (currentCombined.length + chunk.length > 200 && currentCombined) {
                combinedChunks.push(currentCombined.trim());
                currentCombined = chunk + ' ';
            } else {
                currentCombined += chunk + ' ';
            }
        }
        if (currentCombined.trim()) combinedChunks.push(currentCombined.trim());

        chunksRef.current = combinedChunks;
        currentChunkIndex.current = 0;
        setIsSpeaking(true);

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
