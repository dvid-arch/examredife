import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide } from '../../types.ts';
import { useUserProgress } from '../../contexts/UserProgressContext.tsx';

const GuideReader: React.FC = () => {
    const { category, slug } = useParams<{ category: string, slug: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { addActivity } = useUserProgress();
    const [guide, setGuide] = useState<StudyGuide | null>(location.state?.guide || null);
    const [isLoading, setIsLoading] = useState(!guide);

    useEffect(() => {
        if (!guide) {
            const fetchGuide = async () => {
                try {
                    const data: StudyGuide[] = await apiService('/data/guides');
                    const match = data.find(g =>
                        g.subject.toLowerCase().replace(/\s+/g, '-') === category &&
                        g.title.toLowerCase().replace(/\s+/g, '-') === slug
                    );
                    if (match) {
                        setGuide(match);
                        trackActivity(match);
                    } else {
                        // navigate(`/study-guides/${category}`);
                    }
                } catch (error) {
                    console.error("Failed to fetch guide", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchGuide();
        } else {
            trackActivity(guide);
        }
    }, [category, slug, guide]);

    const trackActivity = (g: StudyGuide) => {
        addActivity({
            id: g.id,
            title: g.title,
            path: `/study-guides/${category}/${slug}`,
            type: 'guide'
        });
    };

    if (isLoading) return <div className="p-12 text-center text-slate-500">Loading lesson...</div>;
    if (!guide) return <div className="p-12 text-center text-red-500">Guide not found.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate(`/study-guides/${category}`)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-semibold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to topics
                </button>
                <div className="text-right">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                        {guide.subject}
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                    <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2 leading-tight">
                        {guide.title}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-sm">
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            8 min read
                        </span>
                        <span>•</span>
                        <span>Official Study Material</span>
                    </div>
                </div>

                <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
                    <MarkdownRenderer content={guide.content} />
                </div>

                <div className="p-8 pt-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col items-center text-center">
                    <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-6"></div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Feeling confident?</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Try answering some questions related to this topic in the Practice Arena.</p>
                    <button
                        onClick={() => navigate('/practice/standard')}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-primary/20"
                    >
                        Test Knowledge
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideReader;
