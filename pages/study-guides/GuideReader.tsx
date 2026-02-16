import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide, Topic, SubTopic } from '../../types.ts';
import { useUserProgress } from '../../contexts/UserProgressContext.tsx';

const GuideReader: React.FC = () => {
    const { category, slug, subTopicId } = useParams<{ category: string, slug: string, subTopicId?: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addActivity } = useUserProgress();

    // State management for hierarchical data
    const [topic, setTopic] = useState<Topic | null>(location.state?.topic || null);
    const [subTopic, setSubTopic] = useState<SubTopic | null>(null);
    const [subjectName, setSubjectName] = useState<string>(location.state?.subjectName || "");
    const [isLoading, setIsLoading] = useState(!topic);
    const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data: StudyGuide[] = await apiService('/data/guides');
                const subjectGuide = data.find(g => g.id === category);

                if (subjectGuide) {
                    setSubjectName(subjectGuide.subject);
                    const matchedTopic = subjectGuide.topics.find(t => t.id === slug);

                    if (matchedTopic) {
                        setTopic(matchedTopic);

                        // Select sub-topic if ID provided, otherwise null (Overview)
                        if (subTopicId) {
                            const currentSubTopic = matchedTopic.subTopics.find(st => st.id === subTopicId);
                            if (currentSubTopic) {
                                setSubTopic(currentSubTopic);
                                trackActivity(subjectGuide.subject, matchedTopic, currentSubTopic);
                            } else {
                                setSubTopic(null); // Fallback to overview if not found
                            }
                        } else {
                            setSubTopic(null); // Explicit overview mode
                            trackActivity(subjectGuide.subject, matchedTopic);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch study data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [category, slug, subTopicId]);

    // Update TOC based on current content (Topic or SubTopic)
    useEffect(() => {
        const content = subTopic ? subTopic.content : topic?.content;
        if (content) {
            const headers = content.match(/^#{2,3}\s+(.+)$/gm);
            if (headers) {
                const newToc = headers.map(h => {
                    const level = h.match(/^#+/)[0].length;
                    const text = h.replace(/^#+\s+/, '');
                    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    return { id, text, level };
                });
                setToc(newToc);
            } else {
                setToc([]);
            }
        }
    }, [subTopic, topic]);

    const trackActivity = (subject: string, t: Topic, st?: SubTopic) => {
        addActivity({
            id: st ? st.id : t.id,
            title: st ? st.title : `${t.title} Overview`,
            subtitle: `${subject} • Study Guide`,
            path: `/study-guides/${category}/${slug}${st ? `/${st.id}` : ''}`,
            type: 'guide',
            progress: 100
        });
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState(null, '', `#${id}`);
        }
    };

    if (isLoading) return <div className="p-12 text-center text-slate-500 font-medium">Loading lesson...</div>;
    if (!topic) return <div className="p-12 text-center text-red-500 font-bold">Topic not found.</div>;

    const isOverview = !subTopicId;
    const currentContent = subTopic ? subTopic.content : (topic.content || `# ${topic.title}\n\n${topic.description || ''}`);
    const currentTitle = subTopic ? subTopic.title : `${topic.title} Overview`;

    // Determine next step
    const nextSubTopic = isOverview
        ? topic.subTopics[0]
        : topic.subTopics[topic.subTopics.indexOf(subTopic!) + 1];

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20">
            {/* Left Sidebar: Sub-topics */}
            <aside className="lg:w-72 flex-shrink-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-24">
                    <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 px-2 flex items-center gap-2 text-sm uppercase tracking-tight">
                        <div className="w-1 h-5 bg-primary rounded-full"></div>
                        {topic.title}
                    </h3>
                    <nav className="space-y-1">
                        <Link
                            to={`/study-guides/${category}/${slug}`}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isOverview
                                ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Topic Overview
                        </Link>

                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-2"></div>

                        {topic.subTopics.map((st) => (
                            <Link
                                key={st.id}
                                to={`/study-guides/${category}/${slug}/${st.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${subTopic?.id === st.id
                                    ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {st.title}
                            </Link>
                        ))}
                    </nav>

                    {/* TOC for current content */}
                    {toc.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 hidden lg:block">
                            <h3 className="font-bold text-slate-400 mb-4 px-2 uppercase text-[10px] tracking-widest">
                                On this page
                            </h3>
                            <ul className="space-y-3 text-xs border-l border-slate-200 dark:border-slate-700">
                                {toc.map((item) => (
                                    <li key={item.id} className={`pl-4 ${item.level === 3 ? 'ml-2' : ''}`}>
                                        <button
                                            onClick={() => scrollToSection(item.id)}
                                            className="text-left text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors line-clamp-1"
                                        >
                                            {item.text}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/study-guides/${category}`)}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-bold text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to {subjectName}
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                            {subjectName}
                        </span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                    <div className="p-8 sm:p-12 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/30 dark:to-slate-900">
                        <h1 className="text-3xl sm:text-5xl font-black text-slate-800 dark:text-white mb-4 leading-tight tracking-tight">
                            {currentTitle}
                        </h1>
                        <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            {!isOverview && (
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    Topic Module
                                </span>
                            )}
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {isOverview ? '3 min intro' : '8 min read'}
                            </span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-12 prose dark:prose-invert max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary">
                        <MarkdownRenderer content={currentContent.trim()} />
                    </div>

                    <div className="m-6 sm:m-12 p-8 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                {nextSubTopic ? 'Ready to dive deeper?' : 'Topic Complete!'}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {nextSubTopic
                                    ? `Next: ${nextSubTopic.title}`
                                    : `You've covered all lessons in ${topic.title}.`}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            {!isOverview && (
                                <Link
                                    to={`/practice/topic/${category}/${slug}/${subTopicId}`}
                                    className="flex-1 sm:flex-initial bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-black py-4 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm text-center"
                                >
                                    Practice this Lesson
                                </Link>
                            )}
                            {nextSubTopic ? (
                                <Link
                                    to={`/study-guides/${category}/${slug}/${nextSubTopic.id}`}
                                    className="flex-1 sm:flex-initial bg-slate-800 dark:bg-primary text-white font-black py-4 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm shadow-xl shadow-slate-200 dark:shadow-primary/20 text-center"
                                >
                                    Start Next Lesson
                                </Link>
                            ) : (
                                <Link
                                    to={`/practice/topic/${category}/${slug}`}
                                    className="flex-1 sm:flex-initial bg-primary text-white font-black py-4 px-8 rounded-2xl hover:bg-accent hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 text-sm text-center"
                                >
                                    Take Mastery Quiz
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuideReader;
