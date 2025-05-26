"use client";

import React, { useState } from 'react';
import { ShortAnswerForm } from '@/components/quiz/ShortAnswerForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import type { ShortAnswerEvaluationOutput } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, CheckCircle, Lightbulb, Loader2, Star, XCircle } from 'lucide-react';

export default function ShortAnswerPage() {
  const [evaluationResult, setEvaluationResult] = useState<ShortAnswerEvaluationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEvaluationComplete = (data: ShortAnswerEvaluationOutput) => {
    setEvaluationResult(data);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">AI Short Answer Evaluation</CardTitle>
          <CardDescription>
            Test your understanding with short answer questions. Our AI will provide a score and constructive feedback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShortAnswerForm onEvaluationComplete={handleEvaluationComplete} setIsLoading={setIsLoading} />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Evaluating your answer, please wait...</p>
        </div>
      )}

      {evaluationResult && !isLoading && (
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
                <Bot className="text-primary"/> AI Evaluation Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Score:</h3>
              <div className="flex items-center gap-2">
                <Progress value={evaluationResult.score * 100} className="w-full h-4" />
                <span className="font-bold text-lg text-primary">{(evaluationResult.score * 100).toFixed(0)}%</span>
              </div>
               {evaluationResult.score * 100 >= 70 ? (
                <p className="text-sm text-green-500 flex items-center gap-1 mt-1"><CheckCircle className="h-4 w-4" /> Great job!</p>
              ) : evaluationResult.score * 100 >= 40 ? (
                <p className="text-sm text-yellow-500 flex items-center gap-1 mt-1"><Star className="h-4 w-4" /> Good effort, room to improve.</p>
              ) : (
                 <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><XCircle className="h-4 w-4" /> Needs more work.</p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Feedback:</h3>
              <div className="p-4 bg-muted/50 rounded-md border border-border">
                <p className="whitespace-pre-wrap text-foreground/90">{evaluationResult.feedback}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!evaluationResult && !isLoading && (
         <Alert className="mt-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Ready for Feedback?</AlertTitle>
            <AlertDescription>
              Enter a question, your answer, and optionally a model answer to get AI-powered evaluation.
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
}
