import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import { usePastQuestions } from '../../contexts/PastQuestionsContext.tsx';
import { SUBJECTS, getSubjectKey } from '../../constants/subjects.ts';
import apiService from '../../services/apiService.ts';
import SchemaMarkup from '../../components/SchemaMarkup.tsx';
import { useMemo } from 'react';

interface JambSubjectTopics {
    slug: string;
    label: string;
    topics: { slug: string; label: string }[];
}

const SubjectIndex: React.FC = () => {
    const { category } = useParams<{ category: string }>();
    const navigate = useNavigate();
    const { guides, isLoading, fetchGuides } = usePastQuestions();

    const subjectKey = getSubjectKey(category || '');
    const subjectMeta = subjectKey ? SUBJECTS[subjectKey] : null;
    const subjectName = subjectMeta ? subjectMeta.name : (category?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '));

    // ── JAMB syllabus coverage ──────────────────────────────────────────────
    const [jambTopics, setJambTopics] = useState<JambSubjectTopics | null>(null);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data: JambSubjectTopics[] = await apiService('/data/topics');
                const match = data.find(s => s.slug.toLowerCase() === category?.toLowerCase());
                if (match && match.topics.length > 0) setJambTopics(match);
            } catch {
                // Silently ignore — coverage bar is optional UI
            }
        };
        fetchTopics();
    }, [category]);

    useEffect(() => {
        fetchGuides();
    }, [fetchGuides]);

    // Find the specific guide for this category
    const subjectGuide = guides.find(g => g.id.toLowerCase() === category?.toLowerCase());
    const topics = subjectGuide?.topics || [];

    // Calculate how many official JAMB topics are represented in the guide
    const guideTopicIds = new Set(topics.map(t => t.id));
    const jambTotal = jambTopics?.topics.length ?? 0;
    const jambCovered = jambTopics
        ? jambTopics.topics.filter(t => guideTopicIds.has(t.slug.toLowerCase())).length
        : 0;
    const coveragePct = jambTotal > 0 ? Math.round((jambCovered / jambTotal) * 100) : 0;

    const subjectSchema = useMemo(() => ({
        "name": `${subjectName} Study Guide`,
        "description": `Comprehensive study material and topics for ${subjectName}.`,
        "provider": {
            "@type": "Organization",
            "name": "ExamRedi",
            "url": "https://examredi.vercel.app"
        },
        "hasPart": topics.map(t => ({
            "@type": "Course",
            "name": t.title,
            "description": t.description,
            "url": `https://examredi.vercel.app/study-guides/${category}/${t.id}`
        }))
    }), [subjectName, topics, category]);

    return (
        <div className="space-y-6">
            <SchemaMarkup type="Course" data={subjectSchema} />
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

            {/* JAMB Syllabus Coverage Bar */}
            {jambTopics && jambTotal > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                JAMB Syllabus
                            </span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {jambCovered} of {jambTotal} official topics covered
                            </span>
                        </div>
                        <span className={`text-sm font-black ${coveragePct >= 80 ? 'text-green-600' : coveragePct >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                            {coveragePct}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full transition-all duration-500 ${coveragePct >= 80 ? 'bg-green-500' : coveragePct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${coveragePct}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-20 rounded-xl"></div>
                    ))
                ) : topics.length > 0 ? (
                    topics.map(topic => (
                        <Link
                            key={topic.id}
                            to={`${topic.id}`}
                            state={{ topic, subjectName }}
                        >
                            <Card className="hover:border-primary transition-colors group">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{topic.title}</h3>
                                            {topic.description && <p className="text-xs text-slate-500 line-clamp-1">{topic.description}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">Read Lesson</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
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
