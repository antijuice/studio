
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { LibraryBig, Tag, Type, Filter, Search, FileText, ListChecks, MessageSquare, CheckCircle, SigmaSquare, PlusCircle, MinusCircle, PlayCircle, Trash2, PackagePlus, Wand2, ArrowLeft, Loader2, Info, Eye, AlertTriangle } from 'lucide-react';
import type { ExtractedQuestion, Quiz as QuizType, MCQ as MCQType } from '@/lib/types'; 
import { MathText } from '@/components/ui/MathText';
import { useQuestionBank } from '@/contexts/QuestionBankContext';
import { useQuizAssembly } from '@/contexts/QuizAssemblyContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizDisplay } from '@/components/quiz/QuizDisplay';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const questionTypeLabels: Record<ExtractedQuestion['questionType'], string> = {
  mcq: 'Multiple Choice',
  short_answer: 'Short Answer',
  true_false: 'True/False',
  fill_in_the_blank: 'Fill in the Blank',
  unknown: 'Unknown Type',
};

const QuestionTypeIcon = ({ type }: { type: ExtractedQuestion['questionType'] }) => {
  if (type === 'mcq') return <ListChecks className="h-4 w-4 text-blue-500 flex-shrink-0" />;
  if (type === 'short_answer') return <MessageSquare className="h-4 w-4 text-green-500 flex-shrink-0" />;
  if (type === 'true_false') return <CheckCircle className="h-4 w-4 text-purple-500 flex-shrink-0" />;
  if (type === 'fill_in_the_blank') return <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />;
  return <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
};

const ALL_FILTER_VALUE = "__ALL__";

interface CriteriaQuizFormState {
  description: string;
  tags: string;
  category: string;
  questionType: string;
  numQuestions: number;
}

