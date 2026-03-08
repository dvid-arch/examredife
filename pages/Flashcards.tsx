

import React, { useState, useEffect, useMemo } from 'react';
import { useUserProgress } from '../contexts/UserProgressContext.tsx';
import { usePrompt } from '../hooks/usePrompt.ts';
import { useSearchParams } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { Flashcard as FlashcardType, FlashcardDeck } from '../types.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import useSEO from '../hooks/useSEO.ts';
import apiService from '../services/apiService.ts';
import SpeechButton from '../components/SpeechButton.tsx';

// --- ICONS ---
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);
const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);
const FlipIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
    </svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);
const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const CompletionIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);


// --- INITIAL DATA ---
const initialDecks: FlashcardDeck[] = [
    { id: '1', name: 'Organic Chemistry Reactions', subject: 'Chemistry', cards: [{ id: '101', front: 'What is a Grignard Reaction?', back: 'An organometallic chemical reaction in which alkyl, vinyl, or aryl-magnesium halides (Grignard reagents) add to a carbonyl group in an aldehyde or ketone.' }, { id: '102', front: 'What is a Diels-Alder reaction?', back: 'A chemical reaction between a conjugated diene and a substituted alkene, commonly termed the dienophile, to form a substituted cyclohexene derivative.' }, { id: '103', front: 'What is an Aldol Condensation?', back: 'A condensation reaction in organic chemistry in which an enol or an enolate ion reacts with a carbonyl compound to form a β-hydroxyaldehyde or β-hydroxyketone.' }, { id: '104', front: 'What defines a Friedel-Crafts Alkylation?', back: 'A type of electrophilic aromatic substitution that involves the alkylation of an aromatic ring with an alkyl halide using a strong Lewis acid catalyst.' }] },
    { id: '2', name: 'World War II Key Events', subject: 'History', cards: [] },
    { id: '3', name: 'JavaScript Fundamentals', subject: 'Computer Science', cards: [] },
    { id: '4', name: 'Human Anatomy: Bones', subject: 'Biology', cards: [] },
];


// --- STUDY SESSION COMPONENT ---
const GUEST_CARD_LIMIT = 3;

