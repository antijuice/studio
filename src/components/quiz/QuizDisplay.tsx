
"use client";

import React, { useState, useEffect } from 'react';
import type { Quiz as QuizType, MCQ as MCQType, Question, UserAnswer, QuizSession } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, HelpCircle, Lightbulb, MessageSquareWarning, RefreshCw, XCircle } from 'lucide-react';
import { Separator } from '../ui/separator';
import { MathText } from '../ui/MathText';
import { useQuizSession } from '@/contexts/QuizSessionContext'; // Added import
import { Progress } from '../ui/progress';

interface QuizDisplayProps {
  quiz: QuizType;
  showAnswersInitially?: boolean; 
}

type AnswerStateType = { [questionId: string]: { selectedOption?: string; isCorrect?: boolean } };

export function QuizDisplay({ quiz, showAnswersInitially = false }: QuizDisplayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerStateType>({});
  const [showResults, setShowResults] = useState(showAnswersInitially);
  const { addQuizSession } = useQuizSession(); // Get context function

  // Effect to reset state if quiz prop changes (e.g., user starts a new quiz)
  useEffect(() => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(showAnswersInitially);
  }, [quiz, showAnswersInitially]);


  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
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

  const currentQuestion = quiz.questions[currentQuestionIndex] as MCQType; // Assuming MCQ for now

  const handleOptionSelect = (questionId: string, selectedOption: string) => {
    if (showResults) return; 

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], selectedOption },
    }));
  };

  const handleSubmitQuiz = () => {
    const markedAnswers: AnswerStateType = {};
    const detailedUserAnswers: UserAnswer[] = [];
    let correctCount = 0;

    quiz.questions.forEach(q => {
      const mcq = q as MCQType; // Assume MCQ for now
      const userAnswerState = answers[mcq.id];
      const isCorrect = userAnswerState?.selectedOption === mcq.answer;
      
      markedAnswers[mcq.id] = { 
        selectedOption: userAnswerState?.selectedOption,
        isCorrect: isCorrect,
      };

      if (isCorrect) {
        correctCount++;
      }

      detailedUserAnswers.push({
        questionId: mcq.id,
        questionText: mcq.question,
        questionType: mcq.type,
        options: mcq.options,
        userSelection: userAnswerState?.selectedOption,
        correctAnswer: mcq.answer,
        explanation: mcq.explanation,
        isCorrect: isCorrect,
      });
    });

    setAnswers(markedAnswers);
    setShowResults(true);

    const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

    const newSession: QuizSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: parseFloat(scorePercentage.toFixed(0)),
      completedAt: new Date(),
      answers: detailedUserAnswers,
      subject: quiz.subject,
      topic: quiz.topic,
      type: quiz.questions.length > 0 ? quiz.questions[0].type : 'custom', // Simplified type for session
    };
    addQuizSession(newSession);
  };
  
  const calculateScore = () => {
    return Object.values(answers).filter(a => a.isCorrect).length;
  };

  const totalQuestions = quiz.questions.length;


  if (showResults && !showAnswersInitially) { 
    const score = calculateScore();
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Results: {quiz.title}</CardTitle>
          <CardDescription>You scored {score} out of {totalQuestions} ({((score/totalQuestions)*100).toFixed(0)}%)!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions.map((q, index) => {
            const mcq = q as MCQType;
            const userAnswer = answers[mcq.id];
            return (
              <div key={mcq.id} className={`p-4 border rounded-lg ${userAnswer?.isCorrect ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                <p className="font-semibold mb-2">Q{index + 1}: <MathText text={mcq.question} className="inline" /></p>
                
                <div className="space-y-1 text-sm mb-2">
                    {mcq.options.map((opt, optIdx) => (
                        <div key={optIdx} className={`flex items-center gap-2 p-1.5 rounded 
                            ${opt === mcq.answer ? 'text-green-700 dark:text-green-400 font-medium' : ''} 
                            ${opt === userAnswer?.selectedOption && opt !== mcq.answer ? 'text-red-700 dark:text-red-400 line-through' : ''}
                            ${opt === userAnswer?.selectedOption && opt === mcq.answer ? 'bg-green-500/10' : ''}
                        `}>
                            {opt === mcq.answer && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />}
                            {opt !== mcq.answer && opt === userAnswer?.selectedOption && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                            {(opt !== mcq.answer && opt !== userAnswer?.selectedOption || !userAnswer?.selectedOption && opt !== mcq.answer) && <span className="w-4 h-4 flex-shrink-0"></span>}
                            <MathText text={opt} className="flex-1" />
                        </div>
                    ))}
                </div>
                {!userAnswer?.selectedOption && <p className="text-sm text-orange-500 italic">You did not answer this question.</p>}


                {mcq.explanation && (
                  <Alert className="mt-3 bg-muted/50 border-border">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    <AlertTitle className="text-sm font-medium">Explanation</AlertTitle>
                    <AlertDescription className="text-xs"><MathText text={mcq.explanation} /></AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
          <Button 
            onClick={() => {
                setCurrentQuestionIndex(0);
                setAnswers({});
                setShowResults(false);
            }} 
            className="w-full mt-6"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4"/>
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const questionTextContent = currentQuestion.question && currentQuestion.question.trim() !== ''
    ? <MathText text={currentQuestion.question} className="block text-lg font-semibold text-foreground/90" />
    : <p className="text-lg font-semibold text-muted-foreground italic">(No question text provided)</p>;

  return (
    <div className="space-y-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-primary"/> 
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
          </div>
          {quiz.title && <span className="text-base font-normal text-muted-foreground truncate hidden sm:inline">{quiz.title}</span>}
        </CardTitle>
        <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="w-full h-2 my-3" />
        <div className="min-h-[4em] py-2 border bg-card rounded-md p-4 shadow-inner">
          {questionTextContent}
        </div>
      </CardHeader>
      
      {currentQuestion.options && Array.isArray(currentQuestion.options) ? (
        <RadioGroup
          value={answers[currentQuestion.id]?.selectedOption}
          onValueChange={(value) => handleOptionSelect(currentQuestion.id, value)}
          className="space-y-3 px-6 pb-2" // Added padding for RadioGroup
          disabled={showResults}
        >
          {currentQuestion.options.map((option, index) => {
            const optionId = `${currentQuestion.id}-option-${index}`;
            let itemClassName = "p-4 rounded-lg border transition-colors duration-150 flex items-center space-x-3 text-left"; // Ensure text-left
            if (showResults) {
              if (option === currentQuestion.answer) {
                itemClassName += " bg-green-500/20 border-green-500 text-green-700 dark:text-green-400";
              } else if (option === answers[currentQuestion.id]?.selectedOption) {
                itemClassName += " bg-red-500/20 border-red-500 text-red-700 dark:text-red-400";
              } else {
                itemClassName += " border-border hover:bg-muted/50";
              }
            } else {
              itemClassName += " border-input bg-background hover:bg-muted/50 cursor-pointer";
              if (option === answers[currentQuestion.id]?.selectedOption) {
                  itemClassName += " ring-2 ring-primary border-primary";
              }
            }

            return (
              <div key={optionId} className={itemClassName}>
                <RadioGroupItem value={option} id={optionId} className="border-muted-foreground data-[state=checked]:border-primary data-[state=checked]:text-primary"/>
                <Label htmlFor={optionId} className="text-base flex-1 cursor-pointer leading-normal">
                  <MathText text={option} />
                </Label>
                {showResults && option === currentQuestion.answer && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                {showResults && option === answers[currentQuestion.id]?.selectedOption && option !== currentQuestion.answer && <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />}
              </div>
            );
          })}
        </RadioGroup>
      ) : (
        <Alert variant="default" className="mx-6 mb-2">
          <MessageSquareWarning className="h-4 w-4" />
          <AlertTitle>No Options Available</AlertTitle>
          <AlertDescription>
            This question does not have multiple-choice options or is not an MCQ.
          </AlertDescription>
        </Alert>
      )}

      {showResults && currentQuestion.explanation && (
        <Alert className="mt-4 mx-6">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Explanation</AlertTitle>
          <AlertDescription><MathText text={currentQuestion.explanation} /></AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center mt-6 px-6 pb-6">
        <Button
          onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0 || showResults}
          variant="outline"
        >
          Previous
        </Button>
        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={showResults}
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
