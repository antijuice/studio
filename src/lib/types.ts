
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
  questions: Question[]; // Array of MCQ or ShortAnswerQuestion
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
  quizHistory: QuizSession[]; // This will be populated from context/DB
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon; 
  achievedDate: Date;
};

// Updated UserAnswer to include more context for review
export type UserAnswer = {
  questionId: string;
  questionText: string; // Original question text
  questionType: Question['type'];
  options?: string[]; // Original options for MCQ
  userSelection?: string; // User's selected option string for MCQ
  correctAnswer: string; // Correct answer string
  explanation?: string; // Original explanation
  isCorrect: boolean;
};

export type QuizSession = {
  id: string; // Unique ID for this session
  quizId: string; // ID of the Quiz object taken
  quizTitle: string;
  score: number; // Percentage
  completedAt: Date;
  answers: UserAnswer[]; // Detailed record of answers
  subject?: string; // Copied from quiz for display convenience
  topic?: string; // Copied from quiz for display convenience
  type?: Question['type'] | 'mixed' | 'pdf-generated' | 'custom'; // General type of quiz
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

export type ExtractedQuestion = {
  id: string; 
  questionText: string;
  questionType: 'mcq' | 'short_answer' | 'true_false' | 'fill_in_the_blank' | 'unknown';
  options?: string[];
  answer?: string;
  explanation?: string;
  suggestedTags: string[];
  suggestedCategory: string;
  relevantImageDescription?: string;
  marks?: number;
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

export type ExtractQuestionsFromPdfInput = {
  pdfDataUri: string;
  topicHint?: string;
  globalTags?: string; 
  autoSuggestMcqAnswers?: boolean; 
  autoSuggestExplanations?: boolean; 
};

export type SaveQuestionToBankOutput = {
  success: boolean;
  questionId?: string; 
  message: string;
};

export type SuggestMcqAnswerInput = {
  questionText: string;
  options: string[];
};

export type SuggestMcqAnswerOutput = {
  suggestedAnswer: string;
};

export type SuggestExplanationInput = {
  questionText: string;
  questionType: ExtractedQuestion['questionType'];
  options?: string[]; 
  answer?: string;    
};

export type SuggestExplanationOutput = {
  suggestedExplanation: string;
};
