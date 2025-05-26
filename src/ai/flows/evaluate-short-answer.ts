'use server';
/**
 * @fileOverview Evaluates a user's short answer against a model answer or mark scheme using AI.
 *
 * - evaluateShortAnswer - A function that evaluates the short answer.
 * - EvaluateShortAnswerInput - The input type for the evaluateShortAnswer function.
 * - EvaluateShortAnswerOutput - The return type for the evaluateShortAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateShortAnswerInputSchema = z.object({
  question: z.string().describe('The question being asked.'),
  userAnswer: z.string().describe('The user provided answer.'),
  modelAnswer: z.string().describe('The model answer or mark scheme (if available).').optional(),
});
export type EvaluateShortAnswerInput = z.infer<typeof EvaluateShortAnswerInputSchema>;

const EvaluateShortAnswerOutputSchema = z.object({
  score: z.number().describe('The score given to the user answer, between 0 and 1.'),
  feedback: z.string().describe('Feedback on the user answer, including areas for improvement.'),
});
export type EvaluateShortAnswerOutput = z.infer<typeof EvaluateShortAnswerOutputSchema>;

export async function evaluateShortAnswer(input: EvaluateShortAnswerInput): Promise<EvaluateShortAnswerOutput> {
  return evaluateShortAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateShortAnswerPrompt',
  input: {schema: EvaluateShortAnswerInputSchema},
  output: {schema: EvaluateShortAnswerOutputSchema},
  prompt: `You are an AI expert in evaluating short answers. Your task is to compare a student's answer to a question with a model answer or mark scheme, if provided, and provide a score and feedback.

Question: {{{question}}}

Student's Answer: {{{userAnswer}}}

{{#if modelAnswer}}
Model Answer/Mark Scheme: {{{modelAnswer}}}
{{/if}}

Provide a score between 0 and 1, reflecting the accuracy and completeness of the student's answer. Provide specific and constructive feedback to help the student improve. The feedback should include areas of strength and weakness in the student's answer.
`,
});

const evaluateShortAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateShortAnswerFlow',
    inputSchema: EvaluateShortAnswerInputSchema,
    outputSchema: EvaluateShortAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
