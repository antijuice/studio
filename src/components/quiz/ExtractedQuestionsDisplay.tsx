
"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { ExtractQuestionsFromPdfOutput, ExtractedQuestion, SaveQuestionToBankOutput, SuggestMcqAnswerInput, SuggestMcqAnswerOutput } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { BookText, CheckCircle, Edit, ImageIcon, Info, Lightbulb, ListOrdered, Save, Tag, Type, XCircle, Loader2, SigmaSquare, Filter, TagsIcon, AlertTriangle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';
import { saveQuestionToBankAction, suggestMcqAnswerAction } from '@/app/actions/quizActions';
import { Separator } from '../ui/separator';
import { MathText } from '../ui/MathText';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useQuestionBank } from '@/contexts/QuestionBankContext';

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

type EditableQuestionData = Omit<ExtractedQuestion, 'id' | 'questionType'> & {
  id?: string; 
  questionType?: ExtractedQuestion['questionType']; 
};


export function ExtractedQuestionsDisplay({ extractionResult }: ExtractedQuestionsDisplayProps) {
  const { toast } = useToast();
  const { addQuestionToBank } = useQuestionBank();
  const [saveStates, setSaveStates] = useState<QuestionSaveStateType>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentQuestionForEdit, setCurrentQuestionForEdit] = useState<ExtractedQuestion | null>(null);
  const [editedData, setEditedData] = useState<Partial<EditableQuestionData>>({});
  const [isSuggestingAnswer, setIsSuggestingAnswer] = useState(false);


  useEffect(() => {
    if (currentQuestionForEdit) {
      setEditedData({ ...currentQuestionForEdit });
    } else {
      setEditedData({});
    }
  }, [currentQuestionForEdit]);

  const handleInputChange = (field: keyof EditableQuestionData, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(editedData.options || [])];
    newOptions[index] = value;
    setEditedData(prev => ({ ...prev, options: newOptions }));
  };
  
  const handleMcqAnswerChange = (value: string) => {
    setEditedData(prev => ({ ...prev, answer: value }));
  };


  const uniqueCategories = useMemo(() => {
    if (!extractionResult || !extractionResult.extractedQuestions) return [];
    const categories = new Set(extractionResult.extractedQuestions.map(q => q.suggestedCategory));
    return Array.from(categories).sort();
  }, [extractionResult]);

  const filteredQuestions = useMemo(() => {
    if (!extractionResult || !extractionResult.extractedQuestions) return [];
    
    const searchTagsArray = tagSearchTerm
      .toLowerCase()
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');

    return extractionResult.extractedQuestions.filter(question => {
      const matchesSearchTerm = searchTerm === '' || 
        question.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.explanation && question.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategoryFilter === '' || selectedCategoryFilter === 'all' || 
        question.suggestedCategory === selectedCategoryFilter;
      
      const matchesTags = searchTagsArray.length === 0 || 
        searchTagsArray.every(searchTag => 
          question.suggestedTags.some(qTag => qTag.toLowerCase().includes(searchTag))
        );

      return matchesSearchTerm && matchesCategory && matchesTags;
    });
  }, [extractionResult, searchTerm, selectedCategoryFilter, tagSearchTerm]);

  const unsavedFilteredQuestions = useMemo(() => {
    return filteredQuestions.filter(q => !saveStates[q.id]?.isSaved);
  }, [filteredQuestions, saveStates]);

  const triggerSaveProcess = useCallback(async (questionToSave: ExtractedQuestion): Promise<boolean> => {
    setSaveStates(prev => ({ ...prev, [questionToSave.id]: { isLoading: true, isSaved: false } }));
    if (!isSavingAll) {
      toast({
        title: "Saving Question...",
        description: `Attempting to save question to the bank.`,
      });
    }

    try {
      const result: SaveQuestionToBankOutput = await saveQuestionToBankAction(questionToSave);
      if (result.success) {
        setSaveStates(prev => ({ ...prev, [questionToSave.id]: { isLoading: false, isSaved: true } }));
        addQuestionToBank(questionToSave); 
        if (!isSavingAll) {
          toast({
            title: "Question Saved",
            description: result.message || `Question with ID ${result.questionId} saved.`,
          });
        }
        return true;
      } else {
        setSaveStates(prev => ({ ...prev, [questionToSave.id]: { isLoading: false, isSaved: false, error: result.message } }));
        if (!isSavingAll) {
          toast({
            variant: "destructive",
            title: "Save Failed",
            description: result.message,
          });
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during save.";
      setSaveStates(prev => ({ ...prev, [questionToSave.id]: { isLoading: false, isSaved: false, error: errorMessage } }));
      if (!isSavingAll) {
        toast({
          variant: "destructive",
          title: "Error Saving Question",
          description: errorMessage,
        });
      }
      return false;
    }
  }, [toast, addQuestionToBank, isSavingAll]);

  const handleOpenEditDialog = (question: ExtractedQuestion) => {
    setCurrentQuestionForEdit(question);
    setIsEditDialogOpen(true);
  };

  const handleConfirmSaveFromDialog = async () => {
    if (!currentQuestionForEdit || !editedData.questionText) { 
      toast({ title: "Cannot Save", description: "Question text cannot be empty.", variant: "destructive" });
      return;
    }
    
    const questionToSave: ExtractedQuestion = {
      ...currentQuestionForEdit,
      questionText: editedData.questionText || currentQuestionForEdit.questionText,
      options: editedData.options || currentQuestionForEdit.options,
      answer: editedData.answer || currentQuestionForEdit.answer,
      explanation: editedData.explanation || currentQuestionForEdit.explanation,
      suggestedTags: typeof editedData.suggestedTags === 'string' 
        ? (editedData.suggestedTags as string).split(',').map(tag => tag.trim()).filter(Boolean) 
        : editedData.suggestedTags || currentQuestionForEdit.suggestedTags,
      suggestedCategory: editedData.suggestedCategory || currentQuestionForEdit.suggestedCategory,
      marks: editedData.marks !== undefined ? Number(editedData.marks) : currentQuestionForEdit.marks,
      relevantImageDescription: editedData.relevantImageDescription || currentQuestionForEdit.relevantImageDescription,
    };

    setIsEditDialogOpen(false); 
    await triggerSaveProcess(questionToSave);
    setCurrentQuestionForEdit(null); 
  };

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
        description: `Attempting to save ${unsavedFilteredQuestions.length} question(s)... This will save them as-is without individual review.`,
    });

    let successCount = 0;
    let failureCount = 0;
    
    const results = await Promise.allSettled(
      unsavedFilteredQuestions.map(q => triggerSaveProcess(q))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value === true) {
        successCount++;
      } else {
        failureCount++;
      }
    });

    setIsSavingAll(false);
    toast({
        title: "Batch Save Complete",
        description: `${successCount} question(s) saved to bank. ${failureCount > 0 ? `${failureCount} failed.` : ''}`,
        variant: failureCount > 0 && successCount === 0 ? "destructive" : failureCount > 0 ? "default" : "default",
        duration: 5000,
    });
  };

  const handleAISuggestAnswer = async () => {
    if (!currentQuestionForEdit || !editedData.questionText || !editedData.options || editedData.options.length === 0) {
      toast({ title: "Cannot Suggest", description: "Question text and options must be available to suggest an answer.", variant: "destructive" });
      return;
    }
    setIsSuggestingAnswer(true);
    toast({ title: "AI Suggestion", description: "AI is thinking of an answer..." });
    try {
      const input: SuggestMcqAnswerInput = {
        questionText: editedData.questionText,
        options: editedData.options,
      };
      const result: SuggestMcqAnswerOutput = await suggestMcqAnswerAction(input);
      if (result.suggestedAnswer && editedData.options.includes(result.suggestedAnswer)) {
        setEditedData(prev => ({ ...prev, answer: result.suggestedAnswer }));
        toast({ title: "AI Suggestion Successful", description: `AI suggested: "${result.suggestedAnswer}"` });
      } else {
         throw new Error("AI suggested an invalid option or no suggestion was made.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error suggesting answer.";
      toast({ title: "AI Suggestion Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSuggestingAnswer(false);
    }
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
              placeholder="Search question text or explanation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="md:col-span-1">
            <Label htmlFor="category-filter" className="flex items-center mb-1 text-sm font-medium">
              <Type className="h-4 w-4 mr-2 text-primary"/>Filter by Category
            </Label>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
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
              placeholder="e.g., biology, mitosis (comma-sep.)"
              value={tagSearchTerm}
              onChange={(e) => setTagSearchTerm(e.target.value)}
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">Shows questions matching ALL tags.</p>
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
            No extracted questions match your current search term or filters. Try adjusting your filters.
          </AlertDescription>
        </Alert>
      )}

      <Accordion type="multiple" className="w-full">
        {filteredQuestions.map((item, index) => {
          const currentSaveState = saveStates[item.id] || { isLoading: false, isSaved: false };
          return (
            <AccordionItem value={item.id} key={item.id}>
              <AccordionTrigger className="hover:no-underline text-left">
                <div className="flex flex-col md:flex-row md:items-start justify-between w-full pr-2">
                   <div className="font-semibold flex-1 mr-2 min-w-0">
                      <MathText text={`Q${index + 1}: ${item.questionText}`} className="text-base" />
                  </div>
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
                        <p className="font-semibold flex items-start gap-1.5"><BookText className="inline h-4 w-4 mr-1 mt-1 flex-shrink-0" />Question Text:</p>
                        <MathText text={item.questionText} className="ml-6 prose prose-sm dark:prose-invert max-w-none"/>
                        {item.marks !== undefined && (
                          <p className="text-sm text-muted-foreground mt-1 ml-6">
                            <strong><SigmaSquare className="inline h-4 w-4 mr-1" />Marks:</strong> {item.marks}
                          </p>
                        )}
                      </div>
                      <Button 
                          variant={currentSaveState.isSaved ? "default" : "outline"}
                          size="sm" 
                          onClick={() => handleOpenEditDialog(item)}
                          className={`ml-4 flex-shrink-0 ${currentSaveState.isSaved ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                          disabled={currentSaveState.isLoading || currentSaveState.isSaved}
                      >
                          {currentSaveState.isLoading ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : currentSaveState.isSaved ? (
                            <CheckCircle className="mr-2 h-3 w-3" />
                          ) : (
                            <Edit className="mr-2 h-3 w-3" />
                          )}
                          {currentSaveState.isLoading ? "Saving..." : currentSaveState.isSaved ? "Saved" : "Review &amp; Save"}
                      </Button>
                  </div>
                  
                  {item.questionType === 'mcq' && item.options && item.options.length > 0 && (
                    <div>
                      <strong><ListOrdered className="inline h-4 w-4 mr-1" />Options:</strong>
                      <ul className="list-none pl-4 space-y-1 mt-1">
                        {item.options.map((opt, optIndex) => (
                          <li key={`${item.id}-opt-${optIndex}`} className="flex items-start">
                             <MathText text={opt} className={`inline ${opt === item.answer ? 'text-green-500 dark:text-green-400 font-semibold' : 'text-foreground/80'}`} />
                            {opt === item.answer && <CheckCircle className="inline h-4 w-4 ml-2 text-green-600 dark:text-green-400 flex-shrink-0" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {item.answer && item.questionType !== 'mcq' && (
                    <Alert variant="default" className="mt-2 bg-green-500/10 border-green-500/30">
                       <CheckCircle className="inline h-4 w-4 mr-1 text-green-700 dark:text-green-500" />
                       <AlertTitle className="font-semibold text-green-700 dark:text-green-500">Answer</AlertTitle>
                       <AlertDescription className="text-green-700/90 dark:text-green-500/90">
                         <MathText text={item.answer} />
                       </AlertDescription>
                    </Alert>
                  )}
                  
                  {item.explanation && (
                    <Alert className="bg-muted/40 mt-2">
                      <Info className="inline h-4 w-4 mr-1" />
                      <AlertTitle className="font-semibold">Explanation</AlertTitle>
                      <AlertDescription>
                        <MathText text={item.explanation} />
                      </AlertDescription>
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

      {isEditDialogOpen && currentQuestionForEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setCurrentQuestionForEdit(null);
            setIsSuggestingAnswer(false); // Reset suggestion loading state
          }
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Review &amp; Edit Question</DialogTitle>
              <DialogDescription>
                Make any necessary changes to the extracted question details before saving.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-grow pr-2">
              <div>
                <Label htmlFor="editText" className="font-semibold">Question Text</Label>
                <Textarea id="editText" value={editedData.questionText || ''} onChange={(e) => handleInputChange('questionText', e.target.value)} className="mt-1 min-h-[100px]" />
              </div>

              {currentQuestionForEdit.questionType === 'mcq' && (
                <>
                  <div>
                    <Label className="font-semibold">Options &amp; Correct Answer</Label>
                    {(editedData.options || []).map((opt, index) => (
                      <div key={index} className="flex items-center gap-2 mt-1">
                        <Input 
                          value={opt} 
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-grow"
                        />
                         <RadioGroup value={editedData.answer} onValueChange={handleMcqAnswerChange} className="flex items-center">
                            <RadioGroupItem value={opt} id={`edit-opt-ans-${index}`} />
                            <Label htmlFor={`edit-opt-ans-${index}`} className="text-xs">Correct</Label>
                         </RadioGroup>
                      </div>
                    ))}
                    {(!editedData.options || editedData.options.length === 0) && <p className="text-xs text-muted-foreground">No options extracted.</p>}
                  </div>
                  {(!editedData.answer || editedData.answer.trim() === "") && (editedData.options && editedData.options.length > 0) && (
                     <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAISuggestAnswer} 
                        disabled={isSuggestingAnswer || !editedData.questionText}
                        className="mt-2 w-full"
                      >
                        {isSuggestingAnswer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                        {isSuggestingAnswer ? "Suggesting..." : "AI Suggest Answer"}
                      </Button>
                  )}
                </>
              )}
              
              {currentQuestionForEdit.questionType !== 'mcq' && (
                 <div>
                    <Label htmlFor="editAnswer" className="font-semibold">Answer</Label>
                    <Textarea id="editAnswer" value={editedData.answer || ''} onChange={(e) => handleInputChange('answer', e.target.value)} className="mt-1" />
                  </div>
              )}

              <div>
                <Label htmlFor="editExplanation" className="font-semibold">Explanation</Label>
                <Textarea id="editExplanation" value={editedData.explanation || ''} onChange={(e) => handleInputChange('explanation', e.target.value)} className="mt-1 min-h-[80px]" />
              </div>
              
              <div>
                <Label htmlFor="editCategory" className="font-semibold">Category</Label>
                <Input id="editCategory" value={editedData.suggestedCategory || ''} onChange={(e) => handleInputChange('suggestedCategory', e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="editTags" className="font-semibold">Tags (comma-separated)</Label>
                <Input id="editTags" value={(editedData.suggestedTags || []).join(', ')} onChange={(e) => handleInputChange('suggestedTags', e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="editMarks" className="font-semibold">Marks</Label>
                <Input id="editMarks" type="number" value={editedData.marks === undefined ? '' : editedData.marks} onChange={(e) => handleInputChange('marks', e.target.value === '' ? undefined : parseInt(e.target.value, 10))} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="editImageDesc" className="font-semibold">Relevant Image Description</Label>
                <Textarea id="editImageDesc" value={editedData.relevantImageDescription || ''} onChange={(e) => handleInputChange('relevantImageDescription', e.target.value)} className="mt-1" />
              </div>
               <Alert variant="default" className="bg-primary/10 border-primary/30">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Note on Editing</AlertTitle>
                  <AlertDescription className="text-primary/80">
                    Editing mathematical expressions here requires manual LaTeX entry (e.g., $E=mc^2$$ or $$x^2$$). 
                    The original LaTeX from the PDF is preserved unless you change it.
                  </AlertDescription>
              </Alert>

            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleConfirmSaveFromDialog}>Confirm &amp; Save to Bank</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
