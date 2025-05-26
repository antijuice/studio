// src/ai/flows/generate-quiz-from-pdf.ts
'use server';

/**
 * @fileOverview Generates a quiz from a user-provided PDF document.
 *
 * - generateQuizFromPdf - A function that generates a quiz from a PDF.
 * - GenerateQuizFromPdfInput - The input type for the generateQuizFromPdf function.
 * - GenerateQuizFromPdfOutput - The return type for the generateQuizFromPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  quizDescription: z
    .string()
    .optional()
    .describe('Optional instructions for generating the quiz.'),
});
export type GenerateQuizFromPdfInput = z.infer<typeof GenerateQuizFromPdfInputSchema>;

const GenerateQuizFromPdfOutputSchema = z.object({
  quiz: z.string().describe('The generated quiz in JSON format.'),
});
export type GenerateQuizFromPdfOutput = z.infer<typeof GenerateQuizFromPdfOutputSchema>;

export async function generateQuizFromPdf(input: GenerateQuizFromPdfInput): Promise<GenerateQuizFromPdfOutput> {
  return generateQuizFromPdfFlow(input);
}

const generateQuizFromPdfPrompt = ai.definePrompt({
  name: 'generateQuizFromPdfPrompt',
  input: {schema: GenerateQuizFromPdfInputSchema},
  output: {schema: GenerateQuizFromPdfOutputSchema},
  prompt: `You are an expert quiz generator. You will receive a PDF document and generate a quiz based on its content.

  PDF Content: {{media url=pdfDataUri}}

  Instructions: {{quizDescription}}

  Please provide the quiz output as a JSON object. Each question should have the keys "question", "options", "answer", and "explanation". The "options" field should be an array of strings. The answer field should be the index of the correct option.
  `,
});

const generateQuizFromPdfFlow = ai.defineFlow(
  {
    name: 'generateQuizFromPdfFlow',
    inputSchema: GenerateQuizFromPdfInputSchema,
    outputSchema: GenerateQuizFromPdfOutputSchema,
  },
  async input => {
    const {output} = await generateQuizFromPdfPrompt(input);
    return output!;
  }
);
