import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import { getSubjectKey, SUBJECTS } from '../../constants/subjects.ts';

interface MasteryTabProps {
    performanceBySubject: { subject: string, average: number, total: number }[];
    performanceByTopic: { topic: string, subject: string, average: number, total: number }[];
}

export const MasteryTab: React.FC<MasteryTabProps> = ({ performanceBySubject, performanceByTopic }) => {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const getSubjectColor = (subjectName: string, index: number) => {
        const key = getSubjectKey(subjectName);
        const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
        return key ? SUBJECTS[key].color : COLORS[index % COLORS.length];
    };

    const currentSubject = selectedSubject || (performanceBySubject[0]?.subject);
    const topics = performanceByTopic.filter(t => t.subject === currentSubject);

    const filteredTopics = topics.filter(t =>
        (t.topic || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* Left: Subject Selector */}
            <div className="lg:col-span-4 space-y-6">
                <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white px-1 mb-1">Subject Proficiency</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium px-1">Select a subject to drill down into topic mastery.</p>
                </div>

                <div className="space-y-3">
                    {performanceBySubject.length === 0 && (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-500 text-sm">
                            No subject data available.
                        </div>
                    )}
                    {performanceBySubject.map((entry, idx) => {
                        const isSelected = currentSubject === entry.subject;
                        const subjectColor = getSubjectColor(entry.subject, idx);

                        return (
                            <button
                                key={entry.subject}
                                onClick={() => {
                                    setSelectedSubject(entry.subject);
                                    setSearchQuery('');
                                }}
                                className={`w-full text-left p-5 rounded-2xl transition-all border group ${isSelected
                                    ? 'bg-white dark:bg-slate-800 shadow-md ring-2 ring-offset-2 dark:ring-offset-slate-900 border-transparent transform scale-[1.02]'
                                    : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800'
                                    }`}
                                style={isSelected ? { ringColor: subjectColor } : {}}
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${subjectColor}15`, color: subjectColor }}>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <span className={`font-bold transition-colors ${isSelected ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white'}`}>
                                            {entry.subject}
                                        </span>
                                    </div>
                                    <span className="font-black text-lg" style={{ color: subjectColor }}>
                                        {Math.round(entry.average)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                                        style={{ width: `${entry.average}%`, backgroundColor: subjectColor }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Right: Topic Deep Dive */}
            <div className="lg:col-span-8">
                <Card className="p-0 h-full overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none">
                    {currentSubject ? (
                        <>
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                            {currentSubject} Analysis
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium mt-1">Found {topics.length} recorded topics.</p>
                                    </div>
                                    <div
                                        className="w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-lg transform rotate-3"
                                        style={{
                                            backgroundColor: getSubjectColor(currentSubject, performanceBySubject.findIndex(s => s.subject === currentSubject)),
                                            boxShadow: `0 10px 25px -5px ${getSubjectColor(currentSubject, performanceBySubject.findIndex(s => s.subject === currentSubject))}40`
                                        }}
                                    >
                                        {Math.round(performanceBySubject.find(s => s.subject === currentSubject)?.average || 0)}
                                    </div>
                                </div>

                                {/* Search Bar */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={`Search topics in ${currentSubject}...`}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            {topics.length > 0 ? (
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative">
                                    {filteredTopics.length > 0 ? (
                                        filteredTopics.map((topic, i) => (
                                            <div key={topic.topic} className="group relative" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 capitalize group-hover:text-primary transition-colors text-base sm:text-lg">
                                                            {topic.topic}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest
                                                                ${topic.average >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                    topic.average >= 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                                                                {topic.average >= 90 ? 'Mastered' : topic.average >= 60 ? 'Proficient' : 'Needs Focus'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {topic.total} questions answered
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-2xl font-black ${topic.average >= 90 ? 'text-green-500' :
                                                        topic.average >= 60 ? 'text-blue-500' : 'text-orange-500'
                                                        }`}>
                                                        {Math.round(topic.average)}<span className="text-sm text-slate-400 font-bold ml-0.5">%</span>
                                                    </span>
                                                </div>

                                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 p-0.5 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative group-hover:opacity-90
                                                            ${topic.average >= 90 ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                                                topic.average >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                                                    'bg-gradient-to-r from-orange-400 to-orange-500'}
                                                        `}
                                                        style={{ width: `${Math.max(topic.average, 2)}%` }} // At least 2% so dot is visible
                                                    >
                                                        {/* Little shine effect on the bar */}
                                                        <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 rounded-full filter blur-[2px]"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-slate-500 font-medium">No topics found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/50 m-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center">
                                    <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No topic data recorded</h4>
                                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">
                                        We haven't collected enough specific topic data for {currentSubject} yet. Take a topic-specific quiz to unlock deeper insights.
                                    </p>
                                    <Link to={`/study-guides/${getSubjectKey(currentSubject)}`} className="bg-primary text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 hover:bg-accent transition-colors">
                                        Study {currentSubject} Now
                                    </Link>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-full flex items-center justify-center p-12 text-slate-400">
                            Select a subject from the left panel to view its topic breakdown.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};
