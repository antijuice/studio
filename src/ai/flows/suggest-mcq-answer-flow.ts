
'use server';
/**
 * @fileOverview Suggests a correct answer for a multiple-choice question.
 * - suggestMcqAnswer - A function that suggests an answer.
 * - SuggestMcqAnswerInput - The input type.
 * - SuggestMcqAnswerOutput - The output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit'; 

const SuggestMcqAnswerInputSchema = z.object({
  questionText: z.string().describe('The text of the multiple-choice question.'),
  options: z.array(z.string()).min(1).describe('An array of possible answer options. Each option is a string.'),
});
export type SuggestMcqAnswerInput = z.infer<typeof SuggestMcqAnswerInputSchema>;

const SuggestMcqAnswerOutputSchema = z.object({
  suggestedAnswer: z.string().describe('The AI-suggested correct answer string, which must be one of the provided options.'),
});
export type SuggestMcqAnswerOutput = z.infer<typeof SuggestMcqAnswerOutputSchema>;

export async function suggestMcqAnswer(input: SuggestMcqAnswerInput): Promise<SuggestMcqAnswerOutput> {
  return suggestMcqAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMcqAnswerPrompt',
  input: {schema: SuggestMcqAnswerInputSchema},
  output: {schema: SuggestMcqAnswerOutputSchema},
  prompt: `You are an expert quiz assistant. Given a multiple-choice question and a list of options, your task is to identify and return the most likely correct answer from the provided options.

Question: {{{questionText}}}

Options:
{{#each options}}
- "{{{this}}}"
{{/each}}

Analyze the question and options carefully. 
Return only the text of the option you believe is the correct answer in the 'suggestedAnswer' field.
CRITICALLY IMPORTANT: The 'suggestedAnswer' you return MUST EXACTLY MATCH one of the option strings provided in the input. Do not rephrase or create a new answer.
`,
});

const suggestMcqAnswerFlow = ai.defineFlow(
  {
    name: 'suggestMcqAnswerFlow',
    inputSchema: SuggestMcqAnswerInputSchema,
    outputSchema: SuggestMcqAnswerOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output || !output.suggestedAnswer || output.suggestedAnswer.trim() === "") {
      throw new Error('AI failed to suggest an answer or the suggestion was empty.');
    }
    // Ensure the suggested answer is one of the options
    if (!input.options.includes(output.suggestedAnswer)) {
      console.warn(
        'AI suggested an answer not in the original options. Trying to find a close match. Original options:', 
        input.options, 
        'AI suggestion:', 
        output.suggestedAnswer
      );
      // Attempt to find a case-insensitive or trimmed match as a fallback
      const matchedOption = input.options.find(opt => 
        opt.trim().toLowerCase() === output.suggestedAnswer.trim().toLowerCase()
      );
      if (matchedOption) {
        console.log('Found a close match for AI suggestion:', matchedOption);
        return { suggestedAnswer: matchedOption };
      }
      throw new Error('AI suggested an answer that was not one of the provided options, and no close match was found.');
    }
    return output;
  }
);
