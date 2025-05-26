
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LibraryBig, Tag, Type, Filter, Search, FileText, ListChecks, MessageSquare, CheckCircle, SigmaSquare } from 'lucide-react';
import type { ExtractedQuestion } from '@/lib/types'; 
import { MathText } from '@/components/ui/MathText';
import { useQuestionBank } from '@/contexts/QuestionBankContext'; // Added import

// Mock data is now removed as we'll use the context
// const mockBankQuestions: ExtractedQuestion[] = [ ... ];

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

export default function QuestionBankPage() {
  const { bankedQuestions } = useQuestionBank(); // Use context
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState(ALL_FILTER_VALUE);
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState(ALL_FILTER_VALUE);

  const uniqueCategories = React.useMemo(() => 
    Array.from(new Set(bankedQuestions.map(q => q.suggestedCategory))).sort(), 
    [bankedQuestions]
  );
  const uniqueTypes = React.useMemo(() => 
    Array.from(new Set(bankedQuestions.map(q => q.questionType))).sort(),
    [bankedQuestions]
  );

  const filteredQuestions = React.useMemo(() => {
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
  

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <LibraryBig className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
            <p className="text-muted-foreground">Browse, search, and manage your saved questions.</p>
          </div>
        </div>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5"/> Filter Questions</CardTitle>
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
                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>
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
          ) : filteredQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow bg-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="text-lg flex items-start gap-2 flex-1 min-w-0">
                            <QuestionTypeIcon type={question.questionType} />
                             <MathText text={question.questionText} className="font-medium" />
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
                    <Button variant="ghost" size="sm" disabled>View Details (Soon)</Button>
                    <Button variant="outline" size="sm" className="ml-2" disabled>Add to Quiz (Soon)</Button>
                  </CardFooter>
                </Card>
              ))}
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
                    <li>Using banked questions to generate new custom quizzes.</li>
                </ul>
            </CardContent>
        </Card>
    </div>
  );
}
