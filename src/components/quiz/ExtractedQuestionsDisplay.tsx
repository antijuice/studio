
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import type { ExtractQuestionsFromPdfOutput, ExtractedQuestion, SaveQuestionToBankOutput } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookText, CheckCircle, ImageIcon, Info, ListOrdered, Save, Tag, Type, XCircle, Loader2, SigmaSquare, Filter, TagsIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { saveQuestionToBankAction } from '@/app/actions/quizActions';
import { Separator } from '../ui/separator';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);


  const uniqueCategories = useMemo(() => {
    if (!extractionResult || !extractionResult.extractedQuestions) return [];
    const categories = new Set(extractionResult.extractedQuestions.map(q => q.suggestedCategory));
    return Array.from(categories).sort();
  }, [extractionResult]);

  const filteredQuestions = useMemo(() => {
    if (!extractionResult || !extractionResult.extractedQuestions) return [];
    
    const searchTags = tagSearchTerm
      .toLowerCase()
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    return extractionResult.extractedQuestions.filter(question => {
      const matchesSearchTerm = searchTerm === '' || 
        question.questionText.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || selectedCategory === 'all' || 
        question.suggestedCategory === selectedCategory;
      
      const matchesTags = searchTags.length === 0 || 
        searchTags.every(searchTag => 
          question.suggestedTags.some(qTag => qTag.toLowerCase().includes(searchTag))
        );

      return matchesSearchTerm && matchesCategory && matchesTags;
    });
  }, [extractionResult, searchTerm, selectedCategory, tagSearchTerm]);

  const unsavedFilteredQuestions = useMemo(() => {
    return filteredQuestions.filter(q => !saveStates[q.id]?.isSaved);
  }, [filteredQuestions, saveStates]);

  const handleSaveToBank = useCallback(async (question: ExtractedQuestion): Promise<boolean> => {
    setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: true, isSaved: false } }));
    // Minimal toast for individual save when part of batch, rely on summary toast.
    // If not saving all, then a more descriptive toast is fine.
    if (!isSavingAll) {
      toast({
        title: "Saving Question...",
        description: `Attempting to save "${question.questionText.substring(0, 30)}..." to the bank.`,
      });
    }

    try {
      const result: SaveQuestionToBankOutput = await saveQuestionToBankAction(question);
      if (result.success) {
        setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: true } }));
        if (!isSavingAll) {
          toast({
            title: "Question Saved (Simulated)",
            description: result.message || `Question with ID ${result.questionId} saved.`,
          });
        }
        return true;
      } else {
        setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: false, error: result.message } }));
        if (!isSavingAll) {
          toast({
            variant: "destructive",
            title: "Save Failed (Simulated)",
            description: result.message,
          });
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during save.";
      setSaveStates(prev => ({ ...prev, [question.id]: { isLoading: false, isSaved: false, error: errorMessage } }));
      if (!isSavingAll) {
        toast({
          variant: "destructive",
          title: "Error Saving Question",
          description: errorMessage,
        });
      }
      return false;
    }
  }, [toast, isSavingAll]);


  const handleSaveAll = async () => {
    if (unsavedFilteredQuestions.length === 0) {
        toast({
            title: "Nothing to Save",
            description: "All currently displayed questions are already saved or there are no questions to save.",
        });
        return;
    }

    setIsSavingAll(true);
    toast({
        title: "Batch Saving Started",
        description: `Attempting to save ${unsavedFilteredQuestions.length} question(s)...`,
    });

    const results = await Promise.allSettled(
        unsavedFilteredQuestions.map(q => handleSaveToBank(q))
    );

    let successCount = 0;
    let failureCount = 0;
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value === true) {
            successCount++;
        } else {
            failureCount++;
            // Individual error toasts for failed saves are handled by handleSaveToBank
        }
    });

    setIsSavingAll(false);
    toast({
        title: "Batch Save Complete",
        description: `${successCount} question(s) saved. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 && successCount === 0 ? "destructive" : "default",
        duration: 5000,
    });
  };


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
  

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6 bg-muted/30 border shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <Label htmlFor="search-questions" className="flex items-center mb-1 text-sm font-medium">
              <Filter className="h-4 w-4 mr-2 text-primary"/>Search Text
            </Label>
            <Input
              id="search-questions"
              type="text"
              placeholder="Search question text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="category-filter" className="flex items-center mb-1 text-sm font-medium">
              <Type className="h-4 w-4 mr-2 text-primary"/>Filter by Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter" className="w-full bg-background">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="tag-search" className="flex items-center mb-1 text-sm font-medium">
              <TagsIcon className="h-4 w-4 mr-2 text-primary"/>Filter by Tags
            </Label>
            <Input
              id="tag-search"
              type="text"
              placeholder="e.g., biology, mitosis"
              value={tagSearchTerm}
              onChange={(e) => setTagSearchTerm(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">Comma-separated. Shows questions matching ALL tags.</p>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="flex justify-end">
            <Button
                onClick={handleSaveAll}
                disabled={isSavingAll || unsavedFilteredQuestions.length === 0}
                variant="default"
                size="sm"
                className="bg-primary hover:bg-primary/90"
            >
                {isSavingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Save className="mr-2 h-4 w-4" />
                )}
                {isSavingAll ? "Saving All..." : `Save All Unsaved (${unsavedFilteredQuestions.length})`}
            </Button>
        </div>
      </Card>

      {filteredQuestions.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Matching Questions</AlertTitle>
          <AlertDescription>
            No extracted questions match your current search term or category filter. Try adjusting your filters.
          </AlertDescription>
        </Alert>
      )}

      <Accordion type="multiple" className="w-full">
        {filteredQuestions.map((item, index) => {
          const currentSaveState = saveStates[item.id] || { isLoading: false, isSaved: false };
          return (
            <AccordionItem value={item.id} key={item.id}>
              <AccordionTrigger className="hover:no-underline text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-2">
                  <span className="font-semibold md:truncate flex-1 mr-2">
                    Q{index + 1}: {item.questionText.substring(0, 80)}{item.questionText.length > 80 ? '...' : ''}
                  </span>
                  <div className="flex items-center gap-2 mt-1 md:mt-0 flex-shrink-0 flex-wrap">
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
                          <li key={`${item.id}-opt-${optIndex}`} 
                              className={opt === item.answer ? 'text-green-600 dark:text-green-400 font-medium' : 'text-foreground/80'}>
                            {opt}
                            {opt === item.answer && <CheckCircle className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.answer && item.questionType !== 'mcq' && ( // Only show non-MCQ answer if explicitly present
                    <Alert variant="default" className="mt-2 bg-green-500/10 border-green-500/30">
                       <CheckCircle className="inline h-4 w-4 mr-1 text-green-700 dark:text-green-500" />
                       <AlertTitle className="font-semibold text-green-700 dark:text-green-500">Answer</AlertTitle>
                       <AlertDescription className="text-green-700/90 dark:text-green-500/90">{item.answer}</AlertDescription>
                    </Alert>
                  )}
                  

                  {item.explanation && (
                    <Alert className="bg-muted/40 mt-2">
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