export default function QuestionBankPage() {
  const { bankedQuestions, removeQuestionFromBank } = useQuestionBank();
  const { 
    addQuestionToAssembly, 
    removeQuestionFromAssembly, 
    isQuestionInAssembly,
    getAssemblyCount,
    getAssembledQuestions,
    clearAssembly
  } = useQuizAssembly();
  const { toast } = useToast();

  // Filters for browsing the bank
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState(ALL_FILTER_VALUE);
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState(ALL_FILTER_VALUE);

  // State for "Start Quiz by Criteria"
  const [criteriaForm, setCriteriaForm] = useState<CriteriaQuizFormState>({
    description: '',
    tags: '',
    category: ALL_FILTER_VALUE,
    questionType: 'mcq', 
    numQuestions: 5,
  });
  const [currentQuiz, setCurrentQuiz] = useState<QuizType | null>(null);
  const [isGeneratingQuizByCriteria, setIsGeneratingQuizByCriteria] = useState(false);

  // State for managing question pools for criteria-based quizzes
  const [shuffledPools, setShuffledPools] = useState<Map<string, string[]>>(new Map()); // Map<criteriaKey, questionId[]>
  const [poolIndices, setPoolIndices] = useState<Map<string, number>>(new Map()); // Map<criteriaKey, currentIndex>
  const [lastCriteriaKeyForPool, setLastCriteriaKeyForPool] = useState<string | null>(null);

  // State for View Details Dialog
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [currentQuestionForView, setCurrentQuestionForView] = useState<ExtractedQuestion | null>(null);


  const uniqueCategories = React.useMemo(() => 
    Array.from(new Set(bankedQuestions.map(q => q.suggestedCategory))).sort(), 
    [bankedQuestions]
  );
  const uniqueTypes = React.useMemo(() => 
    Array.from(new Set(bankedQuestions.map(q => q.questionType))).sort(),
    [bankedQuestions]
  );

  const filteredBankQuestions = React.useMemo(() => {
    return bankedQuestions.filter(q => {
      const matchesSearch = searchTerm === '' || 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategoryFilter === ALL_FILTER_VALUE || selectedCategoryFilter === '' ||
        q.suggestedCategory === selectedCategoryFilter;
      
      const matchesType = selectedTypeFilter === ALL_FILTER_VALUE || selectedTypeFilter === '' ||
        q.questionType === selectedTypeFilter;
        
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [bankedQuestions, searchTerm, selectedCategoryFilter, selectedTypeFilter]);
  
  const assemblyCount = getAssemblyCount();

  const handleCriteriaFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // This check ensures that select changes are handled by handleCriteriaSelectChange for type safety
    if (e.target.id === 'criteriaCategory' || e.target.id === 'criteriaQuestionType') {
      return; 
    }
    setCriteriaForm(prev => ({ ...prev, [name]: name === 'numQuestions' ? parseInt(value, 10) : value }));
  };
  
  const handleCriteriaSelectChange = (name: keyof CriteriaQuizFormState, value: string) => {
    setCriteriaForm(prev => ({...prev, [name]: value}));
  }

  const handleGenerateQuizByCriteria = () => {
    setIsGeneratingQuizByCriteria(true);

    const criteriaKey = JSON.stringify({
      description: criteriaForm.description.trim().toLowerCase(),
      tags: criteriaForm.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean).sort().join(','),
      category: criteriaForm.category,
      // questionType: criteriaForm.questionType, // Only MCQs are used for now
    });

    const criteriaTagsArray = criteriaForm.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    
    const initialMatchingExtractedQuestions = bankedQuestions.filter(eq => {
      if (eq.questionType !== 'mcq') return false; // Only MCQs for this feature

      const matchesDescription = criteriaForm.description.trim() === '' ||
        eq.questionText.toLowerCase().includes(criteriaForm.description.trim().toLowerCase()) ||
        (eq.explanation && eq.explanation.toLowerCase().includes(criteriaForm.description.trim().toLowerCase()));
      
      const matchesTags = criteriaTagsArray.length === 0 ||
        criteriaTagsArray.every(ct => eq.suggestedTags.some(qt => qt.toLowerCase().includes(ct)));
      
      const matchesCategory = criteriaForm.category === ALL_FILTER_VALUE || eq.suggestedCategory === criteriaForm.category;
      
      return matchesDescription && matchesTags && matchesCategory;
    });
    
    const validQuizMcqs: MCQType[] = initialMatchingExtractedQuestions
      .map(eq => ({
        id: eq.id,
        question: eq.questionText,
        options: eq.options ? [...eq.options] : [],
        answer: typeof eq.answer === 'string' ? eq.answer : "",
        explanation: eq.explanation || "No explanation provided.",
        type: 'mcq' as const, 
      }))
      .filter(q => q.options.length > 0 && q.answer.trim() !== "");


    if (initialMatchingExtractedQuestions.length > 0 && validQuizMcqs.length === 0) {
        toast({
            title: "Not Enough Valid MCQs",
            description: `Found ${initialMatchingExtractedQuestions.length} MCQs matching your criteria, but none were complete (e.g., missing options or a defined answer) after validation. Please check the banked questions or broaden your criteria.`,
            variant: "destructive",
            duration: 7000,
        });
        setIsGeneratingQuizByCriteria(false);
        return;
    } else if (validQuizMcqs.length === 0) {
         toast({
            title: "No MCQs Found Matching Criteria",
            description: "No MCQs in the bank match your specified description, tags, or category. Try broadening your search.",
            variant: "destructive",
        });
        setIsGeneratingQuizByCriteria(false);
        return;
    }
    
    const validQuizMcqIds = validQuizMcqs.map(q => q.id);
    const currentValidMcqIdsSet = new Set(validQuizMcqIds);

    let currentShuffledIds = shuffledPools.get(criteriaKey);
    let currentIndex = poolIndices.get(criteriaKey) || 0;
    let poolNeedsRebuild = false;

    // Check if pool needs rebuild due to changed criteria or underlying data changes
    if (criteriaKey !== lastCriteriaKeyForPool || !currentShuffledIds) {
      poolNeedsRebuild = true;
    } else if (currentShuffledIds) { // Pool exists, check if its content matches current valid questions
      const previousPoolSet = new Set(currentShuffledIds);
      if (currentValidMcqIdsSet.size !== previousPoolSet.size || 
          !Array.from(currentValidMcqIdsSet).every(id => previousPoolSet.has(id))) {
        poolNeedsRebuild = true;
      }
    }
    
    if (poolNeedsRebuild) {
      currentShuffledIds = Array.from(currentValidMcqIdsSet).sort(() => 0.5 - Math.random()); // Shuffle
      currentIndex = 0;
      const newShuffledPools = new Map(shuffledPools);
      newShuffledPools.set(criteriaKey, currentShuffledIds);
      setShuffledPools(newShuffledPools);
      if(criteriaKey !== lastCriteriaKeyForPool) setLastCriteriaKeyForPool(criteriaKey);
    }
    
    if (!currentShuffledIds || currentShuffledIds.length === 0) {
        toast({ title: "Error Building Question Pool", description: "Could not form a question pool for these criteria from valid MCQs.", variant: "destructive" });
        setIsGeneratingQuizByCriteria(false);
        return;
    }

    const numAvailableInPool = currentShuffledIds.length;
    const numToSelect = Math.min(criteriaForm.numQuestions, numAvailableInPool);
    
    const selectedQuestionIds: string[] = [];
    for (let i = 0; i < numToSelect; i++) {
      const poolReadIndex = (currentIndex + i) % numAvailableInPool; // Wrap around using modulo
      selectedQuestionIds.push(currentShuffledIds[poolReadIndex]);
    }

    const newCurrentIndex = (currentIndex + numToSelect) % numAvailableInPool;
    let poolCycledThisTurn = false;
    // Check if the pool cycled AND if the number of items available was positive
    // and the number to select was also positive. This prevents cycle messages for empty initial states.
    if (newCurrentIndex === 0 && (currentIndex + numToSelect >= numAvailableInPool) && numAvailableInPool > 0 && numToSelect > 0) {
      poolCycledThisTurn = true;
      // Re-shuffle the pool for the next cycle if it completed
      const reShuffledIds = Array.from(currentValidMcqIdsSet).sort(() => 0.5 - Math.random());
      const updatedShuffledPools = new Map(shuffledPools); // Create a new map to ensure state update
      updatedShuffledPools.set(criteriaKey, reShuffledIds);
      setShuffledPools(updatedShuffledPools);
    }
    
    const newPoolIndices = new Map(poolIndices);
    newPoolIndices.set(criteriaKey, newCurrentIndex);
    setPoolIndices(newPoolIndices);

    // Get full question objects for the quiz
    const finalQuizQuestions: MCQType[] = selectedQuestionIds
      .map(id => validQuizMcqs.find(mcq => mcq.id === id))
      .filter(Boolean) as MCQType[]; // Filter out any undefined if IDs somehow mismatch (should not happen)


    if (finalQuizQuestions.length === 0) { 
      toast({
        title: "No Questions Selected",
        description: "Could not select any questions for the quiz, though a pool was available. This might be an internal error.",
        variant: "destructive",
      });
      setIsGeneratingQuizByCriteria(false);
      return;
    }
    
    let quizGeneratedMessage = `Generated a quiz with ${finalQuizQuestions.length} question(s) from ${numAvailableInPool} available valid MCQs.`;
    if (finalQuizQuestions.length < criteriaForm.numQuestions && !poolCycledThisTurn) {
      quizGeneratedMessage += ` Fewer than requested (${criteriaForm.numQuestions}) were available or valid in the bank for these criteria.`;
    } else if (finalQuizQuestions.length < criteriaForm.numQuestions && poolCycledThisTurn) {
       quizGeneratedMessage += ` Fewer than requested (${criteriaForm.numQuestions}). All available questions in this pool have been used. Pool has been re-shuffled.`;
    }

    if (poolCycledThisTurn) {
       toast({
        title: "Question Pool Cycled",
        description: `All available questions for these criteria have been shown. The pool has been re-shuffled. ${quizGeneratedMessage}`,
        variant: "default",
        duration: 6000,
      });
    } else {
         toast({
            title: "Quiz Generated!",
            description: quizGeneratedMessage,
            variant: "default", 
            duration: 5000,
         });
    }
    
    const newQuiz: QuizType = {
      id: `criteria-quiz-${Date.now()}`,
      title: `Quiz based on: ${criteriaForm.description || 'Selected Criteria'}`,
      questions: finalQuizQuestions,
      createdAt: new Date(),
    };
    setCurrentQuiz(newQuiz);
    setIsGeneratingQuizByCriteria(false);
  };


  const handleStartAssembledQuiz = () => {
    const assembled = getAssembledQuestions();
    if (assembled.length === 0) {
      toast({
        title: "Assembly Empty",
        description: "Please add some MCQs to your assembly first.",
        variant: "destructive"
      });
      return;
    }

    const mcqQuestionsForQuiz: MCQType[] = assembled
      .filter(eq => eq.questionType === 'mcq') 
      .map(eq => ({
        id: eq.id,
        question: eq.questionText,
        options: eq.options ? [...eq.options] : [],
        answer: typeof eq.answer === 'string' ? eq.answer : "",
        explanation: eq.explanation || "No explanation provided.",
        type: 'mcq' as const,
      }))
      .filter(q => q.options.length > 0 && q.answer.trim() !== ""); 

    if (mcqQuestionsForQuiz.length === 0) {
      toast({
        title: "No Valid MCQs in Assembly",
        description: "None of the selected questions were complete MCQs (e.g., missing options or a defined answer).",
        variant: "destructive",
      });
      return;
    }
    
    let toastMessage = `Created a quiz with ${mcqQuestionsForQuiz.length} valid MCQ(s) from your assembly.`;
    if (mcqQuestionsForQuiz.length < assembled.length) {
       toastMessage += ` Some selected items might have been non-MCQs or incomplete.`
    }

    toast({
      title: "Assembled Quiz Ready!",
      description: toastMessage,
      variant: "default",
    });
    
    const newQuiz: QuizType = {
      id: `assembled-quiz-${Date.now()}`,
      title: "My Assembled Quiz",
      questions: mcqQuestionsForQuiz,
      createdAt: new Date(),
    };
    setCurrentQuiz(newQuiz);
    clearAssembly({ suppressToast: true }); // Clear assembly after starting the quiz
  };

  const handleOpenViewDetails = (question: ExtractedQuestion) => {
    setCurrentQuestionForView(question);
    setIsViewDetailsDialogOpen(true);
  };


  if (currentQuiz) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Button onClick={() => setCurrentQuiz(null)} variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Question Bank
        </Button>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">{currentQuiz.title}</CardTitle>
            <CardDescription>Generated from your criteria or assembly using banked questions.</CardDescription>
          </CardHeader>
          <CardContent>
            <QuizDisplay quiz={currentQuiz} />
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <TooltipProvider>
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <LibraryBig className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
            <p className="text-muted-foreground">Browse, search, manage questions, and generate quizzes.</p>
          </div>
        </div>
      </header>

      <Card className="shadow-lg sticky top-4 md:top-[calc(theme(spacing.16)+theme(spacing.4))] z-20 bg-card/95 backdrop-blur-sm border">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2"><PackagePlus className="h-6 w-6 text-accent"/>Quiz Assembly</CardTitle>
                <Badge variant="outline" className="text-lg">{assemblyCount} Questions</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                Select MCQs from the bank below to add them to your custom quiz assembly.
            </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => clearAssembly()} disabled={assemblyCount === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Selection
            </Button>
            <Button onClick={handleStartAssembledQuiz} disabled={assemblyCount === 0} className="bg-accent hover:bg-accent/90">
                <PlayCircle className="mr-2 h-4 w-4" /> Start Quiz with {assemblyCount} Assembled Questions
            </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2"><Wand2 className="h-6 w-6 text-primary"/>Start Quiz by Criteria</CardTitle>
          <CardDescription>Generate a quiz from banked MCQs based on your specifications. The system will try to cycle through all matching questions before repeating.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="criteriaDescription">Description / Topic (searches question text & explanation)</Label>
            <Textarea 
              id="criteriaDescription" 
              name="description" 
              placeholder="e.g., 'Questions about photosynthesis basics' or 'Easy algebra problems'" 
              value={criteriaForm.description}
              onChange={handleCriteriaFormChange}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="criteriaTags">Tags (comma-separated, matches if ALL tags present)</Label>
              <Input 
                id="criteriaTags" 
                name="tags" 
                placeholder="e.g., biology, cell, exam1" 
                value={criteriaForm.tags}
                onChange={handleCriteriaFormChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="criteriaCategory">Category</Label>
              <Select 
                name="category" 
                value={criteriaForm.category} 
                onValueChange={(value) => handleCriteriaSelectChange('category', value)}
              >
                <SelectTrigger id="criteriaCategory" className="mt-1"><SelectValue placeholder="Any Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>Any Category</SelectItem>
                  {uniqueCategories.map(cat => <SelectItem key={`crit-cat-${cat}`} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="criteriaQuestionType">Question Type</Label>
              <Select 
                name="questionType" 
                value={criteriaForm.questionType} 
                onValueChange={(value) => handleCriteriaSelectChange('questionType', value)}
                disabled 
              >
                <SelectTrigger id="criteriaQuestionType" className="mt-1"><SelectValue placeholder="Any MCQ Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice (MCQ)</SelectItem>
                </SelectContent>
              </Select>
               <p className="text-xs text-muted-foreground mt-1">Currently, only MCQs are used for quiz generation by criteria.</p>
            </div>
            <div>
              <Label htmlFor="criteriaNumQuestions">Number of Questions</Label>
              <Input 
                id="criteriaNumQuestions" 
                name="numQuestions" 
                type="number" 
                min="1" 
                max="50" 
                value={criteriaForm.numQuestions}
                onChange={handleCriteriaFormChange}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateQuizByCriteria} 
            disabled={isGeneratingQuizByCriteria || bankedQuestions.filter(q => q.questionType === 'mcq').length === 0}
            className="w-full md:w-auto ml-auto bg-primary hover:bg-primary/90"
          >
            {isGeneratingQuizByCriteria ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4"/> }
            {isGeneratingQuizByCriteria ? "Generating..." : "Generate & Start Quiz"}
          </Button>
        </CardFooter>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filter Banked Questions</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="relative">
              <Input 
                placeholder="Search questions or explanations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                {uniqueCategories.map(cat => <SelectItem key={`browse-cat-${cat}`} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={`browse-type-${type}`} value={type}>
                    {questionTypeLabels[type as ExtractedQuestion['questionType']]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {bankedQuestions.length === 0 && searchTerm === '' && selectedCategoryFilter === ALL_FILTER_VALUE && selectedTypeFilter === ALL_FILTER_VALUE ? (
             <div className="text-center py-10">
              <LibraryBig className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-medium text-muted-foreground">Your Question Bank is Empty</p>
              <p className="text-sm text-muted-foreground mt-1">
                Go to "Extract Questions" to add questions from your PDFs.
              </p>
            </div>
          ) : filteredBankQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredBankQuestions.map((question) => {
                const isInAssembly = isQuestionInAssembly(question.id);
                const isMCQ = question.questionType === 'mcq';
                return (
                  <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow bg-card">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                          <div className="text-lg flex items-start gap-2 flex-1 min-w-0">
                              <QuestionTypeIcon type={question.questionType} />
                               <MathText text={question.questionText} className="font-medium block" />
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                              {question.marks !== undefined && (
                                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                      <SigmaSquare className="h-3 w-3"/> {question.marks} Marks
                                  </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">{questionTypeLabels[question.questionType]}</Badge>
                          </div>
                      </div>
                      <CardDescription className="text-xs mt-1 ml-6"> 
                        Category: <Badge variant="outline" className="text-xs font-normal">{question.suggestedCategory}</Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-6 space-y-3">
                      {question.questionType === 'mcq' && question.options && (
                          <div className="text-sm space-y-1 mb-2">
                              <p className="font-medium text-xs text-muted-foreground mb-1">Options:</p>
                              {question.options.map((opt, i) => (
                                  <div key={i} className={`ml-4 text-xs flex items-start gap-1.5 ${opt === question.answer ? 'text-green-500 font-semibold' : 'text-foreground/80'}`}>
                                      <span>•</span> <MathText text={opt} /> {opt === question.answer && <span className="ml-1 text-xs">(Correct)</span>}
                                  </div>
                              ))}
                          </div>
                      )}
                       {question.explanation && (
                           <div className="text-xs text-muted-foreground italic p-3 bg-muted/30 rounded-md border">
                             <strong className="not-italic">Explanation:</strong> <MathText text={question.explanation.substring(0,300) + (question.explanation.length > 300 ? '...' : '')} />
                          </div>
                       )}
                      {question.suggestedTags && question.suggestedTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Tags:</span>
                          {question.suggestedTags.slice(0, 5).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                              <Tag className="h-3 w-3 mr-1" />{tag}
                              </Badge>
                          ))}
                          {question.suggestedTags.length > 5 && <Badge variant="outline" className="text-xs">...</Badge>}
                          </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-4">
                       <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenViewDetails(question)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600 border-red-500/50"
                                  onClick={() => removeQuestionFromBank(question.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Remove from Bank
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Remove this question from your current session's bank.</p></TooltipContent>
                      </Tooltip>

                      {!isMCQ ? (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="ml-2" disabled>
                                    Unsupported Type
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Only MCQs can be added to quizzes currently.</p></TooltipContent>
                        </Tooltip>
                      ) : isInAssembly ? (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="ml-2"
                          onClick={() => removeQuestionFromAssembly(question.id)}
                        >
                          <MinusCircle className="mr-2 h-4 w-4" /> Remove from Quiz
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="ml-2 bg-primary hover:bg-primary/90"
                          onClick={() => addQuestionToAssembly(question)}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" /> Add to New Quiz
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions found matching your criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-8 shadow-sm border-dashed">
            <CardHeader>
                <CardTitle className="text-xl">Note on Data Persistence</CardTitle>
                <CardDescription>Questions added to this bank are stored in your browser's memory for this session only.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Refreshing the page or closing your browser will clear the banked questions.
                    Future updates will enable:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
                    <li>Persistent storage of questions in a database.</li>
                    <li>Manually adding and editing questions directly in the bank.</li>
                    <li>Verification workflows for quality assurance.</li>
                </ul>
            </CardContent>
        </Card>

        {/* View Details Dialog */}
      {currentQuestionForView && (
        <Dialog open={isViewDetailsDialogOpen} onOpenChange={setIsViewDetailsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-primary" /> Question Details</DialogTitle>
              <DialogDescription>
                Viewing the full details of the selected question.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 overflow-y-auto flex-grow pr-2">
              <div>
                <Label className="font-semibold text-sm">Question Text:</Label>
                <MathText text={currentQuestionForView.questionText} className="mt-1 p-2 border rounded-md bg-muted/30 text-base" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="font-semibold text-sm">Type:</Label>
                    <p className="mt-1 text-sm"><Badge variant="outline">{questionTypeLabels[currentQuestionForView.questionType]}</Badge></p>
                </div>
                <div>
                    <Label className="font-semibold text-sm">Category:</Label>
                    <p className="mt-1 text-sm"><Badge variant="secondary">{currentQuestionForView.suggestedCategory}</Badge></p>
                </div>
              </div>
              
              {currentQuestionForView.marks !== undefined && (
                <div>
                    <Label className="font-semibold text-sm">Marks:</Label>
                    <p className="mt-1 text-sm">{currentQuestionForView.marks}</p>
                </div>
              )}

              {currentQuestionForView.questionType === 'mcq' && currentQuestionForView.options && (
                <div>
                  <Label className="font-semibold text-sm">Options:</Label>
                  <ul className="list-none mt-1 space-y-1">
                    {currentQuestionForView.options.map((opt, index) => (
                      <li key={`view-opt-${index}`} className={`p-2 border rounded-md text-sm flex items-start gap-1.5 ${opt === currentQuestionForView.answer ? 'bg-green-500/10 border-green-500/30 text-green-700' : 'bg-card'}`}>
                         <span className="font-mono text-xs opacity-70">{(index + 1)}.</span> <MathText text={opt} /> {opt === currentQuestionForView.answer && <CheckCircle className="inline h-4 w-4 ml-auto text-green-600 flex-shrink-0" />}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentQuestionForView.questionType !== 'mcq' && currentQuestionForView.answer && (
                 <div>
                  <Label className="font-semibold text-sm">Answer:</Label>
                  <div className="mt-1 p-2 border rounded-md bg-green-500/10 border-green-500/30 text-sm">
                    <MathText text={currentQuestionForView.answer} />
                  </div>
                </div>
              )}

              {currentQuestionForView.explanation && (
                <div>
                  <Label className="font-semibold text-sm">Explanation:</Label>
                  <div className="mt-1 p-2 border rounded-md bg-muted/50 text-sm">
                    <MathText text={currentQuestionForView.explanation} />
                  </div>
                </div>
              )}
              
              {currentQuestionForView.relevantImageDescription && (
                 <div>
                  <Label className="font-semibold text-sm">Relevant Image Information:</Label>
                  <p className="mt-1 p-2 border rounded-md bg-muted/30 text-sm italic">{currentQuestionForView.relevantImageDescription}</p>
                </div>
              )}

              {currentQuestionForView.suggestedTags && currentQuestionForView.suggestedTags.length > 0 && (
                <div>
                  <Label className="font-semibold text-sm">Tags:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {currentQuestionForView.suggestedTags.map(tag => (
                      <Badge key={`view-tag-${tag}`} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
               {!currentQuestionForView.options && currentQuestionForView.questionType === 'mcq' && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Missing Options</AlertTitle><AlertDescription>This MCQ is missing its options.</AlertDescription></Alert>}
               {!currentQuestionForView.answer && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Missing Answer</AlertTitle><AlertDescription>The answer for this question is not defined.</AlertDescription></Alert>}


            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
    </TooltipProvider>
  );
}
