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

export type ConfidenceLevel = 'lost' | 'shaky' | 'confident';

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
  type: 'study-hack' | 'tutorial' | 'explanation';
  duration?: string;
}

export interface InlineQuestion {
  id: string;
  triggerHeader: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Topic {
  id: string;
  title: string;
  content?: string;
  description?: string;
  keywords?: string[];
  order?: number;
  videos?: Video[];
  inlineQuestions?: InlineQuestion[];
}

export interface StudyGuide {
  id: string; // subject key like 'biology'
  subject: string;
  topics: Topic[];
  lastUpdated?: string;
  createdAt?: string;
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
  id: string;
  question: string;
  questionDiagram?: string;
  options: { [key: string]: PastQuestionOption }; // e.g., { A: { text: 'Option A', diagram?: 'url' } }
  answer: string; // The key of the correct option, e.g., 'A'
  explanation?: string; // Optional detailed explanation for the answer
  topics?: string[]; // Array of topic slugs
}

export interface PastPaper {
  id: string;
  exam: string;
  subject: string;
  year: number;
  questions: PastQuestion[];
}

export type ExamMode = 'study' | 'practice' | 'mock';

export interface QuizResult {
  id: string;
  paperId: string;
  exam: string;
  subject: string;
  year: number;
  score: number;
  totalQuestions: number;
  userAnswers: { [key: string]: string };
  mode: ExamMode;
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
  year: number;
  exam: string;
}

export interface User {
  name: string;
  subscription: 'free' | 'pro';
  subscriptionExpiry?: string;
  referralCode?: string;
  photoURL?: string;
  aiCredits: number;
  dailyMessageCount: number;
  lastMessageDate: string; // YYYY-MM-DD format
  role: 'user' | 'admin';
  preferredSubjects?: string[];
  studyPlan?: {
    targetScore: number;
    weakSubjects: string[];
    dailyGoal: number;
    examDate?: string; // ISO string
  };
  studyProgress?: {
    [topicId: string]: {
      confidence: ConfidenceLevel;
      lastReviewed: string; // ISO string
    }
  };
}

export type NudgeType = 'HERO_CARD' | 'BOTTOM_SHEET' | 'MODAL';

export interface EngagementNudge {
  id: string;
  title: string;
  message: string;
  type: NudgeType;
  icon?: string;
  actionLabel?: string;
  actionPath?: string;
  ctaColor?: string;
  isRecurring?: boolean;
}