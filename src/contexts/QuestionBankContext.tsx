
"use client";

import type { ExtractedQuestion } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast'; // Added for toast notifications

interface QuestionBankContextType {
  bankedQuestions: ExtractedQuestion[];
  addQuestionToBank: (question: ExtractedQuestion) => void;
  removeQuestionFromBank: (questionId: string) => void; // New function
}

const QuestionBankContext = createContext<QuestionBankContextType | undefined>(undefined);

export function QuestionBankProvider({ children }: { children: ReactNode }) {
  const [bankedQuestions, setBankedQuestions] = useState<ExtractedQuestion[]>([]);
  const { toast } = useToast(); // Initialize toast

  const addQuestionToBank = useCallback((question: ExtractedQuestion) => {
    setBankedQuestions((prevQuestions) => {
      if (prevQuestions.some(bq => bq.id === question.id)) {
        console.warn(`Question with ID ${question.id} already in bank. Skipping.`);
        // Optionally, toast here if you want to notify user of skip
        return prevQuestions;
      }
      // Toast for successful addition is handled by the calling component (ExtractedQuestionsDisplay)
      return [...prevQuestions, question];
    });
  }, []);

  const removeQuestionFromBank = useCallback((questionId: string) => {
    const questionToRemove = bankedQuestions.find(q => q.id === questionId);
    setBankedQuestions((prevQuestions) =>
      prevQuestions.filter((question) => question.id !== questionId)
    );
    if (questionToRemove) {
      toast({
        title: "Question Removed from Bank",
        description: `"${questionToRemove.questionText.substring(0, 30)}..." has been removed from your current session bank.`,
        variant: "default",
      });
    }
  }, [bankedQuestions, toast]);

  return (
    <QuestionBankContext.Provider value={{ bankedQuestions, addQuestionToBank, removeQuestionFromBank }}>
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
