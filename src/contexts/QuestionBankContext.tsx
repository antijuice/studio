
"use client";

import type { ExtractedQuestion } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';

interface QuestionBankContextType {
  bankedQuestions: ExtractedQuestion[];
  addQuestionToBank: (question: ExtractedQuestion) => void;
  // Future: removeQuestionFromBank, updateQuestionInBank, etc.
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export function QuestionBankProvider({ children }: { children: ReactNode }) {
  const [bankedQuestions, setBankedQuestions] = useState<ExtractedQuestion[]>([]);

  const addQuestionToBank = useCallback((question: ExtractedQuestion) => {
    setBankedQuestions((prevQuestions) => {
      // Prevent adding duplicates based on the original extracted ID
      if (prevQuestions.some(bq => bq.id === question.id)) {
        // Optionally, update if already exists, or just skip adding
        console.warn(`Question with ID ${question.id} already in bank. Skipping.`);
        return prevQuestions;
      }
      return [...prevQuestions, question];
    });
  }, []);

  return (
    <QuestionBankContext.Provider value={{ bankedQuestions, addQuestionToBank }}>
      {children}
    </QuestionBankContext.Provider>
  );
}

export function useQuestionBank() {
  const context = useContext(QuestionBankContext);
  if (context === undefined) {
    throw new Error('useQuestionBank must be used within a QuestionBankProvider');
  }
  return context;
}
