
import type { LucideIcon } from 'lucide-react';

export interface BaseQuestion {
  id: string;
  question: string;
  explanation: string;
}

export interface MCQ extends BaseQuestion {
  type: 'mcq';
  options: string[];
  answer: string; // The correct option string
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short-answer';
  modelAnswer?: string;
}

export type Question = MCQ | ShortAnswerQuestion;

export type Quiz = {
  id: string;
  title: string;
  questions: Question[];
  subject?: string;
  topic?: string;
  syllabus?: string;
  createdAt: Date;
  createdBy?: string; // User ID
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  eloRating: number;
  experiencePoints: number;
  level: number;
  badges: Badge[];
  quizHistory: QuizSession[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; 
  achievedDate: Date;
};

export type QuizSession = {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  completedAt: Date;
  answers: UserAnswer[];
};

export type UserAnswer = {
  questionId: string;
  answer: string | string[]; // string for MCQ, string[] for multiple select or ordered short answer parts
  isCorrect?: boolean;
};

// For AI generated quiz from custom input (matching AI flow output)
export type CustomQuizGenOutput = {
  quiz: {
    question: string;
    options: string[];
    answer:string;
    explanation: string;
  }[];
};

// For AI generated quiz from PDF (matching AI flow output)
export type PdfQuizGenOutput = {
  quiz: string; // JSON string of quiz questions
};

// For AI evaluated short answer (matching AI flow output)
export type ShortAnswerEvaluationOutput = {
  score: number;
  feedback: string;
};

// For AI extracted questions from PDF (matching AI flow output)
// Adding a unique identifier for client-side state management
export type ExtractedQuestion = {
  id: string; // Added for local state management
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'true_false' | 'fill_in_the_blank' | 'unknown';
  options?: string[];
  answer?: string;
  explanation?: string;
  suggestedTags: string[];
  suggestedCategory: string;
  relevantImageDescription?: string;
  marks?: number; // Added marks field
};

export type ExtractQuestionsFromPdfOutput = {
  extractedQuestions: ExtractedQuestion[];
};


// For form inputs
export type CustomQuizFormParams = {
  syllabus: string;
  subject: string;
  topic: string;
  numQuestions: number;
};

export type PdfQuizFormParams = {
  pdfDataUri: string;
  quizDescription?: string;
};

export type ShortAnswerFormParams = {
  question: string;
  userAnswer: string;
  modelAnswer?: string;
};

// For the new extract questions flow input
export type ExtractQuestionsFromPdfInput = {
  pdfDataUri: string;
  topicHint?: string;
  globalTags?: string; // Comma-separated tags
};

// Output for saving a question to the bank (can be expanded later)
export type SaveQuestionToBankOutput = {
  success: boolean;
  questionId?: string; // ID of the saved question in the bank
  message: string;
};

