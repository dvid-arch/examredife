import React from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech.ts';

interface SpeechButtonProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    variant?: 'primary' | 'ghost' | 'secondary';
    showText?: boolean;
}

const SpeakerIcon = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
    const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={dim} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06z" />
            <path d="M17.78 6.22a.75.75 0 011.06 1.06A5.998 5.998 0 0120.5 12a5.998 5.998 0 01-1.66 4.72.75.75 0 11-1.06-1.06A4.497 4.497 0 0019 12a4.497 4.497 0 00-1.22-3.66.75.75 0 010-1.06z" />
            <path d="M15.66 8.34a.75.75 0 011.06 1.06A2.997 2.997 0 0117.5 12c0 .97-.46 1.84-1.18 2.4a.75.75 0 11-.94-1.17c.4-.32.62-.8.62-1.23 0-.43-.22-.91-.62-1.23a.75.75 0 010-1.43z" />
        </svg>
    );
};

const StopIcon = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
    const dim = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={dim} viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
        </svg>
    );
};

const SpeechButton: React.FC<SpeechButtonProps> = ({
    text,
    size = 'md',
    className = '',
    variant = 'secondary',
    showText = true
}) => {
    const { speak, stop, isSpeaking, hasSupport } = useTextToSpeech();

    if (!hasSupport) return null;

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isSpeaking) {
            stop();
        } else {
            speak(text);
        }
    };

    const sizeClasses = {
        sm: 'px-2.5 py-1.5 text-xs gap-1.5',
        md: 'px-3.5 py-2 text-sm gap-2',
        lg: 'px-4 py-2.5 text-base gap-2.5'
    };

    const baseClasses = `relative flex items-center rounded-full font-semibold transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`;

    const variantClasses = {
        primary: isSpeaking
            ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/40'
            : 'bg-primary text-white hover:bg-primary-dark shadow-md shadow-primary/30 dark:shadow-primary/20',
        ghost: isSpeaking
            ? 'text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
            : 'text-primary bg-primary/10 dark:bg-primary/15 hover:bg-primary/20',
        secondary: isSpeaking
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 shadow-sm'
            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:text-primary dark:hover:text-primary shadow-sm hover:shadow-md'
    };

    return (
        <button
            onClick={handleToggle}
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            title={isSpeaking ? 'Stop reading' : 'Read aloud'}
            aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
        >
            {/* Pulse ring when speaking */}
            {isSpeaking && (
                <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-red-400 dark:bg-red-500 pointer-events-none" />
            )}

            <span className={`flex-shrink-0 transition-transform duration-200 ${isSpeaking ? 'scale-110' : ''}`}>
                {isSpeaking ? <StopIcon size={size} /> : <SpeakerIcon size={size} />}
            </span>

            {showText && (
                <span className="whitespace-nowrap">
                    {isSpeaking ? 'Stop' : 'Listen'}
                </span>
            )}
        </button>
    );
};

export default SpeechButton;
