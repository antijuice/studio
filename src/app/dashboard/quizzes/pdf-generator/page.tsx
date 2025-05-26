"use client";

import React, { useState } from 'react';
import { PdfQuizForm } from '@/components/quiz/PdfQuizForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomQuizGenOutput, Question, MCQ } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2 } from 'lucide-react';
import { QuizDisplay } from '@/components/quiz/QuizDisplay';

export default function PdfQuizGeneratorPage() {
  const [generatedQuiz, setGeneratedQuiz] = useState<MCQ[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizGenerated = (data: CustomQuizGenOutput) => {
     const formattedQuestions: MCQ[] = data.quiz.map((q, index) => ({
      id: `pdf-${index}-${new Date().getTime()}`, // Basic unique ID
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      type: 'mcq',
    }));
    setGeneratedQuiz(formattedQuestions);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Quiz from PDF Generator</CardTitle>
          <CardDescription>
            Upload your study material as a PDF, and let our AI create a quiz for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PdfQuizForm onQuizGenerated={handleQuizGenerated} setIsLoading={setIsLoading} />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Analyzing PDF and generating quiz...</p>
        </div>
      )}

      {generatedQuiz && !isLoading && (
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Your PDF-Generated Quiz</CardTitle>
          </CardHeader>
          <CardContent>
             <QuizDisplay quiz={{ id: 'pdf-generated', title: 'Quiz from PDF', questions: generatedQuiz, createdAt: new Date() }} />
          </CardContent>
        </Card>
      )}

      {!generatedQuiz && !isLoading && (
         <Alert className="mt-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Upload Your Material</AlertTitle>
            <AlertDescription>
              Choose a PDF file and optionally add instructions to generate a quiz based on its content.
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
}
