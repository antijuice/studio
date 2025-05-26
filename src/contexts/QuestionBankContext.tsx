
"use client";

// This context is no longer needed as QuestionBankPage will fetch directly from Firestore.
// Keeping the file to avoid breaking imports immediately, but it should be removed
// once QuestionBankPage is fully refactored.

import type { ExtractedQuestion } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast'; 

interface QuestionBankContextType {
  // bankedQuestions: ExtractedQuestion[]; // Will be fetched directly by QuestionBankPage
  // addQuestionToBank: (question: ExtractedQuestion) => void; // Will be handled by server action
  // removeQuestionFromBank: (questionId: string) => void; // Will be handled by server action
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export function QuestionBankProvider({ children }: { children: ReactNode }) {
  // const [bankedQuestions, setBankedQuestions] = useState<ExtractedQuestion[]>([]);
  // const { toast } = useToast(); 

  // const addQuestionToBank = useCallback((question: ExtractedQuestion) => {
  //   setBankedQuestions((prevQuestions) => {
  //     if (prevQuestions.some(bq => bq.id === question.id)) {
  //       console.warn(`QuestionBankContext: Question with ID ${question.id} already in bank. Skipping.`);
  //       return prevQuestions;
  //     }
  //     return [...prevQuestions, question];
  //   });
  // }, []);

  // const removeQuestionFromBank = useCallback((questionId: string) => {
  //   const questionToRemove = bankedQuestions.find(q => q.id === questionId);
  //   setBankedQuestions((prevQuestions) =>
  //     prevQuestions.filter((question) => question.id !== questionId)
  //   );
  //   if (questionToRemove) {
  //     toast({
  //       title: "Question Removed from Bank",
  //       description: `"${questionToRemove.questionText.substring(0, 30)}..." has been removed from your current session bank.`,
  //       variant: "default",
  //     });
  //   }
  // }, [bankedQuestions, toast]);
  
  // The context is now essentially empty as data is fetched directly.
  const value = {};


  return (
    <QuestionBankContext.Provider value={value}>
      {children}
    </QuestionBankContext.Provider>
  );
}

export function useQuestionBank() {
  const context = useContext(QuestionBankContext);
  if (context === undefined) {
    throw new Error('useQuestionBank must be used within a QuestionBankProvider. However, this context is deprecated.');
  }
  return context;
}
