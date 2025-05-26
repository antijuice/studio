// src/ai/flows/generate-custom-quiz.ts
'use server';

/**
 * @fileOverview A flow to generate custom quizzes based on user-specified criteria.
 *
 * - generateCustomQuiz - A function that generates a custom quiz.
 * - GenerateCustomQuizInput - The input type for the generateCustomQuiz function.
 * - GenerateCustomQuizOutput - The return type for the generateCustomQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomQuizInputSchema = z.object({
  syllabus: z.string().describe('The syllabus for the quiz.'),
  subject: z.string().describe('The subject of the quiz.'),
  topic: z.string().describe('The specific topic of the quiz.'),
  numQuestions: z.number().int().min(1).max(20).default(10).describe('The number of questions to generate for the quiz. Must be between 1 and 20.'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

const GenerateCustomQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The multiple-choice options for the question.'),
      answer: z.string().describe('The correct answer to the question.'),
      explanation: z.string().describe('Explanation of the answer.'),
    })
  ).describe('The generated quiz questions.'),
});
export type GenerateCustomQuizOutput = z.infer<typeof GenerateCustomQuizOutputSchema>;

export async function generateCustomQuiz(input: GenerateCustomQuizInput): Promise<GenerateCustomQuizOutput> {
  return generateCustomQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  input: {schema: GenerateCustomQuizInputSchema},
  output: {schema: GenerateCustomQuizOutputSchema},
  prompt: `You are a quiz generator that creates multiple-choice questions based on the provided criteria.

  Generate {{numQuestions}} multiple-choice questions for a quiz on the following:

  Syllabus: {{{syllabus}}}
  Subject: {{{subject}}}
  Topic: {{{topic}}}

  Each question should have four options, with one correct answer. Provide a brief explanation for each answer.

  Format the output as a JSON array of quiz questions, where each question object has the following keys:
  - question: the quiz question
  - options: an array of four strings representing the multiple-choice options
  - answer: the correct answer to the question
  - explanation: a brief explanation of the answer
  `,
});

const generateCustomQuizFlow = ai.defineFlow(
  {
    name: 'generateCustomQuizFlow',
    inputSchema: GenerateCustomQuizInputSchema,
    outputSchema: GenerateCustomQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
