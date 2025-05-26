
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LibraryBig, Tag, Type, Filter, Search, FileText, ListChecks, MessageSquare, CheckCircle } from 'lucide-react';
import type { ExtractedQuestion } from '@/lib/types'; // Re-using for mock data structure

// Mock data for the question bank - replace with actual data fetching later
const mockBankQuestions: ExtractedQuestion[] = [
  {
    id: 'bank-q1',
    questionText: 'What is the powerhouse of the cell?',
    questionType: 'mcq',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
    answer: 'Mitochondria',
    explanation: 'Mitochondria are responsible for generating most of the cell\'s supply of adenosine triphosphate (ATP), used as a source of chemical energy.',
    suggestedTags: ['biology', 'cell biology', 'organelles'],
    suggestedCategory: 'Biology',
    marks: 2,
  },
  {
    id: 'bank-q2',
    questionText: 'Explain the process of photosynthesis in brief.',
    questionType: 'short_answer',
    answer: 'Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy.',
    explanation: 'Key stages include light-dependent reactions (capturing light energy) and light-independent reactions (Calvin cycle - fixing carbon dioxide).',
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
    questionText: 'Solve for x: 2x + 5 = 15',
    questionType: 'mcq', // Could be short_answer too
    options: ['x = 3', 'x = 5', 'x = 7', 'x = 10'],
    answer: 'x = 5',
    explanation: 'Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5.',
    suggestedTags: ['mathematics', 'algebra', 'equations'],
    suggestedCategory: 'Mathematics',
    marks: 3,
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
  if (type === 'mcq') return <ListChecks className="h-4 w-4 text-blue-500" />;
  if (type === 'short_answer') return <MessageSquare className="h-4 w-4 text-green-500" />;
  if (type === 'true_false') return <CheckCircle className="h-4 w-4 text-purple-500" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
};


export default function QuestionBankPage() {
  // Basic state for filters - will be expanded later
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');

  const filteredQuestions = mockBankQuestions.filter(q => {
    const matchesSearch = searchTerm === '' || q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || q.suggestedCategory === selectedCategory;
    const matchesType = selectedType === '' || q.questionType === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });
  
  const uniqueCategories = Array.from(new Set(mockBankQuestions.map(q => q.suggestedCategory))).sort();
  const uniqueTypes = Array.from(new Set(mockBankQuestions.map(q => q.questionType))).sort();


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
                placeholder="Search questions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger><SelectValue placeholder="Filter by Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {uniqueTypes.map(type => <SelectItem key={type} value={type}>{questionTypeLabels[type as ExtractedQuestion['questionType']]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredQuestions.length > 0 ? (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <QuestionTypeIcon type={question.questionType} />
                            {question.questionText.substring(0,100)}{question.questionText.length > 100 ? '...' : ''}
                        </CardTitle>
                        {question.marks && <Badge variant="outline">{question.marks} Marks</Badge>}
                    </div>
                    <CardDescription className="text-xs">
                      Category: {question.suggestedCategory}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {question.questionType === 'mcq' && question.options && (
                        <div className="text-sm space-y-1 mb-2">
                            {question.options.map((opt, i) => (
                                <p key={i} className={`${opt === question.answer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>• {opt}</p>
                            ))}
                        </div>
                    )}
                     {question.explanation && (
                         <p className="text-xs text-muted-foreground italic p-2 bg-muted/30 rounded-md">
                           <strong>Explanation:</strong> {question.explanation.substring(0,150)}{question.explanation.length > 150 ? '...' : ''}
                        </p>
                     )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {question.suggestedTags.slice(0, 5).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />{tag}
                        </Badge>
                      ))}
                      {question.suggestedTags.length > 5 && <Badge variant="outline" className="text-xs">...</Badge>}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
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
       <Card className="mt-8 shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl">Feature Under Development</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    This Question Bank is currently showing mock data. Future updates will allow you to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
                    <li>View and manage questions actually saved from the "Extract Questions" feature.</li>
                    <li>Manually add and edit questions.</li>
                    <li>Verify questions for quality.</li>
                    <li>Use these banked questions to generate new custom quizzes.</li>
                </ul>
            </CardContent>
        </Card>
    </div>
  );
}
