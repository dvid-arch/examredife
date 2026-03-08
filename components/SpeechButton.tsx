import React from 'react';
import useTextToSpeech from '../hooks/useTextToSpeech.ts';

interface SpeechButtonProps {
    text: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    variant?: 'primary' | 'ghost' | 'secondary';
    showText?: boolean;
}

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
        sm: 'p-1.5 text-xs h-8',
        md: 'p-2 text-sm h-10',
        lg: 'p-3 text-base h-12'
    };

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary/90 shadow-md',
        ghost: 'text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors',
        secondary: 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary/50 shadow-sm'
    };

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 rounded-full font-bold transition-all ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
            title={isSpeaking ? "Stop reading" : "Read aloud"}
            aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
        >
            <div className="flex-shrink-0">
                {isSpeaking ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            {showText && (
                <span className="whitespace-nowrap pr-1">
                    {isSpeaking ? 'Stop' : 'Read'}
                </span>
            )}
        </button>
    );
};

export default SpeechButton;
