import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card.tsx';
import apiService from '../services/apiService.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import useSEO from '../hooks/useSEO.ts';

interface LiteratureBook {
    id: string;
    title: string;
    author: string;
    genre: string;
    themes: string[];
    summary: string;
}

const Literature: React.FC = () => {
    const navigate = useNavigate();

    useSEO({
        title: "Literature Texts",
        description: "Study summaries and themes of recommended literature books on ExamRedi."
    });
    const [books, setBooks] = useState<LiteratureBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBook, setSelectedBook] = useState<LiteratureBook | null>(null);

    useEffect(() => {
        const fetchLiterature = async () => {
            try {
                const data = await apiService<LiteratureBook[]>('/data/literature');
                setBooks(data);
                if (data.length > 0) setSelectedBook(data[0]);
            } catch (error) {
                console.error("Failed to fetch literature:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLiterature();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">UTME Literature Books</h1>
                    <p className="text-slate-600 dark:text-slate-400">Master the recommended texts for your examination.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Book List */}
                <div className="lg:col-span-1 space-y-4">
                    {books.map((book) => (
                        <div
                            key={book.id}
                            onClick={() => setSelectedBook(book)}
                            className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedBook?.id === book.id ? 'border-primary bg-primary-light/10 dark:bg-primary/10' : 'border-transparent bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-700'}`}
                        >
                            <h3 className="font-bold text-slate-800 dark:text-white">{book.title}</h3>
                            <p className="text-sm text-slate-500">{book.author}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-xs rounded-full text-slate-600 dark:text-slate-300">
                                {book.genre}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Book Details */}
                <div className="lg:col-span-2">
                    {selectedBook ? (
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-primary p-6 text-white">
                                <h2 className="text-2xl font-bold">{selectedBook.title}</h2>
                                <p className="opacity-90">by {selectedBook.author}</p>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Summary</h3>
                                    <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {selectedBook.summary}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Key Themes</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedBook.themes.map((theme, i) => (
                                            <span key={i} className="px-3 py-1 bg-primary/10 text-primary dark:text-accent rounded-full text-sm font-medium">
                                                {theme}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t dark:border-slate-700">
                                    <button
                                        onClick={() => {
                                            navigate('/quiz', {
                                                state: {
                                                    mode: 'practice',
                                                    practiceSubjects: ['Literature'],
                                                    questionsPerSubject: 20,
                                                    examTitle: `Practice: ${selectedBook.title}`,
                                                    query: selectedBook.title
                                                }
                                            });
                                        }}
                                        className="w-full bg-primary text-white hover:bg-green-700 font-bold py-3 px-4 rounded-lg transition-colors shadow-sm"
                                    >
                                        Practice Questions for this Book
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                            <p>Select a book to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Literature;
