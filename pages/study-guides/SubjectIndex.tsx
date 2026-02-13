import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide } from '../../types.ts';
import { SUBJECTS, getSubjectKey } from '../../constants/subjects.ts';

const SubjectIndex: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const navigate = useNavigate();
    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const subjectKey = getSubjectKey(category || '');
    const subjectMeta = subjectKey ? SUBJECTS[subjectKey] : null;
    const subjectName = subjectMeta ? subjectMeta.name : (category?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));

    useEffect(() => {
        const fetchGuides = async () => {
            try {
                const data: StudyGuide[] = await apiService('/data/guides');
                const filtered = data.filter(g => g.subject.toLowerCase().replace(/\s+/g, '-') === category);
                setGuides(filtered);

                if (filtered.length === 0 && !isLoading) {
                    // navigate('/study-guides');
                }
            } catch (error) {
                console.error("Failed to fetch guides", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuides();
    }, [category]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={() => navigate('/study-guides')}
                    className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{subjectName}</h1>
                    <p className="text-slate-600 dark:text-slate-400">Select a topic to start studying.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-20 rounded-xl"></div>
                    ))
                ) : guides.length > 0 ? (
                    guides.map(guide => (
                        <Link
                            key={guide.id}
                            to={`${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                            state={{ guide }} // Optional: Pass guide object to avoid double fetch
                        >
                            <Card className="hover:border-primary transition-colors group">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{guide.title}</h3>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <p className="text-slate-500">No study guides found for this subject yet.</p>
                        <Link to="/study-guides/generator" className="text-primary font-bold mt-2 inline-block">Generate one with AI?</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectIndex;
