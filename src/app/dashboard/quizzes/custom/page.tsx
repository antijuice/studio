"use client";

import React, { useState } from 'react';
import { CustomQuizForm } from '@/components/quiz/CustomQuizForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CustomQuizGenOutput, Question, MCQ } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2 } from 'lucide-react';
import { QuizDisplay } from '@/components/quiz/QuizDisplay'; // We'll create this component

export default function CustomQuizPage() {
  const [generatedQuiz, setGeneratedQuiz] = useState<MCQ[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizGenerated = (data: CustomQuizGenOutput) => {
    const formattedQuestions: MCQ[] = data.quiz.map((q, index) => ({
      id: `custom-${index}-${new Date().getTime()}`, // Basic unique ID
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
          <CardTitle className="text-3xl font-bold text-primary">Custom Quiz Generator</CardTitle>
          <CardDescription>
            Tailor your learning experience. Specify your syllabus, subject, and topic to generate a personalized quiz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomQuizForm onQuizGenerated={handleQuizGenerated} setIsLoading={setIsLoading} />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Generating your quiz, please wait...</p>
        </div>
      )}

      {generatedQuiz && !isLoading && (
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Your Generated Quiz</CardTitle>
          </CardHeader>
          <CardContent>
            <QuizDisplay quiz={{ id: 'custom-generated', title: 'Custom Quiz', questions: generatedQuiz, createdAt: new Date() }} />
          </CardContent>
        </Card>
      )}

      {!generatedQuiz && !isLoading && (
         <Alert className="mt-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Ready to Learn?</AlertTitle>
            <AlertDescription>
              Fill out the form above to generate your first custom quiz. The AI will craft questions based on your input.
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
}
