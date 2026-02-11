import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
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
            type: 'guide',
            status: 'in_progress',
            progress: 50 // Default for now, could be tracked via scroll
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

                <div className="p-4 sm:p-8">
                    <MarkdownRenderer content={guide.content.trim()} />
                </div>

                <div className="mt-8 p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Feeling confident?</h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">Test your mastery of {guide.title} with real past questions.</p>
                    <Link
                        to={`/practice/topic/${guide.subject.toLowerCase()}/${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="inline-flex items-center gap-2 bg-primary text-white font-black py-4 px-8 rounded-2xl hover:bg-accent transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Your Knowledge
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default GuideReader;
