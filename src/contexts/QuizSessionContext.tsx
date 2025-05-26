
"use client";

import type { QuizSession } from '@/lib/types';
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface QuizSessionContextType {
  quizSessions: QuizSession[];
  addQuizSession: (session: QuizSession) => void;
  getQuizSessions: () => QuizSession[];
  getQuizSessionById: (sessionId: string) => QuizSession | undefined;
}

const QuizSessionContext = createContext<QuizSessionContextType | undefined>(undefined);

export function QuizSessionProvider({ children }: { children: React.ReactNode }) {
  const [quizSessions, setQuizSessions] = useState<QuizSession[]>([]);
  const { toast } = useToast();

  const addQuizSession = useCallback((session: QuizSession) => {
    setQuizSessions(prevSessions => [session, ...prevSessions]); // Add new session to the beginning
    toast({
      title: "Quiz Session Saved",
      description: `Session "${session.quizTitle}" completed with score ${session.score}%.`,
      variant: "default",
    });
  }, [toast]);

  const getQuizSessions = useCallback(() => {
    return [...quizSessions]; // Return a copy
  }, [quizSessions]);

  const getQuizSessionById = useCallback((sessionId: string) => {
    return quizSessions.find(session => session.id === sessionId);
  }, [quizSessions]);

  return (
    <QuizSessionContext.Provider value={{ 
      quizSessions, 
      addQuizSession,
      getQuizSessions,
      getQuizSessionById
    }}>
      {children}
    </QuizSessionContext.Provider>
  );
}

export function useQuizSession() {
  const context = useContext(QuizSessionContext);
  if (context === undefined) {
    throw new Error('useQuizSession must be used within a QuizSessionProvider');
  }
  return context;
}
