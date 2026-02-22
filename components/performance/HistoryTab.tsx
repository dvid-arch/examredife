import React, { useState } from 'react';
import Card from '../../components/Card.tsx';

interface HistoryTabProps {
    results: any[];
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ results }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResults = results.filter(r => {
        const title = (r.metadata?.exam || r.metadata?.title || r.exam || 'Practice').toLowerCase();
        const subject = (r.subject || '').toLowerCase();
        const search = searchTerm.toLowerCase();
        return title.includes(search) || subject.includes(search);
    });

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-slate-200/40 dark:shadow-none animate-in fade-in duration-500">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Complete Quiz Log</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1">{results.length} sessions recorded</p>
                </div>

                <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search quizzes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                    />
                </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                {filteredResults.length > 0 ? (
                    <table className="min-w-full text-left max-h-[600px] overflow-y-auto block whitespace-nowrap md:table md:whitespace-normal">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
                                <th className="p-4 md:p-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Date</th>
                                <th className="p-4 md:p-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Type / Exam</th>
                                <th className="p-4 md:p-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Subject(s)</th>
                                <th className="p-4 md:p-6 text-xs font-bold text-slate-400 uppercase tracking-widest bg-white dark:bg-slate-900">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/80">
                            {filteredResults.map((result, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group">
                                    <td className="p-4 md:p-6 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                {new Date(result.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider uppercase">
                                                {new Date(result.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-6 align-middle">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-xs transition-colors group-hover:text-primary">
                                                    {result.metadata?.exam || result.metadata?.title || result.exam || 'Practice'}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">
                                                    {result.metadata?.year || result.year || 'Standard Quiz'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-6 align-middle">
                                        <div className="flex flex-wrap gap-1 max-w-[200px] md:max-w-xs">
                                            {(result.subject || '').split(',').map((subj: string, i: number) => (
                                                <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                                                    {subj.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 md:p-6 align-middle min-w-[150px]">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-baseline gap-1">
                                                <span className="font-black text-slate-800 dark:text-white text-base">
                                                    {Math.round(result.score / result.totalQuestions * 100)}%
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {result.score}/{result.totalQuestions}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ease-out group-hover:opacity-100 ${(result.score / result.totalQuestions) >= 0.8 ? 'bg-green-500' :
                                                        (result.score / result.totalQuestions) >= 0.6 ? 'bg-primary' :
                                                            'bg-orange-500'
                                                    }`}
                                                style={{ width: `${Math.round(result.score / result.totalQuestions * 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center">
                        <svg className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-slate-500 font-bold text-lg mb-1">No results matching "{searchTerm}"</p>
                        <p className="text-slate-400 text-sm">Try using different keywords or clear the search.</p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-4 text-primary font-bold hover:underline text-sm"
                        >
                            Clear Search
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};
