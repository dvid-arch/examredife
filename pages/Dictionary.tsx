import React, { useState } from 'react';
import Card from '../components/Card.tsx';
import { sendMessageToAI } from '../services/aiService.ts';
import MarkdownRenderer from '../components/MarkdownRenderer.tsx';
import useSEO from '../hooks/useSEO.ts';
import SpeechButton from '../components/SpeechButton.tsx';

const Dictionary: React.FC = () => {
    useSEO({
        title: "Academic Dictionary",
        description: "Look up academic terms and concepts in our smart dictionary on ExamRedi."
    });
    const [word, setWord] = useState('');
    const [definition, setDefinition] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hassearched, setHasSearched] = useState(false);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const prompt = `As a study dictionary, provide a concise definition, synonyms, and an example sentence for the academic or UTME-related term: "${word}". Format with markdown.`;
            const result = await sendMessageToAI(prompt, []);
            setDefinition(result);
        } catch (error) {
            setDefinition("Sorry, I couldn't find a definition for that term. Please check your connection or try another word.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Smart Dictionary</h1>
                <p className="text-slate-600 dark:text-slate-400">Instant definitions and examples for any academic term.</p>
            </div>

            <Card className="p-2 sm:p-4">
                <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={word}
                        onChange={(e) => setWord(e.target.value)}
                        placeholder="Enter an academic term (e.g., Photosynthesis, Oxymoron)..."
                        className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-accent transition-all disabled:opacity-50"
                    >
                        {isLoading ? 'Searching...' : 'Lookup'}
                    </button>
                </form>
            </Card>

            {hassearched && (
                <Card>
                    <div className="p-4 sm:p-6 min-h-[200px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <div className="prose dark:prose-invert max-w-none">
                                <div className="flex items-center justify-between gap-4 mb-4">
                                    <h2 className="text-2xl font-bold text-primary capitalize">{word}</h2>
                                    <SpeechButton text={`${word}. ${definition}`} size="sm" variant="ghost" className="bg-slate-50 dark:bg-slate-800/50" />
                                </div>
                                <MarkdownRenderer content={definition} />
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {!hassearched && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    {['Photosynthesis', 'Equilibrium', 'Metaphor', 'Trigonometry', 'Renaissance', 'Cytology'].map(term => (
                        <button
                            key={term}
                            onClick={() => { setWord(term); }}
                            className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-primary transition-colors text-slate-600 dark:text-slate-300"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dictionary;
