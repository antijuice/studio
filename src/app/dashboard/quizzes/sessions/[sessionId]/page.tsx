
"use client";

import { useParams, useRouter }  from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';

// Extended mock data for a single session - replace with actual data fetching
const mockSessionDetailsData: { [key: string]: any } = {
  "1": { 
    id: "1", 
    title: "Atomic Structure Basics", 
    subject: "Chemistry", 
    score: 85, 
    date: "2024-07-15", 
    type: "mcq",
    questionsAttempted: [
      { id: "q1", questionText: "What is the charge of a proton?", userAnswer: "+1", correctAnswer: "+1", explanation: "Protons have a positive charge." },
      { id: "q2", questionText: "Where are electrons located in an atom?", userAnswer: "Orbitals", correctAnswer: "Electron Cloud/Orbitals", explanation: "Electrons are found in orbitals around the nucleus." },
      { id: "q3", questionText: "What is an isotope?", userAnswer: "Same protons, diff neutrons", correctAnswer: "Atoms of the same element with different numbers of neutrons.", explanation: "Isotopes differ in mass number but not atomic number." },
    ] 
  },
  "2": { 
    id: "2", 
    title: "Calculus Fundamentals Check", 
    subject: "Mathematics", 
    score: 92, 
    date: "2024-07-12", 
    type: "mcq",
    questionsAttempted: [
       { id: "c1", questionText: "What is the derivative of x^2?", userAnswer: "2x", correctAnswer: "2x", explanation: "Using the power rule, d/dx (x^n) = nx^(n-1)." },
    ]
  },
  "3": { 
    id: "3", 
    title: "World War II Overview", 
    subject: "History", 
    score: 78, 
    date: "2024-07-10", 
    type: "short-answer",
    questionsAttempted: [
      { id: "h1", questionText: "Name one major cause of WWII.", userAnswer: "Treaty of Versailles", correctAnswer: "Multiple causes including Treaty of Versailles, rise of fascism, expansionism.", explanation: "The Treaty of Versailles imposed harsh terms on Germany, contributing to resentment." },
    ]
  },
  "4": { 
    id: "4", 
    title: "Cell Biology Quiz (from PDF)", 
    subject: "Biology", 
    score: 60, 
    date: "2024-07-08", 
    type: "pdf-generated",
    questionsAttempted: [] // No specific questions for this mock item
  },
};


export default function SessionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    setTimeout(() => {
      const foundSession = mockSessionDetailsData[sessionId];
      setSession(foundSession);
      setLoading(false);
    }, 500); // Simulate network delay
  }, [sessionId]);

  if (loading) {
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
        <Card className="max-w-lg mx-auto">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Review: {session.title}</h1>
          <p className="text-muted-foreground">
            Subject: {session.subject} | Score: {session.score}% | Date: {new Date(session.date).toLocaleDateString()}
          </p>
        </div>
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Questions & Answers</CardTitle>
          <CardDescription>Review your answers and the correct solutions for this session.</CardDescription>
        </CardHeader>
        <CardContent>
          {session.questionsAttempted && session.questionsAttempted.length > 0 ? (
            <ul className="space-y-6">
              {session.questionsAttempted.map((q: any, index: number) => (
                <li key={q.id || index} className="p-4 border rounded-lg bg-card shadow-sm">
                  <p className="font-semibold text-lg mb-2">Q{index + 1}: {q.questionText}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium text-muted-foreground">Your Answer:</span> {q.userAnswer}</p>
                    <p className={`${q.userAnswer === q.correctAnswer ? 'text-green-600' : 'text-red-600'}`}>
                      <span className="font-medium">Correct Answer:</span> {q.correctAnswer}
                    </p>
                    {q.explanation && (
                       <p className="text-xs text-muted-foreground italic pt-1">
                         <span className="font-medium">Explanation:</span> {q.explanation}
                       </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground py-4">No detailed question data available for this session in the mock data.</p>
          )}
        </CardContent>
      </Card>
       <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            This is a placeholder page. Full session review functionality with rich details is under development.
          </p>
        </div>
    </div>
  );
}

