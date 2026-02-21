import React, { useState, useMemo } from 'react';

interface Topic {
    slug: string;
    label: string;
}

interface TopicSelectorProps {
    availableTopics: Topic[];
    selectedTopics: string[];
    onToggle: (slug: string) => void;
    onAiSuggest: () => void;
    isAiLoading: boolean;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
    availableTopics,
    selectedTopics,
    onToggle,
    onAiSuggest,
    isAiLoading
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTopics = useMemo(() => {
        if (!searchTerm) return availableTopics;
        const lowSearch = searchTerm.toLowerCase();
        return availableTopics.filter(t =>
            t.label.toLowerCase().includes(lowSearch) ||
            t.slug.toLowerCase().includes(lowSearch)
        );
    }, [availableTopics, searchTerm]);

    return (
        <div className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700">
            <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="w-full text-sm p-2 pl-8 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    onClick={onAiSuggest}
                    disabled={isAiLoading}
                    className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 py-2 px-3 rounded-md font-semibold text-xs hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                    {isAiLoading ? (
                        <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    )}
                    AI Suggest
                </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1 pr-1 border-t dark:border-slate-700 pt-2">
                {filteredTopics.length > 0 ? filteredTopics.map(topic => {
                    const isSelected = selectedTopics.includes(topic.slug);
                    return (
                        <button
                            key={topic.slug}
                            onClick={() => onToggle(topic.slug)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors flex justify-between items-center ${isSelected
                                    ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-medium'
                                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <span>{topic.label}</span>
                            {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    );
                }) : (
                    <p className="text-center text-xs text-slate-500 py-4">No topics found matching "{searchTerm}"</p>
                )}
            </div>

            {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-full mb-1">Selected:</span>
                    {selectedTopics.map(slug => {
                        const label = availableTopics.find(t => t.slug === slug)?.label || slug;
                        return (
                            <span
                                key={slug}
                                className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium"
                            >
                                {label}
                                <button onClick={() => onToggle(slug)} className="hover:text-red-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TopicSelector;
