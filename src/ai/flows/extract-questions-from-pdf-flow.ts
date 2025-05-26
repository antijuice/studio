
'use server';
/**
 * @fileOverview Extracts structured questions, tags, categories, and image descriptions from a PDF document using AI.
 *
 * - extractQuestionsFromPdf - A function that processes a PDF and returns extracted questions.
 * - ExtractQuestionsFromPdfInput - The input type for the extractQuestionsFromPdf function.
 * - ExtractQuestionsFromPdfOutput - The return type for the extractQuestionsFromPdf function.
 * - ExtractedQuestion - The type for a single extracted question.
 */

import {ai} from '@/ai/genkit';
import {z}_ from 'genkit'; // Using z from genkit internal for schema only

// Internal Zod Schemas - NOT EXPORTED from this 'use server' file
const InternalExtractQuestionsFromPdfInputSchema = z_.object({
  pdfDataUri: z_
    .string()
    .describe(
      "A PDF document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  topicHint: z_
    .string()
    .optional()
    .describe(
      'Optional: A hint about the general topic of the PDF to improve tagging and categorization (e.g., "Chapter 5 on Photosynthesis").'
    ),
  globalTags: z_
    .string()
    .optional()
    .describe(
        'Optional: Comma-separated global tags to apply to all extracted questions (e.g., "Midterm Exam, Biology 101"). These will be added to the question-specific tags.'
    ),
});

const InternalExtractedQuestionSchema = z_.object({
  questionText: z_.string().describe('The full text of the question.'),
  questionType: z_
    .enum(['mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown'])
    .describe('The identified type of the question.'),
  options: z_
    .array(z_.string())
    .optional()
    .describe('For "mcq" type, an array of choices. Otherwise, this may be omitted.'),
  answer: z_
    .string()
    .optional()
    .describe(
      "The correct answer. For 'mcq', this should be the full text of the correct option. For 'short_answer' or 'fill_in_the_blank', it's the expected answer text. Omit if not applicable or unidentifiable."
    ),
  explanation: z_
    .string()
    .optional()
    .describe('An explanation for the correct answer, if available or inferable from the text.'),
  suggestedTags: z_
    .array(z_.string())
    .describe('An array of 3-7 relevant keywords or tags for the question, derived from its content and including any global tags if provided.'),
  suggestedCategory: z_
    .string()
    .describe(
      "A suggested broader academic category for this question (e.g., 'Algebra', 'Cell Biology', 'World War II', 'Literary Analysis')."
    ),
  relevantImageDescription: z_
    .string()
    .optional()
    .describe(
        "A brief description of a visual element (diagram, chart, image) from the PDF directly associated with this question, if one exists on the same page. Describes what the image shows and its relation to the question."
    ),
});

const InternalExtractQuestionsFromPdfOutputSchema = z_.object({
  extractedQuestions: z_
    .array(InternalExtractedQuestionSchema)
    .describe(
      'An array of question objects, each containing the question details, suggested tags (including global ones), a category, and a description of any relevant image, extracted from the PDF.'
    ),
});


// Exported Types (mirroring internal Zod schemas for external use)
export type ExtractQuestionsFromPdfInput = z_.infer<typeof InternalExtractQuestionsFromPdfInputSchema>;
export type ExtractedQuestion = z_.infer<typeof InternalExtractedQuestionSchema>; // Note: This type is distinct from the one in lib/types.ts that includes `id`
export type ExtractQuestionsFromPdfOutput = z_.infer<typeof InternalExtractQuestionsFromPdfOutputSchema>;


export async function extractQuestionsFromPdf(
  input: ExtractQuestionsFromPdfInput
): Promise<ExtractQuestionsFromPdfOutput> {
  return extractQuestionsFromPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractQuestionsFromPdfPrompt',
  input: {schema: InternalExtractQuestionsFromPdfInputSchema},
  output: {schema: InternalExtractQuestionsFromPdfOutputSchema},
  prompt: `You are an AI assistant specialized in extracting structured information from educational documents, including MCQ exams.
Your task is to analyze the provided PDF document and extract individual quiz questions from it.
For each question, you must identify its text, determine its type (especially 'mcq' for multiple choice questions), extract options and the correct answer (if applicable), provide an explanation (if available or inferable), suggest relevant tags, a category, and describe any relevant images.

Document Content (from PDF):
{{media url=pdfDataUri}}

{{#if topicHint}}
The general topic or context of this document is: {{{topicHint}}}. Use this information to guide your tagging, categorization, and image relevance assessment more accurately.
{{/if}}

{{#if globalTags}}
The user has provided the following global tags that should be applied to ALL questions extracted: "{{{globalTags}}}".
Please parse these comma-separated tags. For each question you extract, ensure its "suggestedTags" array includes these global tags. Then, add 2-4 additional specific tags you identify for that particular question. The final "suggestedTags" array should contain both the global tags and the specific tags you've generated. Avoid duplicating tags if a global tag is also highly relevant specifically.
{{else}}
For each question, provide 3-5 relevant and specific keywords or tags based on its content for the "suggestedTags" array.
{{/if}}


Please structure your output as a JSON object strictly adhering to the schema provided for "ExtractQuestionsFromPdfOutput".
The root object must have a key "extractedQuestions", which is an array of question objects.
Each question object in the "extractedQuestions" array must have the following fields:
- "questionText": (string) The full, complete text of the question.
- "questionType": (enum: 'mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown') The identified type of the question. Ensure 'mcq' is used for multiple-choice questions.
- "options": (array of strings, optional) For 'mcq' type, list all multiple choice options. Omit if not an MCQ.
- "answer": (string, optional) The correct answer.
    - For 'mcq', this must be the full text of the correct option (e.g., "Paris", not "C").
    - For 'short_answer' or 'fill_in_the_blank', this is the expected answer text.
    - For 'true_false', this should be "True" or "False".
    - Omit this field if the answer is not identifiable or not applicable.
- "explanation": (string, optional) An explanation for the correct answer. If not directly present, try to infer or generate a concise one if possible. Omit if not applicable.
- "suggestedTags": (array of strings) As instructed above, combine global tags (if provided) with 3-5 question-specific tags.
- "suggestedCategory": (string) Suggest a single, broader academic subject or category for this question (e.g., "Physics", "Literature", "Ancient History", "Calculus", "Organic Chemistry").
- "relevantImageDescription": (string, optional) Examine the content of the question and its surrounding area on the same page in the PDF. If there is a distinct visual element (like a diagram, chart, photograph, or illustration) that is *directly and highly relevant* to understanding or answering that specific question, provide a brief description of this visual element. For example, 'A diagram of a plant cell with labels for nucleus and chloroplast, relevant to the question about cell organelles.' If no such specific, relevant visual is present for a question, or if it's just decorative or not on the same page, omit this field. Do not attempt to extract image data itself.

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
    inputSchema: InternalExtractQuestionsFromPdfInputSchema,
    outputSchema: InternalExtractQuestionsFromPdfOutputSchema,
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

