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
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-200">
            <div className="flex justify-between items-center gap-2">
                <div className="relative flex-1 group">
                    <input
                        type="text"
                        placeholder="Search topics..."
                        className="w-full text-sm p-2.5 pl-9 border border-slate-200 dark:border-slate-700 rounded-lg dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button
                    onClick={onAiSuggest}
                    disabled={isAiLoading || availableTopics.length === 0}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2.5 px-4 rounded-lg font-bold text-xs hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                    {isAiLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"></div>
                            <span>Analyzing...</span>
                        </div>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span>AI Suggest</span>
                        </>
                    )}
                </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                {availableTopics.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-dashed dark:border-slate-700">
                        <p className="text-sm text-slate-500 font-medium italic">No topics found for this subject.</p>
                        <p className="text-xs text-slate-400 mt-1">Please ensure subject names are aligned.</p>
                    </div>
                ) : filteredTopics.length > 0 ? filteredTopics.map(topic => {
                    const isSelected = selectedTopics.includes(topic.slug);
                    return (
                        <button
                            key={topic.slug}
                            onClick={() => onToggle(topic.slug)}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all flex justify-between items-center group ${isSelected
                                ? 'bg-primary text-white shadow-sm font-semibold'
                                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                        >
                            <span>{topic.label}</span>
                            {isSelected ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <div className="h-4 w-4 border-2 border-slate-300 dark:border-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            )}
                        </button>
                    );
                }) : (
                    <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm text-slate-500 py-4">No topics found matching "{searchTerm}"</p>
                    </div>
                )}
            </div>

            {selectedTopics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t dark:border-slate-700">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 w-full mb-1">Active Tags ({selectedTopics.length})</span>
                    {selectedTopics.map(slug => {
                        const label = availableTopics.find(t => t.slug === slug)?.label || slug;
                        return (
                            <span
                                key={slug}
                                className="inline-flex items-center gap-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2.5 py-1 rounded-full text-[11px] font-bold border border-primary/20 hover:bg-primary/20 transition-colors"
                            >
                                {label}
                                <button onClick={() => onToggle(slug)} className="hover:text-red-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
