// Import React to provide the JSX namespace for the JSX.Element type.
import React from 'react';

export interface NavItemType {
  path: string;
  name: string;
  // FIX: Changed from JSX.Element to React.ReactNode to resolve the "Cannot find namespace 'JSX'" error.
  icon: React.ReactNode;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface StudyGuide {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  subject: string;
  cards: Flashcard[];
}

export interface PastQuestionOption {
  text: string;
  diagram?: string;
}

export interface PastQuestion {
  id:string;
  question: string;
  questionDiagram?: string;
  options: { [key: string]: PastQuestionOption }; // e.g., { A: { text: 'Option A', diagram?: 'url' } }
  answer: string; // The key of the correct option, e.g., 'A'
}

export interface PastPaper {
  id: string;
  exam: string;
  subject: string;
  year: number;
  questions: PastQuestion[];
}

export interface QuizResult {
  id: string;
  paperId: string;
  exam: string;
  subject: string;
  year: number;
  score: number;
  totalQuestions: number;
  userAnswers: { [key: string]: string };
  completedAt: number;
}

export interface MemoryCardType {
  id: string;
  matchId: string;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  justMatched?: boolean;
}

export interface LeaderboardScore {
  name: string;
  score: number;
  totalQuestions: number;
  date: number;
}

export interface ChallengeQuestion extends PastQuestion {
  subject: string;
}

export interface User {
  name: string;
  subscription: 'free' | 'pro';
  aiCredits: number;
  dailyMessageCount: number;
  lastMessageDate: string; // YYYY-MM-DD format
  role: 'user' | 'admin';
}