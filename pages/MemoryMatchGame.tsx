
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card.tsx';
import { memoryMatchConcepts } from '../data/gameData.ts';
import { MemoryCardType } from '../types.ts';

// Helper function to shuffle an array
const shuffleArray = (array: any[]) => {
  return [...array].sort(() => Math.random() - 0.5);
};

// Function to initialize the game board
const initializeBoard = (): MemoryCardType[] => {
  const cards: MemoryCardType[] = [];
  memoryMatchConcepts.forEach((concept, index) => {
    const matchId = `match-${index}`;
    cards.push({
      id: `term-${index}`,
      matchId,
      content: concept.term,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: `def-${index}`,
      matchId,
      content: concept.definition,
      isFlipped: false,
      isMatched: false,
    });
  });
  return shuffleArray(cards);
};

const MemoryMatchGame: React.FC = () => {
    const [cards, setCards] = useState<MemoryCardType[]>(initializeBoard());
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (flippedCards.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedCards;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            setMoves(prev => prev + 1);

            if (firstCard.matchId === secondCard.matchId) {
                // It's a match
                setCards(prevCards => 
                    prevCards.map(card => 
                        card.matchId === firstCard.matchId ? { ...card, isMatched: true, justMatched: true } : card
                    )
                );
                setMatchedPairs(prev => prev + 1);
                setFlippedCards([]);

                setTimeout(() => {
                    setCards(prevCards => 
                        prevCards.map(card => 
                            card.justMatched ? { ...card, justMatched: false } : card
                        )
                    );
                    setIsChecking(false);
                }, 800);
            } else {
                // Not a match
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map((card, index) =>
                            index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
                        )
                    );
                    setFlippedCards([]);
                    setIsChecking(false);
                }, 1000);
            }
        }
    }, [flippedCards, cards]);

    useEffect(() => {
        if (memoryMatchConcepts.length > 0 && matchedPairs === memoryMatchConcepts.length) {
            setIsGameComplete(true);
        }
    }, [matchedPairs]);

    const handleCardClick = (index: number) => {
        if (isChecking || cards[index].isFlipped || cards[index].isMatched || flippedCards.length === 2) {
            return;
        }
        
        setCards(prevCards => 
            prevCards.map((card, i) => 
                i === index ? { ...card, isFlipped: true } : card
            )
        );
        setFlippedCards(prev => [...prev, index]);
    };
    
    const restartGame = () => {
        setCards(initializeBoard());
        setFlippedCards([]);
        setMatchedPairs(0);
        setMoves(0);
        setIsGameComplete(false);
        setIsChecking(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Memory Match</h1>
                    <p className="text-slate-600">Match the terms with their definitions.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="font-semibold text-lg bg-white px-4 py-2 rounded-lg shadow-sm">Moves: <span className="text-primary font-bold">{moves}</span></div>
                    <button onClick={restartGame} className="font-semibold text-primary py-2 px-4 rounded-lg border-2 border-primary hover:bg-primary-light transition-colors">
                        Restart Game
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ perspective: '1000px' }}>
                {cards.map((card, index) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(index)}
                        className={`h-40 rounded-lg shadow-md transition-transform duration-500 cursor-pointer flex items-center justify-center p-3 text-center text-sm md:text-base select-none
                            ${card.isFlipped || card.isMatched ? 'bg-white [transform:rotateY(180deg)]' : 'bg-primary hover:bg-accent [transform:rotateY(0deg)]'}
                            ${card.isMatched ? 'border-4 border-green-500 bg-green-50 cursor-not-allowed' : ''}
                            ${card.justMatched ? 'animate-pulse-success' : ''}`}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Card Back */}
                        <div className="absolute w-full h-full flex items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        {/* Card Front */}
                        <div className="absolute w-full h-full p-3 flex items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <p className="text-slate-800 font-semibold">{card.content}</p>
                        </div>
                    </div>
                ))}
            </div>

            {isGameComplete && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                    <Card className="text-center p-6 max-w-sm w-full animate-fade-in-up">
                        <h2 className="text-3xl font-bold text-primary mb-4">Congratulations!</h2>
                        <p className="text-slate-700 text-lg mb-6">You completed the game in <span className="font-bold">{moves}</span> moves.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={restartGame} className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors">
                                Play Again
                            </button>
                             <Link to="/games" className="flex-1 font-semibold text-primary py-3 px-6 rounded-lg border-2 border-primary hover:bg-primary-light transition-colors">
                                Back to Games
                            </Link>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default MemoryMatchGame;