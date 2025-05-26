
'use server';
/**
 * @fileOverview Suggests an explanation for a given question.
 * - suggestExplanation - A function that suggests an explanation.
 * - SuggestExplanationInput - The input type.
 * - SuggestExplanationOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; 
import type { SuggestExplanationInput, SuggestExplanationOutput } from '@/lib/types'; // Using lib types directly

// Use types from lib/types for input/output schemas where possible to maintain consistency
// Zod schemas are still defined for Genkit internal validation
const SuggestExplanationInputSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  questionType: z.enum(['mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown']).describe('The type of the question.'),
  options: z.array(z.string()).optional().describe('For MCQs, an array of possible answer options.'),
  answer: z.string().optional().describe('The correct answer to the question, if known.'),
});

const SuggestExplanationOutputSchema = z.object({
  suggestedExplanation: z.string().describe('The AI-generated explanation for the question.'),
});

export async function suggestExplanation(input: SuggestExplanationInput): Promise<SuggestExplanationOutput> {
  return suggestExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExplanationPrompt',
  input: {schema: SuggestExplanationInputSchema},
  output: {schema: SuggestExplanationOutputSchema},
  prompt: `You are an expert at generating clear and concise explanations for quiz questions.
Given the question details below, provide a helpful explanation.

Question Text: {{{questionText}}}
Question Type: {{{questionType}}}

{{#if options.length}}
Options:
{{#each options}}
- "{{{this}}}"
{{/each}}
{{/if}}

{{#if answer}}
Correct Answer: "{{{answer}}}"
Your explanation should clarify why this answer is correct. For MCQs, you might also briefly mention why other key options are incorrect if it adds significant value.
{{else}}
A specific answer was not provided. Generate a general explanation that clarifies the concept or topic addressed by the question.
{{/if}}

Keep the explanation focused and directly relevant to the question.
For mathematical content, use LaTeX notation ($...$ for inline, $$...$$ for block).
Return the explanation in the 'suggestedExplanation' field.
`,
});

const suggestExplanationFlow = ai.defineFlow(
  {
    name: 'suggestExplanationFlow',
    inputSchema: SuggestExplanationInputSchema,
    outputSchema: SuggestExplanationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.suggestedExplanation || output.suggestedExplanation.trim() === "") {
      throw new Error('AI failed to suggest an explanation or the explanation was empty.');
    }
    return output;
  }
);
