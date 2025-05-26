
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

const mockBankQuestions: ExtractedQuestion[] = [
  {
    id: 'bank-q1',
    questionText: 'What is the powerhouse of the cell? This involves $E=mc^2$.',
    questionType: 'mcq',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    answer: 'Mitochondria',
    explanation: 'Mitochondria are responsible for generating most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy. Equation: $$ATP \\rightarrow ADP + P_i$$',
    suggestedTags: ['biology', 'cell biology', 'organelles'],
    suggestedCategory: 'Biology',
    marks: 2,
  },
  {
    id: 'bank-q2',
    questionText: 'Explain the process of photosynthesis in brief, including the formula $6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2$.',
    questionType: 'short_answer',
    answer: 'Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.',
    explanation: 'Key stages include light-dependent reactions (capturing light energy) and light-independent reactions (Calvin cycle - fixing carbon dioxide). The overall equation is $$6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{Light Energy} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$$.',
    suggestedTags: ['biology', 'plants', 'photosynthesis', 'energy'],
    suggestedCategory: 'Biology',
    marks: 5,
  },
  {
    id: 'bank-q3',
    questionText: 'True or False: The Earth is flat.',
    questionType: 'true_false',
    answer: 'False',
    explanation: 'Scientific evidence overwhelmingly supports that the Earth is an oblate spheroid.',
    suggestedTags: ['geography', 'science', 'earth'],
    suggestedCategory: 'General Science',
  },
  {
    id: 'bank-q4',
    questionText: 'Solve for $x$: $2x + 5 = 15$',
    questionType: 'mcq', 
    options: ['$x = 3$', '$x = 5$', '$x = 7$', '$x = 10$'],
    answer: '$x = 5$',
    explanation: 'Subtract $5$ from both sides: $2x = 10$. Divide by $2$: $x = 5$.',
    suggestedTags: ['mathematics', 'algebra', 'equations'],
    suggestedCategory: 'Mathematics',
    marks: 3,
  },
  {
    id: 'bank-q5',
    questionText: 'Define "fill_in_the_blank" question type.',
    questionType: 'fill_in_the_blank',
    answer: 'A question type where the user needs to supply missing words in a sentence or phrase.',
    explanation: 'These are useful for testing recall of specific terms or concepts.',
    suggestedTags: ['pedagogy', 'assessment', 'question types'],
    suggestedCategory: 'Education',
  },
];

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
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState(ALL_FILTER_VALUE);
  const [selectedType, setSelectedType] = React.useState(ALL_FILTER_VALUE);

  const uniqueCategories = React.useMemo(() => 
    Array.from(new Set(mockBankQuestions.map(q => q.suggestedCategory))).sort(), 
    []
  );
  const uniqueTypes = React.useMemo(() => 
    Array.from(new Set(mockBankQuestions.map(q => q.questionType))).sort(),
    []
  );

  const filteredQuestions = React.useMemo(() => {
    return mockBankQuestions.filter(q => {
      const matchesSearch = searchTerm === '' || 
        q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === ALL_FILTER_VALUE || selectedCategory === '' ||
        q.suggestedCategory === selectedCategory;
      
      const matchesType = selectedType === ALL_FILTER_VALUE || selectedType === '' ||
        q.questionType === selectedType;
        
      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, selectedCategory, selectedType]);
  

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <div className="flex items-center gap-3">
          <LibraryBig className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Question Bank</h1>
            <p className="text-muted-foreground">Browse, search, and manage the collective knowledge base.</p>
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER_VALUE}>All Categories</SelectItem>
                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
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
          {filteredQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow bg-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="text-lg flex items-start gap-2 flex-1 min-w-0"> {/* Changed to items-start */}
                            <QuestionTypeIcon type={question.questionType} />
                             <MathText text={question.questionText} /> {/* Removed substring and truncate */}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap"> {/* Added flex-wrap */}
                            {question.marks !== undefined && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <SigmaSquare className="h-3 w-3"/> {question.marks} Marks
                                </Badge>
                            )}
                            <Badge variant="secondary">{questionTypeLabels[question.questionType]}</Badge>
                        </div>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Category: <Badge variant="outline" className="text-xs">{question.suggestedCategory}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {question.questionType === 'mcq' && question.options && (
                        <div className="text-sm space-y-1 mb-2">
                            <p className="font-medium text-xs text-muted-foreground mb-1">Options:</p>
                            {question.options.map((opt, i) => (
                                <div key={i} className={`ml-2 text-xs flex items-center ${opt === question.answer ? 'text-green-500 font-semibold' : 'text-foreground/80'}`}>
                                    <span className="mr-1">•</span> <MathText text={opt} /> {opt === question.answer && <span className="ml-1">(Correct)</span>}
                                </div>
                            ))}
                        </div>
                    )}
                     {question.explanation && (
                         <div className="text-xs text-muted-foreground italic p-2 bg-muted/30 rounded-md border">
                           <strong>Explanation:</strong> <MathText text={question.explanation.substring(0,300) + (question.explanation.length > 300 ? '...' : '')} /> {/* Kept substring for brevity here */}
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
              <LibraryBig className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No questions found matching your criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or adding more questions to the bank.</p>
            </div>
          )}
        </CardContent>
      </Card>
       <Card className="mt-8 shadow-sm border-dashed">
            <CardHeader>
                <CardTitle className="text-xl">Feature Under Development</CardTitle>
                <CardDescription>This Question Bank currently uses mock data for demonstration.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Future updates will enable:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
                    <li>Displaying questions actually saved from the "Extract Questions from PDF" feature.</li>
                    <li>Manually adding and editing questions directly in the bank.</li>
                    <li>Verification workflows for quality assurance.</li>
                    <li>Using banked questions to generate new custom quizzes.</li>
                    <li>Advanced search and organization capabilities.</li>
                    <li>Full LaTeX rendering for complex mathematical notations.</li>
                </ul>
            </CardContent>
        </Card>
    </div>
  );
}
