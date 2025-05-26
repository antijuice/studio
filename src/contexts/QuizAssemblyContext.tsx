
"use client";

import type { ExtractedQuestion } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QuizAssemblyContextType {
  assembledQuestions: ExtractedQuestion[];
  addQuestionToAssembly: (question: ExtractedQuestion) => void;
  removeQuestionFromAssembly: (questionId: string) => void;
  isQuestionInAssembly: (questionId: string) => boolean;
  getAssemblyCount: () => number;
  getAssembledQuestions: () => ExtractedQuestion[];
  clearAssembly: () => void;
}

const QuizAssemblyContext = createContext<QuizAssemblyContextType | undefined>(undefined);

export function QuizAssemblyProvider({ children }: { children: React.ReactNode }) {
  const [assembledQuestions, setAssembledQuestions] = useState<ExtractedQuestion[]>([]);
  const { toast } = useToast();

  const addQuestionToAssembly = useCallback((question: ExtractedQuestion) => {
    setAssembledQuestions((prevQuestions) => {
      if (prevQuestions.some(aq => aq.id === question.id)) {
        toast({ title: "Already Added", description: "This question is already in your quiz assembly.", variant: "default" });
        return prevQuestions;
      }
      if (question.questionType !== 'mcq') {
        toast({ title: "Unsupported Type", description: "Only MCQ questions can be added to the assembly at this time.", variant: "default" });
        return prevQuestions;
      }
      toast({ title: "Question Added", description: `"${question.questionText.substring(0,30)}..." added to assembly.` });
      return [...prevQuestions, question];
    });
  }, [toast]);

  const removeQuestionFromAssembly = useCallback((questionId: string) => {
    setAssembledQuestions((prevQuestions) => {
      const questionToRemove = prevQuestions.find(q => q.id === questionId);
      if (questionToRemove) {
        toast({ title: "Question Removed", description: `"${questionToRemove.questionText.substring(0,30)}..." removed from assembly.` });
      }
      return prevQuestions.filter(q => q.id !== questionId);
    });
  }, [toast]);

  const isQuestionInAssembly = useCallback((questionId: string) => {
    return assembledQuestions.some(q => q.id === questionId);
  }, [assembledQuestions]);

  const getAssemblyCount = useCallback(() => {
    return assembledQuestions.length;
  }, [assembledQuestions]);

  const getAssembledQuestions = useCallback(() => {
    return [...assembledQuestions]; // Return a copy
  }, [assembledQuestions]);
  
  const clearAssembly = useCallback(() => {
    setAssembledQuestions([]);
    toast({ title: "Assembly Cleared", description: "All selected questions have been removed from the assembly." });
  }, [toast]);

  return (
    <QuizAssemblyContext.Provider value={{ 
      assembledQuestions, 
      addQuestionToAssembly, 
      removeQuestionFromAssembly, 
      isQuestionInAssembly,
      getAssemblyCount,
      getAssembledQuestions,
      clearAssembly
    }}>
      {children}
    </QuizAssemblyContext.Provider>
  );
}

export function useQuizAssembly() {
  const context = useContext(QuizAssemblyContext);
  if (context === undefined) {
    throw new Error('useQuizAssembly must be used within a QuizAssemblyProvider');
  }
  return context;
}
