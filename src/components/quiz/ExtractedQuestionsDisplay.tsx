
"use client";

import React, { useState } from 'react';
import type { ExtractQuestionsFromPdfOutput, ExtractedQuestion, SaveQuestionToBankOutput } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookText, CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon, Info, ListOrdered, Save, Tag, Type, XCircle, Loader2, SigmaSquare } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { saveQuestionToBankAction } from '@/app/actions/quizActions';

interface ExtractedQuestionsDisplayProps {
  extractionResult: ExtractQuestionsFromPdfOutput;
}

const questionTypeLabels: Record<ExtractedQuestion['questionType'], string> = {
  mcq: 'Multiple Choice',
  short_answer: 'Short Answer',
  true_false: 'True/False',
  fill_in_the_blank: 'Fill in the Blank',
  unknown: 'Unknown Type',
};

type QuestionSaveStateType = {
  [questionId: string]: {
    isLoading: boolean;
    isSaved: boolean;
    error?: string;
  }
};

export function ExtractedQuestionsDisplay({ extractionResult }: ExtractedQuestionsDisplayProps) {
  const { toast } = useToast();
  const [saveStates, setSaveStates] = useState<QuestionSaveStateType>({});

  if (!extractionResult || extractionResult.extractedQuestions.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>No Questions Extracted</AlertTitle>
        <AlertDescription>
          The AI could not find any questions in the provided PDF, or the PDF might be empty.
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleSaveToBank = async (question: ExtractedQuestion) => {
    setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: true, isSaved: false } }));
    toast({
      title: "Saving Question...",
      description: `Attempting to save "${question.questionText.substring(0, 30)}..." to the bank.`,
    });

    try {
      const result: SaveQuestionToBankOutput = await saveQuestionToBankAction(question);
      if (result.success) {
        setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: true } }));
        toast({
          title: "Question Saved (Simulated)",
          description: result.message,
        });
      } else {
        // This case might not be hit if action throws error directly
        setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: false, error: result.message } }));
        toast({
          variant: "destructive",
          title: "Save Failed (Simulated)",
          description: result.message,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during save.";
      setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: false, error: errorMessage } }));
      toast({
        variant: "destructive",
        title: "Error Saving Question",
        description: errorMessage,
      });
    }
  };


  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {extractionResult.extractedQuestions.map((item, index) => {
          const currentSaveState = saveStates[item.id] || { isLoading: false, isSaved: false };
          return (
            <AccordionItem value={item.id} key={item.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-2">
                  <span className="font-semibold text-left md:truncate flex-1 mr-2">
                    Q{index + 1}: {item.questionText.substring(0, 80)}{item.questionText.length > 80 ? '...' : ''}
                  </span>
                  <div className="flex items-center gap-2 mt-1 md:mt-0 flex-shrink-0">
                    {item.marks !== undefined && <Badge variant="outline" className="flex items-center gap-1"><SigmaSquare className="h-3 w-3"/> {item.marks}</Badge>}
                    <Badge variant="outline">{questionTypeLabels[item.questionType]}</Badge>
                    <Badge variant="secondary">{item.suggestedCategory}</Badge>
                    {currentSaveState.isSaved && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Saved</Badge>}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 p-1">
                  <div className="flex justify-between items-start">
                      <div>
                        <p><strong><BookText className="inline h-4 w-4 mr-1" />Question:</strong> {item.questionText}</p>
                        {item.marks !== undefined && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong><SigmaSquare className="inline h-4 w-4 mr-1" />Marks:</strong> {item.marks}
                          </p>
                        )}
                      </div>
                      <Button 
                          variant={currentSaveState.isSaved ? "default" : "outline"}
                          size="sm" 
                          onClick={() => handleSaveToBank(item)}
                          className={`ml-4 flex-shrink-0 ${currentSaveState.isSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                          disabled={currentSaveState.isLoading || currentSaveState.isSaved}
                      >
                          {currentSaveState.isLoading ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : currentSaveState.isSaved ? (
                            <CheckCircle className="mr-2 h-3 w-3" />
                          ) : (
                            <Save className="mr-2 h-3 w-3" />
                          )}
                          {currentSaveState.isLoading ? "Saving..." : currentSaveState.isSaved ? "Saved" : "Save to Bank"}
                      </Button>
                  </div>
                  
                  {item.questionType === 'mcq' && item.options && item.options.length > 0 && (
                    <div>
                      <strong><ListOrdered className="inline h-4 w-4 mr-1" />Options:</strong>
                      <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                        {item.options.map((opt, optIndex) => (
                          <li key={`${item.id}-opt-${optIndex}`} className={opt === item.answer ? 'text-green-600 font-medium' : ''}>
                            {opt}
                            {opt === item.answer && <CheckCircle className="inline h-4 w-4 ml-2 text-green-600" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.answer && (
                    <p className="text-green-700 dark:text-green-400">
                      <strong><CheckCircle className="inline h-4 w-4 mr-1" />Correct Answer:</strong> {item.answer}
                    </p>
                  )}

                  {item.explanation && (
                    <Alert className="bg-muted/40">
                      <Info className="inline h-4 w-4 mr-1" />
                      <AlertTitle className="font-semibold">Explanation</AlertTitle>
                      <AlertDescription>{item.explanation}</AlertDescription>
                    </Alert>
                  )}

                  {item.relevantImageDescription && (
                    <Alert variant="default" className="mt-2">
                      <ImageIcon className="h-4 w-4" />
                      <AlertTitle className="font-semibold">Relevant Image Information</AlertTitle>
                      <AlertDescription>
                        {item.relevantImageDescription}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div>
                    <strong><Tag className="inline h-4 w-4 mr-1" />Suggested Tags:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.suggestedTags.map(tag => (
                        <Badge key={`${item.id}-tag-${tag}`} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                   <p><strong><Type className="inline h-4 w-4 mr-1" />Suggested Category:</strong> {item.suggestedCategory}</p>
                   {currentSaveState.error && (
                     <Alert variant="destructive" className="mt-2">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Save Error</AlertTitle>
                        <AlertDescription>{currentSaveState.error}</AlertDescription>
                     </Alert>
                   )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  );
}

