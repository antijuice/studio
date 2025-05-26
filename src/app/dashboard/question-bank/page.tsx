
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LibraryBig, Tag, Type, Filter, Search, FileText, ListChecks, MessageSquare, CheckCircle, SigmaSquare, PlusCircle, MinusCircle, PlayCircle, Trash2, PackagePlus, Wand2, ArrowLeft } from 'lucide-react';
import type { ExtractedQuestion, Quiz as QuizType, MCQ as MCQType } from '@/lib/types'; 
import { MathText } from '@/components/ui/MathText';
import { useQuestionBank } from '@/contexts/QuestionBankContext';
import { useQuizAssembly } from '@/contexts/QuizAssemblyContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuizDisplay } from '@/components/quiz/QuizDisplay';
import { useToast } from '@/hooks/use-toast';

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
  const { bankedQuestions } = useQuestionBank();
  const { 
    addQuestionToAssembly, 
    removeQuestionFromAssembly, 
    isQuestionInAssembly,
    getAssemblyCount,
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

  // State for cycling through questions for "Start Quiz by Criteria"
  const [shuffledPools, setShuffledPools] = useState<Map<string, string[]>>(new Map()); // criteriaKey -> shuffled question IDs
  const [poolIndices, setPoolIndices] = useState<Map<string, number>>(new Map());     // criteriaKey -> current index in pool
  const [lastCriteriaKeyForPool, setLastCriteriaKeyForPool] = useState<string | null>(null); // Tracks the last criteria key used to build/access a pool


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
    if (e.target.id === 'criteriaCategory' || e.target.id === 'criteriaQuestionType') {
      return; // These are handled by handleCriteriaSelectChange
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
      questionType: criteriaForm.questionType, // Should be 'mcq'
    });

    const criteriaTagsArray = criteriaForm.tags.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
    const allMatchingQuestions = bankedQuestions.filter(q => {
      if (q.questionType !== 'mcq') return false; // Hard filter for MCQs for this feature

      const matchesDescription = criteriaForm.description.trim() === '' ||
        q.questionText.toLowerCase().includes(criteriaForm.description.trim().toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(criteriaForm.description.trim().toLowerCase()));
      
      const matchesTags = criteriaTagsArray.length === 0 ||
        criteriaTagsArray.every(ct => q.suggestedTags.some(qt => qt.toLowerCase().includes(ct)));
      
      const matchesCategory = criteriaForm.category === ALL_FILTER_VALUE || q.suggestedCategory === criteriaForm.category;
      
      return matchesDescription && matchesTags && matchesCategory;
    });

    if (allMatchingQuestions.length === 0) {
      toast({
        title: "No MCQs Found Matching Criteria",
        description: "No MCQs in the bank match your specified description, tags, or category. Try broadening your search.",
        variant: "destructive",
      });
      setIsGeneratingQuizByCriteria(false);
      return;
    }

    let currentShuffledIds = shuffledPools.get(criteriaKey);
    let currentIndex = poolIndices.get(criteriaKey) || 0;
    let poolNeedsRebuild = false;

    if (criteriaKey !== lastCriteriaKeyForPool || !currentShuffledIds) {
      poolNeedsRebuild = true;
    } else {
      // Simple heuristic: if the number of matching questions has changed, rebuild pool for this criteria
      if (allMatchingQuestions.length !== currentShuffledIds.length) {
        poolNeedsRebuild = true;
      }
    }
    
    if (poolNeedsRebuild) {
      currentShuffledIds = allMatchingQuestions.map(q => q.id).sort(() => 0.5 - Math.random()); // Shuffle
      currentIndex = 0;
      const newShuffledPools = new Map(shuffledPools);
      newShuffledPools.set(criteriaKey, currentShuffledIds);
      setShuffledPools(newShuffledPools);
      if(criteriaKey !== lastCriteriaKeyForPool) setLastCriteriaKeyForPool(criteriaKey);
    }
    
    if (!currentShuffledIds || currentShuffledIds.length === 0) {
        toast({ title: "Error", description: "Question pool is empty for these criteria.", variant: "destructive" });
        setIsGeneratingQuizByCriteria(false);
        return;
    }

    const numAvailableInPool = currentShuffledIds.length;
    const numToSelect = Math.min(criteriaForm.numQuestions, numAvailableInPool);
    
    const selectedQuestionIds: string[] = [];
    for (let i = 0; i < numToSelect; i++) {
      const poolReadIndex = (currentIndex + i) % numAvailableInPool;
      selectedQuestionIds.push(currentShuffledIds[poolReadIndex]);
    }

    const newCurrentIndex = (currentIndex + numToSelect) % numAvailableInPool;

    const newPoolIndices = new Map(poolIndices);
    newPoolIndices.set(criteriaKey, newCurrentIndex);
    setPoolIndices(newPoolIndices);

    let cycledToastShown = false;
    if (newCurrentIndex === 0 && (currentIndex + numToSelect >= numAvailableInPool) && numAvailableInPool > 0) {
      // Just completed a full cycle. Re-shuffle for the *next* time.
      const reShuffledIds = allMatchingQuestions.map(q => q.id).sort(() => 0.5 - Math.random());
      const updatedShuffledPools = new Map(shuffledPools); // get latest
      updatedShuffledPools.set(criteriaKey, reShuffledIds);
      setShuffledPools(updatedShuffledPools);
      
      toast({
        title: "Question Pool Cycled",
        description: "All available questions for these criteria have been shown. The pool has been re-shuffled for next time.",
        variant: "default",
        duration: 3000,
      });
      cycledToastShown = true;
    }

    const selectedExtractedQuestions = selectedQuestionIds
      .map(id => allMatchingQuestions.find(q => q.id === id)) // Get full question objects
      .filter(Boolean) as ExtractedQuestion[];

    const mappedQuestions: MCQType[] = selectedExtractedQuestions.map(eq => ({
      id: eq.id,
      question: eq.questionText,
      options: eq.options ? [...eq.options] : [],
      answer: typeof eq.answer === 'string' ? eq.answer : "",
      explanation: eq.explanation || "No explanation provided.",
      type: 'mcq',
    })).filter(q => q.options.length > 0 && q.answer.trim() !== "");


    if (mappedQuestions.length === 0) {
      toast({
        title: "Not Enough Valid MCQs",
        description: `Although ${allMatchingQuestions.length} questions matched your criteria, none were complete (e.g., missing options or a defined answer) after validation. Please check the banked questions or broaden your criteria.`,
        variant: "destructive",
        duration: 7000,
      });
      setIsGeneratingQuizByCriteria(false);
      return;
    }
    
    if (mappedQuestions.length < numToSelect && !cycledToastShown) {
       toast({
            title: "Some Matched Questions Invalid or Fewer Available",
            description: `Found ${allMatchingQuestions.length} MCQs matching criteria. Generated a quiz with ${mappedQuestions.length} complete questions. Some might have been invalid or fewer were available than requested.`,
            variant: "default", 
            duration: 5000,
         });
    }
    
    const newQuiz: QuizType = {
      id: `criteria-quiz-${Date.now()}`,
      title: `Quiz based on: ${criteriaForm.description || 'Selected Criteria'}`,
      questions: mappedQuestions,
      createdAt: new Date(),
    };
    setCurrentQuiz(newQuiz);
    setIsGeneratingQuizByCriteria(false);
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
            <CardDescription>Generated from your criteria using banked questions.</CardDescription>
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

      <Card className="shadow-lg sticky top-4 md:top-20 z-20 bg-card/95 backdrop-blur-sm border">
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
            <Button variant="outline" onClick={clearAssembly} disabled={assemblyCount === 0}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Selection
            </Button>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button disabled={assemblyCount === 0} className="bg-accent hover:bg-accent/90">
                        <PlayCircle className="mr-2 h-4 w-4" /> Start Quiz with {assemblyCount} Assembled Questions
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Taking quizzes from assembled questions is coming soon!</p>
                </TooltipContent>
            </Tooltip>
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
                disabled // For now, this feature primarily targets MCQs from the bank
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
            <PlayCircle className="mr-2 h-4 w-4"/> 
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
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" disabled>View Details</Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View full details (Coming Soon)</p></TooltipContent>
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
    </div>
    </TooltipProvider>
  );
}


    