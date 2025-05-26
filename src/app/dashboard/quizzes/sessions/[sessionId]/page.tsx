
"use client";

import { useParams, useRouter }  from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Info, Loader2, MessageSquareWarning, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { useQuizSession } from '@/contexts/QuizSessionContext';
import type { QuizSession, UserAnswer } from '@/lib/types';
import { MathText } from '@/components/ui/MathText';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';


export default function SessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const { getQuizSessionById } = useQuizSession();
  const [session, setSession] = useState<QuizSession | null | undefined>(undefined); // undefined for loading, null for not found
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simulate fetching data, context is already client-side so no real delay needed
    // but keeping timeout for potential future async fetching.
    setTimeout(() => {
      const foundSession = getQuizSessionById(sessionId);
      setSession(foundSession);
      setLoading(false);
    }, 100); 
  }, [sessionId, getQuizSessionById]);

  if (loading || session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4 md:p-8 text-center">
         <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        <Card className="max-w-lg mx-auto shadow-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>The quiz session (ID: {sessionId}) you are looking for does not exist or could not be loaded.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col items-start">
         <Button onClick={() => router.back()} variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Past Sessions
          </Button>
        <div className="w-full">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Review: {session.quizTitle}</h1>
          <p className="text-muted-foreground">
            {session.subject && `Subject: ${session.subject} | `} 
            {session.topic && `Topic: ${session.topic} | `}
            Score: <Badge variant={session.score >= 80 ? "default" : session.score >=60 ? "secondary" : "destructive"}>{session.score}%</Badge> | 
            Date: {new Date(session.completedAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Questions & Answers</CardTitle>
          <CardDescription>Review your answers and the correct solutions for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          {session.answers && session.answers.length > 0 ? (
            <ul className="space-y-6">
              {session.answers.map((ans: UserAnswer, index: number) => (
                <li key={ans.questionId || index} className={`p-4 border rounded-lg shadow-sm ${ans.isCorrect ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                  <p className="font-semibold text-lg mb-2 flex items-start gap-2">
                    <span className="text-primary">{index + 1}.</span>
                    <MathText text={ans.questionText} className="flex-1" />
                  </p>

                  {ans.questionType === 'mcq' && ans.options && (
                    <div className="ml-6 mb-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Options:</p>
                      {ans.options.map((opt, optIdx) => (
                        <div key={optIdx} className={`flex items-center gap-2 text-sm rounded px-2 py-1
                          ${opt === ans.correctAnswer ? 'text-green-700 dark:text-green-500 font-semibold' : ''}
                          ${opt === ans.userSelection && opt !== ans.correctAnswer ? 'text-red-700 dark:text-red-500 line-through' : ''}
                          ${opt === ans.userSelection && opt === ans.correctAnswer ? 'bg-green-500/10' : ''}
                        `}>
                          {opt === ans.correctAnswer && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                          {opt !== ans.correctAnswer && opt === ans.userSelection && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                          {(opt !== ans.correctAnswer && opt !== ans.userSelection) && <span className="w-4 h-4 flex-shrink-0 opacity-0"><CheckCircle/></span> }
                          <MathText text={opt} className="flex-1" />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="ml-6 space-y-1 text-sm">
                     <p>
                      <span className="font-medium text-muted-foreground">Your Answer: </span> 
                      {ans.userSelection ? <MathText text={ans.userSelection} className={`inline ${ans.isCorrect ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`} /> : <span className="italic text-orange-500">Not answered</span>}
                      {ans.isCorrect ? <CheckCircle className="inline h-4 w-4 ml-1 text-green-600" /> : ans.userSelection ? <XCircle className="inline h-4 w-4 ml-1 text-red-600" /> : null}
                    </p>
                    {!ans.isCorrect && ans.questionType === 'mcq' && (
                      <p className="text-green-700 dark:text-green-500">
                        <span className="font-medium">Correct Answer: </span> 
                        <MathText text={ans.correctAnswer} className="inline"/>
                      </p>
                    )}
                     {ans.questionType !== 'mcq' && ( // For short answer, etc.
                         <p className={`${ans.isCorrect ? 'text-green-700 dark:text-green-500' : 'text-red-700 dark:text-red-500'}`}>
                            <span className="font-medium">Expected Answer:</span> <MathText text={ans.correctAnswer} className="inline" />
                         </p>
                     )}
                  </div>

                  {ans.explanation && (
                       <Alert className="mt-3 ml-6 bg-muted/30 border-border">
                         <Info className="h-4 w-4 text-blue-500" />
                         <AlertTitle className="text-sm font-medium">Explanation</AlertTitle>
                         <AlertDescription className="text-xs"><MathText text={ans.explanation} /></AlertDescription>
                       </Alert>
                    )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground py-4 text-center">No detailed question data available for this session.</p>
          )}
        </CardContent>
      </Card>
       <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            This session review page uses locally stored data for the current browser session.
          </p>
        </div>
    </div>
  );
}
