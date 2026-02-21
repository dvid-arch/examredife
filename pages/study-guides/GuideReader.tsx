import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide, Topic, ConfidenceLevel } from '../../types.ts';
import { useUserProgress } from '../../contexts/UserProgressContext.tsx';

const GuideReader: React.FC = () => {
    const { category, slug } = useParams<{ category: string, slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addActivity, studyProgress, updateConfidence, calculateTopicStatus } = useUserProgress();

    // State management for flat data
    const [allTopics, setAllTopics] = useState<Topic[]>([]);
    const [topic, setTopic] = useState<Topic | null>(location.state?.topic || null);
    const [subjectName, setSubjectName] = useState<string>(location.state?.subjectName || "");
    const [isLoading, setIsLoading] = useState(!topic);
    const [toc, setToc] = useState<{ id: string; text: string; level: number }[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data: StudyGuide[] = await apiService('/data/guides');
                const subjectGuide = data.find(g => g.id.toLowerCase() === category?.toLowerCase());

                if (subjectGuide) {
                    setSubjectName(subjectGuide.subject);
                    setAllTopics(subjectGuide.topics);
                    const matchedTopic = subjectGuide.topics.find(t => t.id.toLowerCase() === slug?.toLowerCase());

                    if (matchedTopic) {
                        setTopic(matchedTopic);
                        trackActivity(subjectGuide.subject, matchedTopic);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch study data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [category, slug]);

    // Update TOC based on current content (Direct Topic content)
    useEffect(() => {
        const content = topic?.content;
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
    }, [topic]);

    const trackActivity = (subject: string, t: Topic) => {
        addActivity({
            id: t.id,
            title: t.title,
            subtitle: `${subject} • Study Guide`,
            path: `/study-guides/${category}/${t.id}`,
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

    const contentToRender = topic.content || `# ${topic.title}\n\n${topic.description || '*No detailed description available yet.*'}`;

    // Determine next step (next topic in the subject list)
    const currentIndex = allTopics.findIndex(t => t.id === topic.id);
    const nextTopic = (currentIndex !== -1 && currentIndex < allTopics.length - 1) ? allTopics[currentIndex + 1] : null;

    return (
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 pb-20">
            {/* Left Sidebar: All subject topics */}
            <aside className="lg:w-72 flex-shrink-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-24">
                    <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 px-2 flex items-center gap-2 text-sm uppercase tracking-tight">
                        <div className="w-1 h-5 bg-primary rounded-full"></div>
                        Course Outline
                    </h3>
                    <nav className="space-y-1 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        {allTopics.map((t) => (
                            <Link
                                key={t.id}
                                to={`/study-guides/${category}/${t.id}`}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${topic?.id === t.id
                                    ? 'bg-primary/10 text-primary font-bold border-l-4 border-primary'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900'
                                    }`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="line-clamp-2">{t.title}</span>
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
                            {topic.title}
                        </h1>
                        <div className="flex items-center gap-6 text-slate-500 dark:text-slate-400 text-sm font-medium">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                JAMB Topic
                            </span>
                            <span className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                8 min read
                            </span>
                        </div>
                    </div>

                    <div className="p-6 sm:p-12 prose dark:prose-invert max-w-none prose-slate prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary border-b border-slate-100 dark:border-slate-800">
                        <MarkdownRenderer
                            content={contentToRender.trim()}
                            inlineQuestions={topic.inlineQuestions}
                            onCheckpointResult={(isCorrect) => {
                                if (isCorrect) {
                                    addActivity({
                                        id: `checkpoint-${topic.id}-${Date.now()}`,
                                        title: `Checkpoint: ${topic.title}`,
                                        subtitle: 'Knowledge Check',
                                        type: 'quiz',
                                        path: location.pathname,
                                        score: 1,
                                        maxScore: 1,
                                        progress: 100,
                                        mastered: false
                                    });
                                }
                            }}
                        />
                    </div>

                    {topic.videos && topic.videos.length > 0 && (
                        <div className="px-6 sm:px-12 py-12 space-y-8 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                                {topic.videos.some(v => v.type === 'study-hack') ? 'Study Hacks & Tutorials' : 'Video Tutorials'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {topic.videos.map(video => (
                                    <div key={video.id} className="group bg-slate-50 dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-xl">
                                        <div className="aspect-video relative">
                                            <iframe
                                                className="w-full h-full"
                                                src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                                title={video.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${video.type === 'study-hack'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {video.type === 'study-hack' ? 'Study Hack' : 'Tutorial'}
                                                </span>
                                                {video.duration && (
                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                                        {video.duration}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                                                {video.title}
                                            </h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="px-6 sm:px-12 py-12">
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[24px] p-6 sm:p-8">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                                <div className="text-center sm:text-left">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">How's your confidence?</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Be honest! We use this to help you focus on your weak areas.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {[
                                        { id: 'lost' as ConfidenceLevel, label: 'Lost', icon: '🔴', color: 'bg-red-50 text-red-600 border-red-100 active:bg-red-100' },
                                        { id: 'shaky' as ConfidenceLevel, label: 'Shaky', icon: '🟡', color: 'bg-amber-50 text-amber-600 border-amber-100 active:bg-amber-100' },
                                        { id: 'confident' as ConfidenceLevel, label: 'Got It!', icon: '🟢', color: 'bg-green-50 text-green-600 border-green-100 active:bg-green-100' }
                                    ].map((level) => {
                                        const currentStatus = calculateTopicStatus(topic.id);
                                        const isSelected = studyProgress?.[topic.id]?.confidence === level.id;
                                        const isStale = isSelected && currentStatus === 'stale';

                                        return (
                                            <button
                                                key={level.id}
                                                onClick={() => updateConfidence(topic.id, level.id)}
                                                className={`group relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${isSelected
                                                    ? isStale
                                                        ? 'bg-orange-50 border-orange-200 text-orange-600' // Stale styling
                                                        : `${level.color.replace('bg-', 'bg-opacity-100 bg-').replace('text-', 'text-')} border-current shadow-lg`
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 grayscale'
                                                    }`}
                                            >
                                                <span className={`text-xl transition-transform group-hover:scale-110 ${isSelected ? 'scale-110 grayscale-0' : ''}`}>
                                                    {isStale ? '🟠' : level.icon}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                                                    {isStale ? 'Review Needed' : level.label}
                                                </span>
                                                {isSelected && (
                                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center shadow-sm ${isStale ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-900 text-current'
                                                        }`}>
                                                        {isStale ? (
                                                            <span className="text-[10px] font-bold">!</span>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="m-6 sm:m-12 p-8 rounded-[24px] bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="text-center sm:text-left">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                {nextTopic ? 'Next Topic' : 'You\'ve reached the end!'}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                {nextTopic
                                    ? `Up next: ${nextTopic.title}`
                                    : `You've completed all JAMB topics for ${subjectName}.`}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <Link
                                to={`/practice/topic/${category}/${topic.id}`}
                                className="flex-1 sm:flex-initial bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-black py-4 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all text-sm text-center"
                            >
                                Practice this Topic
                            </Link>

                            {nextTopic ? (
                                <Link
                                    to={`/study-guides/${category}/${nextTopic.id}`}
                                    className="flex-1 sm:flex-initial bg-primary text-white font-black py-4 px-8 rounded-2xl hover:bg-accent hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 text-sm text-center"
                                >
                                    Start Next Topic
                                </Link>
                            ) : (
                                <Link
                                    to={`/practice/topic/${category}/${topic.id}`}
                                    className="flex-1 sm:flex-initial bg-primary text-white font-black py-4 px-8 rounded-2xl hover:bg-accent hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30 text-sm text-center"
                                >
                                    Take Final Mastery Quiz
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
