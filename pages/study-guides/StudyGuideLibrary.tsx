import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import { usePastQuestions } from '../../contexts/PastQuestionsContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import SchemaMarkup from '../../components/SchemaMarkup.tsx';

const GuideIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const StudyGuideLibrary: React.FC = () => {
    const { guides, isLoading, fetchGuides } = usePastQuestions();
    const { user } = useAuth();

    // Prepare Schema Data for the entire Library
    const librarySchema = useMemo(() => ({
        "name": "ExamRedi Study Guides",
        "description": "Comprehensive AI-powered study guides for various academic subjects.",
        "provider": {
            "@type": "Organization",
            "name": "ExamRedi",
            "url": "https://examredi.vercel.app"
        },
        "hasPart": guides.map(g => ({
            "@type": "Course",
            "name": g.subject,
            "description": `Comprehensive study guide for ${g.subject}`,
            "url": `https://examredi.vercel.app/study-guides/${g.id}`
        }))
    }), [guides]);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchGuides();
    }, [fetchGuides]);

    const allSubjects = [...guides].sort((a, b) => a.subject.localeCompare(b.subject));

    // For non-admins: show only their 4 preferred subjects (if set)
    const subjects = isAdmin || !user?.preferredSubjects?.length
        ? allSubjects
        : allSubjects.filter(g => {
            const isPreferred = user.preferredSubjects!.some(p => p.toLowerCase() === g.subject.toLowerCase() || g.id.toLowerCase() === p.toLowerCase());
            const isEnglish = ['english', 'english language', 'use of english'].includes(g.subject.toLowerCase());
            return isPreferred || isEnglish;
        });

    return (
        <div className="space-y-6">
            <SchemaMarkup type="Course" data={librarySchema} />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Study Library</h1>
                    <p className="text-slate-600 dark:text-slate-400">Master every subject with curated guides and AI assistance.</p>
                </div>
                <Link
                    to="generator"
                    className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-primary/20"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.421l4.1 5.466a1 1 0 010 1.2l-4.1 5.466a1 1 0 01-1.494-1.2l3.2-4.266H1a1 1 0 010-2h13.903l-3.2-4.266a1 1 0 01.197-1.421z" clipRule="evenodd" />
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    AI Generator
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-40 rounded-2xl"></div>
                    ))
                ) : (
                    subjects.map((subjectGuide) => (
                        <Link
                            key={subjectGuide.id}
                            to={`${subjectGuide.id}`}
                            className="group"
                        >
                            <Card className="h-full border-none bg-white dark:bg-slate-900 shadow-md hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 border-b-4 border-b-transparent hover:border-b-primary">
                                <div className="p-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                        <GuideIcon />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{subjectGuide.subject}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{subjectGuide.topics.length} topics available</p>

                                    <div className="mt-4 flex items-center text-primary font-semibold text-sm">
                                        Explore Topics
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default StudyGuideLibrary;
