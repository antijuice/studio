
"use client";

import React from 'react';
import type { ExtractQuestionsFromPdfOutput, ExtractedQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookText, CheckCircle, ChevronDown, ChevronUp, Image as ImageIcon, Info, ListOrdered, Save, Tag, Type, XCircle } from 'lucide-react'; // Added Save Icon
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

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

export function ExtractedQuestionsDisplay({ extractionResult }: ExtractedQuestionsDisplayProps) {
  const { toast } = useToast();

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

  const handleSimulatedSave = (questionText: string) => {
    const snippet = questionText.substring(0, 30) + (questionText.length > 30 ? '...' : '');
    toast({
      title: "Simulated Save",
      description: `Question "${snippet}" would be saved to the bank. (Backend not implemented yet)`,
    });
  };

  return (
    <div className="space-y-6">
      <Accordion type="multiple" className="w-full">
        {extractionResult.extractedQuestions.map((item, index) => (
          <AccordionItem value={`item-${index}`} key={`extracted-${index}-${item.questionText.slice(0,10)}`}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-2">
                <span className="font-semibold text-left md:truncate flex-1 mr-2">
                  Q{index + 1}: {item.questionText.substring(0, 80)}{item.questionText.length > 80 ? '...' : ''}
                </span>
                <div className="flex items-center gap-2 mt-1 md:mt-0 flex-shrink-0">
                  <Badge variant="outline">{questionTypeLabels[item.questionType]}</Badge>
                  <Badge variant="secondary">{item.suggestedCategory}</Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 p-1">
                <div className="flex justify-between items-start">
                    <p><strong><BookText className="inline h-4 w-4 mr-1" />Question:</strong> {item.questionText}</p>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSimulatedSave(item.questionText)}
                        className="ml-4 flex-shrink-0"
                    >
                        <Save className="mr-2 h-3 w-3" /> Save to Bank
                    </Button>
                </div>
                
                {item.questionType === 'mcq' && item.options && item.options.length > 0 && (
                  <div>
                    <strong><ListOrdered className="inline h-4 w-4 mr-1" />Options:</strong>
                    <ul className="list-disc list-inside pl-4 space-y-1 mt-1">
                      {item.options.map((opt, optIndex) => (
                        <li key={`${item.questionText.slice(0,5)}-opt-${optIndex}`} className={opt === item.answer ? 'text-green-600 font-medium' : ''}>
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
                    <Info className="h-4 w-4" />
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
                      {/* Placeholder for actual image display in the future */}
                      {/* <img src={item.imageDataUri} alt="Relevant to question" className="mt-2 rounded-md max-h-60 w-auto" /> */}
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <strong><Tag className="inline h-4 w-4 mr-1" />Suggested Tags:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.suggestedTags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
                 <p><strong><Type className="inline h-4 w-4 mr-1" />Suggested Category:</strong> {item.suggestedCategory}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
