"use client";

import React, { useState } from 'react';
import type { Quiz as QuizType, MCQ as MCQType, Question } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, HelpCircle, Lightbulb, MessageSquareWarning, XCircle } from 'lucide-react';
import { Separator } from '../ui/separator';

interface QuizDisplayProps {
  quiz: QuizType;
  showAnswersInitially?: boolean; // For review mode
}

type AnswerStateType = { [questionId: string]: { selectedOption?: string; isCorrect?: boolean } };

export function QuizDisplay({ quiz, showAnswersInitially = false }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerStateType>({});
  const [showResults, setShowResults] = useState(showAnswersInitially);

  const currentQuestion = quiz.questions[currentQuestionIndex] as MCQType; // Assuming MCQ for now

  const handleOptionSelect = (questionId: string, selectedOption: string) => {
    if (showResults) return; // Don't allow changing answers after submission/reveal

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOption },
    }));
  };

  const handleSubmitQuiz = () => {
    // Mark answers
    const markedAnswers = { ...answers };
    quiz.questions.forEach(q => {
      const mcq = q as MCQType;
      if (markedAnswers[mcq.id]?.selectedOption) {
        markedAnswers[mcq.id].isCorrect = markedAnswers[mcq.id].selectedOption === mcq.answer;
      }
    });
    setAnswers(markedAnswers);
    setShowResults(true);
  };

  const calculateScore = () => {
    return Object.values(answers).filter(a => a.isCorrect).length;
  };

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Alert variant="destructive">
        <MessageSquareWarning className="h-4 w-4" />
        <AlertTitle>Quiz Error</AlertTitle>
        <AlertDescription>
          No questions found for this quiz. It might be empty or there was an issue loading it.
        </AlertDescription>
      </Alert>
    );
  }


  if (showResults && !showAnswersInitially) { // Quiz submitted, show summary
    const score = calculateScore();
    const totalQuestions = quiz.questions.length;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
          <CardDescription>You scored {score} out of {totalQuestions}!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((q, index) => {
            const mcq = q as MCQType;
            const userAnswer = answers[mcq.id];
            return (
              <div key={mcq.id} className="p-4 border rounded-md">
                <p className="font-semibold">Q{index + 1}: {mcq.question}</p>
                <p className={`text-sm mt-1 ${userAnswer?.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                  Your answer: {userAnswer?.selectedOption || "Not answered"} {userAnswer?.isCorrect ? <CheckCircle className="inline h-4 w-4" /> : <XCircle className="inline h-4 w-4" />}
                </p>
                {!userAnswer?.isCorrect && <p className="text-sm text-green-600">Correct answer: {mcq.answer}</p>}
                <Alert className="mt-2 bg-muted/30">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-sm font-medium">Explanation</AlertTitle>
                  <AlertDescription className="text-xs">{mcq.explanation}</AlertDescription>
                </Alert>
              </div>
            );
          })}
          <Button onClick={() => {setShowResults(false); setAnswers({}); setCurrentQuestionIndex(0);}} className="w-full">
            Retake Quiz or View Questions
          </Button>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <HelpCircle className="text-primary"/> Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </CardTitle>
        <Separator className="my-2"/>
        <p className="text-lg font-semibold text-foreground/90">{currentQuestion.question}</p>
      </CardHeader>
      
      <RadioGroup
        value={answers[currentQuestion.id]?.selectedOption}
        onValueChange={(value) => handleOptionSelect(currentQuestion.id, value)}
        className="space-y-3"
        disabled={showResults}
      >
        {currentQuestion.options.map((option, index) => {
          const optionId = `${currentQuestion.id}-option-${index}`;
          let itemClassName = "p-4 rounded-lg border transition-colors duration-150 flex items-center space-x-3";
          if (showResults) {
            if (option === currentQuestion.answer) {
              itemClassName += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
            } else if (option === answers[currentQuestion.id]?.selectedOption) {
              itemClassName += " bg-red-500/20 border-red-500 text-red-700 dark:text-red-400";
            } else {
              itemClassName += " border-border hover:bg-muted/50";
            }
          } else {
             itemClassName += " border-border hover:bg-muted/50 cursor-pointer";
             if (option === answers[currentQuestion.id]?.selectedOption) {
                itemClassName += " bg-primary/10 border-primary";
             }
          }

          return (
            <div key={optionId} className={itemClassName}>
              <RadioGroupItem value={option} id={optionId} className="border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:text-primary"/>
              <Label htmlFor={optionId} className="text-base flex-1 cursor-pointer">{option}</Label>
              {showResults && option === currentQuestion.answer && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
              {showResults && option === answers[currentQuestion.id]?.selectedOption && option !== currentQuestion.answer && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
            </div>
          );
        })}
      </RadioGroup>

      {showResults && (
        <Alert className="mt-4">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Explanation</AlertTitle>
          <AlertDescription>{currentQuestion.explanation}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          variant="outline"
        >
          Previous
        </Button>
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmitQuiz} disabled={showResults} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Submit Quiz
          </Button>
        )}
      </div>
    </div>
  );
}
