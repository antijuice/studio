'use server';
/**
 * @fileOverview Extracts structured questions, tags, and categories from a PDF document using AI.
 *
 * - extractQuestionsFromPdf - A function that processes a PDF and returns extracted questions.
 * - ExtractQuestionsFromPdfInput - The input type for the extractQuestionsFromPdf function.
 * - ExtractQuestionsFromPdfOutput - The return type for the extractQuestionsFromPdf function.
 * - ExtractedQuestion - The type for a single extracted question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const ExtractQuestionsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topicHint: z
    .string()
    .optional()
    .describe(
      'Optional: A hint about the general topic of the PDF to improve tagging and categorization (e.g., "Chapter 5 on Photosynthesis").'
    ),
});
export type ExtractQuestionsFromPdfInput = z.infer<typeof ExtractQuestionsFromPdfInputSchema>;

export const ExtractedQuestionSchema = z.object({
  questionText: z.string().describe('The full text of the question.'),
  questionType: z
    .enum(['mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown'])
    .describe('The identified type of the question.'),
  options: z
    .array(z.string())
    .optional()
    .describe('For "mcq" type, an array of choices. Otherwise, this may be omitted.'),
  answer: z
    .string()
    .optional()
    .describe(
      "The correct answer. For 'mcq', this should be the full text of the correct option. For 'short_answer' or 'fill_in_the_blank', it's the expected answer text. Omit if not applicable or unidentifiable."
    ),
  explanation: z
    .string()
    .optional()
    .describe('An explanation for the correct answer, if available or inferable from the text.'),
  suggestedTags: z
    .array(z.string())
    .describe('An array of 3-5 relevant keywords or tags for the question, derived from its content.'),
  suggestedCategory: z
    .string()
    .describe(
      "A suggested broader academic category for this question (e.g., 'Algebra', 'Cell Biology', 'World War II', 'Literary Analysis')."
    ),
});
export type ExtractedQuestion = z.infer<typeof ExtractedQuestionSchema>;

export const ExtractQuestionsFromPdfOutputSchema = z.object({
  extractedQuestions: z
    .array(ExtractedQuestionSchema)
    .describe(
      'An array of question objects, each containing the question details, suggested tags, and a category, extracted from the PDF.'
    ),
});
export type ExtractQuestionsFromPdfOutput = z.infer<typeof ExtractQuestionsFromPdfOutputSchema>;

export async function extractQuestionsFromPdf(
  input: ExtractQuestionsFromPdfInput
): Promise<ExtractQuestionsFromPdfOutput> {
  return extractQuestionsFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractQuestionsFromPdfPrompt',
  input: {schema: ExtractQuestionsFromPdfInputSchema},
  output: {schema: ExtractQuestionsFromPdfOutputSchema},
  prompt: `You are an AI assistant specialized in extracting structured information from educational documents.
Your task is to analyze the provided PDF document and extract individual quiz questions from it.
For each question, you must identify its text, determine its type, extract options and the correct answer (if applicable), provide an explanation (if available or inferable), and suggest relevant tags and a category.

Document Content (from PDF):
{{media url=pdfDataUri}}

{{#if topicHint}}
The general topic or context of this document is: {{{topicHint}}}. Use this information to guide your tagging and categorization more accurately.
{{/if}}

Please structure your output as a JSON object strictly adhering to the schema provided for "ExtractQuestionsFromPdfOutput".
The root object must have a key "extractedQuestions", which is an array of question objects.
Each question object in the "extractedQuestions" array must have the following fields:
- "questionText": (string) The full, complete text of the question.
- "questionType": (enum: 'mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown') The identified type of the question.
- "options": (array of strings, optional) For 'mcq' type, list all multiple choice options. Omit if not an MCQ.
- "answer": (string, optional) The correct answer.
    - For 'mcq', this must be the full text of the correct option (e.g., "Paris", not "C").
    - For 'short_answer' or 'fill_in_the_blank', this is the expected answer text.
    - For 'true_false', this should be "True" or "False".
    - Omit this field if the answer is not identifiable or not applicable.
- "explanation": (string, optional) An explanation for the correct answer. If not directly present, try to infer or generate a concise one if possible. Omit if not applicable.
- "suggestedTags": (array of strings) Provide 3-5 relevant and specific keywords or tags for the question based on its content.
- "suggestedCategory": (string) Suggest a single, broader academic subject or category for this question (e.g., "Physics", "Literature", "Ancient History", "Calculus", "Organic Chemistry").

Important Instructions:
- Focus solely on extracting question-answer units. Ignore non-question text like chapter titles, general instructions not part of a specific question, page numbers, or headers/footers.
- If a question's type is ambiguous, use 'unknown'.
- If parts of a question (like options or a clear answer) are missing or unclear, extract what is available and omit optional fields as necessary.
- Ensure the 'answer' for MCQs is the option text, not just a letter/number, unless the options themselves are solely letters/numbers.
- If the PDF contains sections that are not questions, do not attempt to create question objects for them.
- Adhere strictly to the JSON output format and schema descriptions.
`,
});

const extractQuestionsFromPdfFlow = ai.defineFlow(
  {
    name: 'extractQuestionsFromPdfFlow',
    inputSchema: ExtractQuestionsFromPdfInputSchema,
    outputSchema: ExtractQuestionsFromPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return an output for PDF question extraction.');
    }
    // Ensure the output structure matches, especially the root `extractedQuestions` key.
    // The prompt is designed to return the full output schema structure.
    return output;
  }
);
