
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, Loader2, Sparkles } from 'lucide-react';
import type { ExtractQuestionsFromPdfOutput } from '@/lib/types';
import { ExtractQuestionsForm } from '@/components/quiz/ExtractQuestionsForm';
import { ExtractedQuestionsDisplay } from '@/components/quiz/ExtractedQuestionsDisplay';

export default function ExtractPdfPage() {
  const [extractionResult, setExtractionResult] = useState<ExtractQuestionsFromPdfOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleExtractionComplete = (data: ExtractQuestionsFromPdfOutput) => {
    setExtractionResult(data);
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Extract Questions from PDF</CardTitle>
          </div>
          <CardDescription>
            Upload a PDF document, and our AI will attempt to extract structured questions, tags, and categories from it.
            This is the first step towards building a collaborative question bank.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractQuestionsForm 
            onExtractionComplete={handleExtractionComplete} 
            setIsLoading={setIsLoading} 
          />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Extracting questions, this may take a moment...</p>
        </div>
      )}

      {extractionResult && !isLoading && (
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Extracted Questions</CardTitle>
            <CardDescription>
              Review the questions extracted by the AI. Future updates will allow adding these to a question bank.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExtractedQuestionsDisplay extractionResult={extractionResult} />
          </CardContent>
        </Card>
      )}

      {!extractionResult && !isLoading && (
         <Alert className="mt-8">
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Ready to Extract?</AlertTitle>
            <AlertDescription>
              Upload a PDF using the form above. You can also provide a topic hint to help the AI.
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
}