interface StudySessionProps {
    deck: FlashcardDeck;
    onFinish: () => void;
}
const StudySession: React.FC<StudySessionProps> = ({ deck, onFinish }) => {
    const { isAuthenticated, requestLogin } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCards, setKnownCards] = useState<string[]>([]);
    const [needsReviewCards, setNeedsReviewCards] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);

    const { addActivity } = useUserProgress();
    const currentCard = deck.cards[currentIndex];

    // Track study progress
    useEffect(() => {
        if (currentIndex > 0 || isComplete) {
            addActivity({
                id: `flashcard-${deck.id}`,
                title: deck.name,
                subtitle: `${deck.subject} • Flashcards`,
                path: `/flashcards?deck=${deck.id}&study=true`,
                type: 'game',
                progress: Math.round(((currentIndex + (isComplete ? 1 : 0)) / deck.cards.length) * 100),
                score: knownCards.length,
                maxScore: deck.cards.length
            });
        }
    }, [currentIndex, isComplete, deck, knownCards.length, addActivity]);

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleNextCard = (knewIt: boolean) => {
        if (!isAuthenticated && currentIndex >= GUEST_CARD_LIMIT - 1 && currentIndex < deck.cards.length - 1) {
            requestLogin();
            return;
        }

        const cardId = currentCard.id;
        if (knewIt) {
            setKnownCards(prev => [...prev, cardId]);
        } else {
            setNeedsReviewCards(prev => [...prev, cardId]);
        }

        if (currentIndex < deck.cards.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setIsFlipped(false);
        } else {
            setIsComplete(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setIsFlipped(false);
        setKnownCards([]);
        setNeedsReviewCards([]);
        setIsComplete(false);
    };

    // Unified navigation guard
    usePrompt(!isComplete, 'Are you sure you want to leave this study session? Your progress will be lost.');

    if (isComplete) {
        return (
            <Card className="flex flex-col items-center justify-center text-center p-6">
                <CompletionIcon />
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-50 mt-4">Session Complete!</h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">Great job! Here's your summary:</p>
                <div className="flex gap-8 my-6 text-lg">
                    <div>
                        <span className="font-bold text-green-600 text-3xl block">{knownCards.length}</span>
                        <span className="text-slate-600 dark:text-slate-300">Knew This</span>
                    </div>
                    <div>
                        <span className="font-bold text-yellow-600 text-3xl block">{needsReviewCards.length}</span>
                        <span className="text-slate-600 dark:text-slate-300">Needs Review</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleRestart} className="font-semibold text-primary py-2 px-5 rounded-lg border-2 border-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors duration-200">
                        Study Again
                    </button>
                    <button onClick={onFinish} className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors duration-200">
                        Back to Deck
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <button
                    onClick={() => {
                        if (!isComplete) {
                            if (!window.confirm('Back to deck? Your session progress will be lost.')) return;
                        }
                        onFinish();
                    }}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold hover:text-primary transition-colors"
                >
                    <BackArrowIcon />
                    <span>Back to Deck</span>
                </button>
                <div className="font-semibold text-slate-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded-full text-sm">
                    Card {currentIndex + 1} / {deck.cards.length}
                </div>
            </div>

            <div className="max-w-3xl mx-auto relative group">
                <div
                    onClick={handleFlip}
                    className={`w-full aspect-video rounded-2xl p-4 flex items-center justify-center text-center shadow-lg transition-transform duration-500 cursor-pointer select-none ${isFlipped ? 'bg-primary-light dark:bg-primary/20 [transform:rotateY(180deg)]' : 'bg-white dark:bg-slate-700 [transform:rotateY(0deg)]'}`}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className={`transition-opacity duration-300 ${isFlipped ? 'opacity-0' : 'opacity-100'}`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}>
                        <p className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-50">{currentCard.front}</p>
                    </div>
                    <div className={`absolute top-0 left-0 w-full h-full p-4 flex items-center justify-center opacity-0 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0'}`} style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-xl md:text-2xl text-slate-700 dark:text-slate-200">{currentCard.back}</p>
                    </div>
                </div>

                {/* Speech Button positioned overlay */}
                <div className="absolute top-4 right-4 z-10">
                    <SpeechButton
                        text={isFlipped ? currentCard.back : currentCard.front}
                        size="sm"
                        variant="secondary"
                        showText={false}
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                </div>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4">
                {isFlipped ? (
                    <>
                        <button onClick={() => handleNextCard(false)} className="flex-1 flex items-center justify-center gap-2 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 font-bold py-4 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-500/30 transition-colors duration-200">
                            <XIcon />
                            <span>Needs Review</span>
                        </button>
                        <button onClick={() => handleNextCard(true)} className="flex-1 flex items-center justify-center gap-2 bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-300 font-bold py-4 rounded-lg hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors duration-200">
                            <CheckIcon />
                            <span>I Knew This</span>
                        </button>
                    </>
                ) : (
                    <button onClick={handleFlip} className="w-full md:w-1/2 flex items-center justify-center gap-2 bg-white dark:bg-transparent text-primary font-bold py-4 rounded-lg border-2 border-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors duration-200">
                        <FlipIcon />
                        <span>Flip Card</span>
                    </button>
                )}
            </div>
        </div>
    );
};

// --- REMINDER MODAL COMPONENT ---
interface ReminderModalProps {
    decks: FlashcardDeck[];
    onSave: (data: { deckName: string, dateTime: Date }) => void;
    onCancel: () => void;
}
const ReminderModal: React.FC<ReminderModalProps> = ({ decks, onSave, onCancel }) => {
    const [deckId, setDeckId] = useState(decks[0]?.id || '');
    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [time, setTime] = useState('09:00');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDeck = decks.find(d => d.id === deckId);
        if (!selectedDeck) {
            alert('Please select a valid deck.');
            return;
        }

        const dateTime = new Date(`${date}T${time}`);
        if (dateTime <= new Date()) {
            alert('Please select a future date and time for the reminder.');
            return;
        }

        onSave({ deckName: selectedDeck.name, dateTime });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto">
            <Card className="max-w-md w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Set Study Reminder</h2>
                    <div>
                        <label htmlFor="reminderDeck" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deck</label>
                        <select
                            id="reminderDeck"
                            value={deckId}
                            onChange={e => setDeckId(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        >
                            {decks.map(deck => (
                                <option key={deck.id} value={deck.id}>{deck.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="reminderDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input
                                id="reminderDate"
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                min={today}
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="reminderTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time</label>
                            <input
                                id="reminderTime"
                                type="time"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-2">
                        <button type="button" onClick={onCancel} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition">Set Reminder</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};


// --- MAIN COMPONENT ---
const Flashcards: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);

    // Derived state from URL
    const selectedDeckId = searchParams.get('deck');
    const isStudyingParam = searchParams.get('study') === 'true';

    const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
    const [isStudying, setIsStudying] = useState(false);

    const { addActivity } = useUserProgress();

    // Sync state with URL params
    useEffect(() => {
        if (decks.length > 0 && selectedDeckId) {
            const deck = decks.find(d => d.id === selectedDeckId);
            if (deck) {
                setSelectedDeck(deck);
                setIsStudying(isStudyingParam);

                // Track initial view of deck
                addActivity({
                    id: `flashcard-${deck.id}`,
                    title: deck.name,
                    subtitle: `${deck.subject} • Flashcards`,
                    path: `/flashcards?deck=${deck.id}`,
                    type: 'game', // Categorizing as game/interactive
                    progress: 0
                });
            }
        } else {
            setSelectedDeck(null);
            setIsStudying(false);
        }
    }, [selectedDeckId, isStudyingParam, decks, addActivity]);

    const [isDeckFormVisible, setDeckFormVisible] = useState(false);
    const [isCardFormVisible, setCardFormVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isReminderModalVisible, setReminderModalVisible] = useState(false);
    const { isAuthenticated, user, requestLogin } = useAuth();

    useSEO({
        title: "Flashcards",
        description: "Master key concepts with digital flashcards for UTME and WASSCE on ExamRedi."
    });

    // --- FETCH DECKS ---
    useEffect(() => {
        const fetchDecks = async () => {
            if (!isAuthenticated) {
                setDecks(initialDecks);
                setIsLoading(false);
                return;
            }
            try {
                const data = await apiService<FlashcardDeck[]>('/flashcards');
                setDecks(data.length > 0 ? data : initialDecks);
            } catch (error) {
                console.error("Failed to fetch decks:", error);
                setDecks(initialDecks);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDecks();
    }, [isAuthenticated]);

    const isAdmin = user?.role === 'admin';
    const preferredSubjects = user?.preferredSubjects || [];

    const displayDecks = useMemo(() => {
        if (isAdmin || preferredSubjects.length === 0) return decks;
        return decks.filter(deck => {
            const isEnglish = ['english', 'english language', 'use of english'].includes(deck.subject.toLowerCase());
            const isPreferred = preferredSubjects.some(p => p.toLowerCase() === deck.subject.toLowerCase());
            return isEnglish || isPreferred;
        });
    }, [decks, isAdmin, preferredSubjects]);

    // --- DECK HANDLERS ---
    const handleSaveDeck = async (deckData: { name: string, subject: string }) => {
        if (!isAuthenticated) {
            requestLogin();
            return;
        }
        const newDeck: FlashcardDeck = {
            id: Date.now().toString(),
            name: deckData.name,
            subject: deckData.subject,
            cards: [],
        };

        try {
            await apiService('/flashcards', {
                method: 'POST',
                body: newDeck
            });
            setDecks([newDeck, ...decks]);
            setDeckFormVisible(false);
        } catch (error) {
            console.error("Failed to save deck:", error);
            alert("Failed to save deck to server. Please try again.");
        }
    };

    // --- CARD HANDLERS ---
    const handleSaveCard = async (cardData: { front: string, back: string }) => {
        if (!isAuthenticated) {
            requestLogin();
            return;
        }
        if (!selectedDeck) return;
        const newCard: FlashcardType = {
            id: Date.now().toString(),
            front: cardData.front,
            back: cardData.back,
        };
        const updatedDeck = {
            ...selectedDeck,
            cards: [...selectedDeck.cards, newCard]
        };

        try {
            await apiService('/flashcards', {
                method: 'POST',
                body: updatedDeck
            });
            const updatedDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
            setDecks(updatedDecks);
            setSelectedDeck(updatedDeck);
            setCardFormVisible(false);
        } catch (error) {
            console.error("Failed to save card:", error);
            alert("Failed to save card to server.");
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!isAuthenticated) {
            requestLogin();
            return;
        }
        if (!selectedDeck) return;
        if (window.confirm('Are you sure you want to delete this card?')) {
            const updatedDeck = {
                ...selectedDeck,
                cards: selectedDeck.cards.filter(c => c.id !== cardId)
            };

            try {
                await apiService('/flashcards', {
                    method: 'POST',
                    body: updatedDeck
                });
                const updatedDecks = decks.map(d => d.id === selectedDeck.id ? updatedDeck : d);
                setDecks(updatedDecks);
                setSelectedDeck(updatedDeck);
            } catch (error) {
                console.error("Failed to delete card:", error);
                alert("Failed to delete card from server.");
            }
        }
    }

    const handleSetReminder = async (data: { deckName: string, dateTime: Date }) => {
        if (!('Notification' in window)) {
            alert('This browser does not support desktop notifications.');
            setReminderModalVisible(false);
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            alert('Please allow notifications to set reminders.');
            setReminderModalVisible(false);
            return;
        }

        const timeUntilNotification = data.dateTime.getTime() - new Date().getTime();

        if (timeUntilNotification < 0) {
            alert('Cannot set a reminder for a past time.');
            setReminderModalVisible(false);
            return;
        }

        setTimeout(() => {
            new Notification('ExamRedi Study Reminder', {
                body: `It's time to study your flashcard deck: "${data.deckName}"!`,
            });
        }, timeUntilNotification);

        alert(`Reminder set for "${data.deckName}" at ${data.dateTime.toLocaleString()}!`);
        setReminderModalVisible(false);
    };


    // --- RENDER LOGIC ---
    if (selectedDeck) {
        if (isStudying) {
            return <StudySession deck={selectedDeck} onFinish={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('study');
                setSearchParams(params, { replace: true });
            }} />
        }

        const filteredCards = selectedDeck.cards.filter(card =>
            (card.front || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (card.back || '').toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="space-y-6">
                <button onClick={() => { setSearchParams({}); setSearchQuery(''); }} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold hover:text-primary transition-colors">
                    <BackArrowIcon />
                    <span>All Decks</span>
                </button>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{selectedDeck.name}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{selectedDeck.subject}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (selectedDeck.cards.length === 0) {
                                    alert("This deck has no cards. Please add some before studying.");
                                    return;
                                }
                                setSearchParams({ deck: selectedDeck.id, study: 'true' });
                            }}
                            className="font-semibold text-primary py-2 px-5 rounded-lg border-2 border-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={selectedDeck.cards.length === 0}
                            aria-disabled={selectedDeck.cards.length === 0}
                        >
                            Study Deck
                        </button>
                        <button onClick={() => setCardFormVisible(true)} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors duration-200">
                            <PlusIcon />
                            <span>Add Card</span>
                        </button>
                    </div>
                </div>

                {isCardFormVisible && <CardForm onSave={handleSaveCard} onCancel={() => setCardFormVisible(false)} />}

                <Card>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Cards in this Deck ({filteredCards.length})</h2>
                        <div className="relative w-full md:w-1/2 lg:w-1/3">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="Search cards..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                aria-label="Search cards in this deck"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                                    aria-label="Clear search"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-gray-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedDeck.cards.length > 0 ? (
                            filteredCards.length > 0 ? (
                                filteredCards.map((card) => (
                                    <div key={card.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">{card.front}</p>
                                            <p className="text-slate-600 dark:text-slate-300 mt-1">{card.back}</p>
                                        </div>
                                        <button onClick={() => handleDeleteCard(card.id)} className="text-slate-500 hover:text-red-500 transition-colors" aria-label="Delete card">
                                            <TrashIcon />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">No cards found matching your search.</p>
                            )
                        ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-8">This deck is empty. Add your first card!</p>
                        )}
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Flashcard Decks</h1>
                    <p className="text-slate-600 dark:text-slate-400">Select a deck to start studying or create a new one.</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button onClick={() => setReminderModalVisible(true)} className="flex items-center justify-center gap-2 font-semibold text-primary py-2 px-5 rounded-lg border-2 border-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors duration-200 w-full sm:w-auto">
                        <BellIcon />
                        <span>Set Reminder</span>
                    </button>
                    <button onClick={() => setDeckFormVisible(true)} className="flex items-center justify-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors duration-200 w-full sm:w-auto">
                        <PlusIcon />
                        <span>Create New Deck</span>
                    </button>
                </div>
            </div>

            {isDeckFormVisible && <DeckForm onSave={handleSaveDeck} onCancel={() => setDeckFormVisible(false)} />}
            {isReminderModalVisible && <ReminderModal decks={decks} onSave={handleSetReminder} onCancel={() => setReminderModalVisible(false)} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayDecks.map((deck) => (
                    <div key={deck.id} onClick={() => setSearchParams({ deck: deck.id })} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-50">{deck.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{deck.subject}</p>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600 flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-300">{deck.cards.length} cards</span>
                            <span className="font-semibold text-primary">View Deck</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- FORM SUB-COMPONENTS ---

interface DeckFormProps {
    onSave: (data: { name: string, subject: string }) => void;
    onCancel: () => void;
}
const DeckForm: React.FC<DeckFormProps> = ({ onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [subject, setSubject] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert('Deck name is required.'); return; }
        onSave({ name, subject });
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Create New Deck</h2>
                <div>
                    <label htmlFor="deckName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deck Name</label>
                    <input id="deckName" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Biology Chapter 5" className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                    <label htmlFor="deckSubject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject (Optional)</label>
                    <input id="deckSubject" type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Science" className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onCancel} className="font-semibold px-4 py-2">Cancel</button>
                    <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition">Save Deck</button>
                </div>
            </form>
        </Card>
    );
}

interface CardFormProps {
    onSave: (data: { front: string, back: string }) => void;
    onCancel: () => void;
}
const CardForm: React.FC<CardFormProps> = ({ onSave, onCancel }) => {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!front.trim() || !back.trim()) { alert('Both front and back content are required.'); return; }
        onSave({ front, back });
    };

    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-50">Add New Card</h2>
                <div>
                    <label htmlFor="cardFront" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Front</label>
                    <textarea id="cardFront" value={front} onChange={e => setFront(e.target.value)} placeholder="e.g., What is the powerhouse of the cell?" rows={3} className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div>
                    <label htmlFor="cardBack" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Back</label>
                    <textarea id="cardBack" value={back} onChange={e => setBack(e.target.value)} placeholder="e.g., The Mitochondria" rows={3} className="w-full bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" required />
                </div>
                <div className="flex justify-end gap-4">
                    <button type="button" onClick={onCancel} className="font-semibold px-4 py-2">Cancel</button>
                    <button type="submit" className="bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition">Save Card</button>
                </div>
            </form>
        </Card>
    );
};

export default Flashcards;