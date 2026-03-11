import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiService from '../services/apiService.ts';
import { ChallengeQuestion } from '../types.ts';
import QuestionRenderer from '../components/QuestionRenderer.tsx';
import Header from '../components/Header.tsx';

const QuestionPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [question, setQuestion] = useState<ChallengeQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchQuestion = async () => {
            try {
                setLoading(true);
                const data = await apiService<ChallengeQuestion>(`/data/question/${id}`, { useAuth: false });
                setQuestion(data);
                setError(null);

                // Update SEO Meta Tags
                if (data) {
                    const snippet = data.question.replace(/<[^>]*>?/gm, '').slice(0, 150);
                    const title = `${data.subject} ${data.exam} ${data.year} Question - ExamRedi`;
                    const description = `${data.subject} past question from ${data.exam} ${data.year}: ${snippet}... Learn more on ExamRedi.`;

                    document.title = title;

                    // Update or create meta description
                    let metaDescription = document.querySelector('meta[name="description"]');
                    if (!metaDescription) {
                        metaDescription = document.createElement('meta');
                        metaDescription.setAttribute('name', 'description');
                        document.head.appendChild(metaDescription);
                    }
                    metaDescription.setAttribute('content', description);
                }
            } catch (err: any) {
                console.error("Error fetching question:", err);
                setError("Question not found or server error.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchQuestion();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-slate-600">Loading your question...</p>
            </div>
        );
    }

    if (error || !question) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Question Not Found</h2>
                <p className="text-slate-600 mb-6">We couldn't find the question you're looking for.</p>
                <Link to="/dashboard" className="bg-primary text-white px-6 py-2 rounded-lg font-bold">
                    Go to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
                <nav className="flex text-sm text-slate-500 mb-4 gap-2">
                    <Link to="/dashboard" className="hover:text-primary">Home</Link>
                    <span>/</span>
                    <Link to={`/practice?subject=${question.subject}`} className="hover:text-primary">{question.subject}</Link>
                    <span>/</span>
                    <span className="text-slate-800 font-medium">Question {id?.slice(-6)}</span>
                </nav>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    {question.subject} Past Question
                </h1>
                <p className="text-slate-600">
                    Source: {question.exam} {question.year}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-10 mb-8">
                <QuestionRenderer
                    question={question}
                    correctAnswer={question.answer}
                    renderOptions={true}
                />
            </div>

            {question.explanation && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                        <span>💡</span> Explanation
                    </h3>
                    <div className="text-slate-700 leading-relaxed prose prose-slate max-w-none">
                        {question.explanation}
                    </div>
                </div>
            )}

            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-3 italic">Want to master this topic?</h2>
                    <p className="text-blue-50 mb-6 max-w-xl">
                        Our AI Tutor can explain the concepts behind this question, suggest related topics,
                        and help you avoid common mistakes in the {question.exam} exam.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/ai-buddy"
                            className="bg-white text-primary hover:bg-blue-50 px-8 py-3 rounded-xl font-extrabold transition-all transform hover:scale-105 shadow-md"
                        >
                            Try AI Tutor for Free
                        </Link>
                        <Link
                            to="/register"
                            className="bg-primary-dark/30 backdrop-blur-md border border-white/20 hover:bg-primary-dark/40 px-8 py-3 rounded-xl font-bold transition-all"
                        >
                            Create an Account
                        </Link>
                    </div>
                </div>
                {/* Decorative elements */}
                <div className="absolute -right-4 -bottom-4 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute right-10 top-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
            </div>
        </div>
    );
};

export default QuestionPage;
