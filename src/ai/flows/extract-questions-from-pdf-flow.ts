
'use server';
/**
 * @fileOverview Extracts structured questions, tags, categories, and image descriptions from a PDF document using AI.
 * Optionally, it can attempt to auto-suggest answers for MCQs and explanations if they are not found.
 *
 * - extractQuestionsFromPdf - A function that processes a PDF and returns extracted questions.
 * - ExtractQuestionsFromPdfInput - The input type for the extractQuestionsFromPdf function.
 * - ExtractQuestionsFromPdfOutput - The return type for the extractQuestionsFromPdf function.
 * - ExtractedQuestion - The type for a single extracted question.
 */

import {ai} from '@/ai/genkit';
import { z as z_ } from 'genkit'; // Using z from genkit internal for schema only

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
  autoSuggestMcqAnswers: z_
    .boolean()
    .optional()
    .describe(
      'Optional: If true, for MCQs where an answer is not clearly found, the AI will attempt to suggest one from the options.'
    ),
  autoSuggestExplanations: z_
    .boolean()
    .optional()
    .describe(
      'Optional: If true, for any question where an explanation is not clearly found, the AI will attempt to generate one.'
    ),
});

const InternalExtractedQuestionSchema = z_.object({
  questionText: z_.string().describe('The full text of the question. Mathematical expressions (inline or block), including matrices and complex diagrams defined in LaTeX (e.g., TikZ code for graphs), should be in their original LaTeX format (e.g., $E=mc^2$, $$ x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a} $$, or complex LaTeX like \\begin{tikzpicture}...\\end{tikzpicture}).'),
  questionType: z_
    .enum(['mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown'])
    .describe('The identified type of the question.'),
  options: z_
    .array(z_.string().describe('A multiple choice option. Mathematical expressions, including matrices and complex LaTeX diagrams, should be in LaTeX format.'))
    .optional()
    .describe('For "mcq" type, an array of choices. Otherwise, this may be omitted.'),
  answer: z_
    .string()
    .optional()
    .describe(
      "The correct answer. Mathematical expressions, including matrices and complex LaTeX diagrams, should be in LaTeX format. For 'mcq', this should be the full text of the correct option. For 'short_answer' or 'fill_in_the_blank', it's the expected answer text. Omit if not applicable or unidentifiable unless auto-suggestion is enabled."
    ),
  explanation: z_
    .string()
    .optional()
    .describe('An explanation for the correct answer. Mathematical expressions, including matrices and complex LaTeX diagrams, should be in LaTeX format. For MCQs and True/False questions, if an explanation is not directly present in the text, please try to infer or generate a concise and accurate one, especially if auto-suggestion is enabled.'),
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
        "A brief description of a visual element (diagram, chart, image) from the PDF *that is not defined directly in LaTeX* and is directly associated with this question, if one exists on the same page. Describes what the image shows and its relation to the question."
    ),
  marks: z_
    .number()
    .int()
    .optional()
    .describe("The number of marks or points allocated to the question, if specified in the PDF. Omit if not found.")
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
For each question, you must identify its text, determine its type, extract options, the correct answer, provide an explanation, suggest tags, a category, describe any relevant images (that are not LaTeX-defined), and identify marks/points if specified.

VERY IMPORTANT: Preserve all mathematical expressions (including matrices and complex LaTeX diagrams like TikZ) using standard LaTeX notation ($...$ for inline, $$...$$ for block, and environments like pmatrix for matrices).

Document Content (from PDF):
{{media url=pdfDataUri}}

{{#if topicHint}}
General topic/context: {{{topicHint}}}. Use this for accuracy in tagging, categorization, and LaTeX formatting.
{{/if}}

Tagging Instructions:
{{#if globalTags}}
Apply these global tags to ALL questions: "{{{globalTags}}}". Parse these comma-separated tags. For each question, include these global tags in its "suggestedTags" array, then add 2-4 additional specific tags.
{{else}}
For each question, provide 3-5 relevant specific keywords/tags for the "suggestedTags" array.
{{/if}}

Answer Extraction/Suggestion for MCQs:
{{#if autoSuggestMcqAnswers}}
  **Auto-Suggest MCQ Answers is ENABLED.**
  For each MCQ:
  1. First, diligently search the PDF text for an explicitly stated correct answer.
  2. If you find one with high confidence, use it.
  3. If you DO NOT find an explicitly stated correct answer, OR if you find something but have low confidence, you **MUST** then analyze the question and its options to determine the most plausible correct answer.
  4. The 'answer' field for this MCQ in your output **MUST** then be populated with the full text of this chosen correct option. It should not be omitted or empty when this mode is enabled.
{{else}}
  **Auto-Suggest MCQ Answers is DISABLED.**
  For each MCQ: Identify the correct answer **ONLY IF** it is explicitly and clearly available in the PDF text.
  If no such answer is found, you **MUST** omit the 'answer' field in your output or leave it as an empty string. Do not attempt to guess.
{{/if}}

Explanation Extraction/Generation:
{{#if autoSuggestExplanations}}
  **Auto-Suggest Explanations is ENABLED.**
  For each question:
  1. First, diligently search the PDF text for an existing explanation.
  2. If you find one with high confidence, use it.
  3. If you DO NOT find an explicit explanation, OR if you find one but have low confidence in its quality/relevance, you **MUST** then generate a concise and accurate explanation.
  4. If an answer is available (extracted or suggested), ensure your explanation aligns with it and clarifies why it's correct. For MCQs, briefly explain why other key options are incorrect if it adds value.
  5. The 'explanation' field in your output **MUST** be populated with this extracted or generated explanation. It should not be omitted or empty when this mode is enabled.
{{else}}
  **Auto-Suggest Explanations is DISABLED.**
  For each question: Identify an explanation **ONLY IF** it is explicitly available in the PDF text or can be trivially inferred (e.g., for MCQs and True/False questions based on the answer).
  For other question types, only include an explanation if explicitly present in the PDF.
  If no explanation is found according to these rules, you **MUST** omit the 'explanation' field or leave it as an empty string.
{{/if}}

Output Structure:
Please structure your output as a JSON object strictly adhering to the schema for "ExtractQuestionsFromPdfOutput".
The root object must have a key "extractedQuestions", which is an array of question objects.
Each question object must have the fields: "questionText", "questionType", "options" (optional), "answer" (optional, unless auto-suggest enabled for MCQs), "explanation" (optional, unless auto-suggest enabled), "suggestedTags", "suggestedCategory", "relevantImageDescription" (optional), "marks" (optional).

Detailed Field Instructions:
- "questionText": Full question text. Math (matrices, TikZ) in LaTeX.
- "questionType": 'mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown'.
- "options": Array of strings for MCQs. Math in LaTeX. Omit if not MCQ.
- "answer": Correct answer text. Math in LaTeX.
    - For MCQs: Full text of the correct option. (Follow Auto-Suggest MCQ Answers instruction above).
    - For 'short_answer'/'fill_in_the_blank': Expected answer text.
    - For 'true_false': "True" or "False".
- "explanation": Explanation for the answer. Math in LaTeX. (Follow Auto-Suggest Explanations instruction above).
- "suggestedTags": Array of strings (global + specific tags).
- "suggestedCategory": Single broader academic subject/category.
- "relevantImageDescription": If a non-LaTeX visual on the same page is directly relevant, describe it. Else, omit.
- "marks": Integer value if specified in PDF. Else, omit.

General Guidelines:
- Focus on question-answer units. Ignore non-question text.
- If type is ambiguous, use 'unknown'.
- Adhere strictly to JSON format and schema.
- Mark Allocation Guidance (Concise): If marks are specified (e.g., 5 marks), the explanation/answer should ideally cover a corresponding number of key points. Prioritize accuracy and clarity. Ensure all mathematical content is in LaTeX.
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
    // More robust check for the output structure
    if (!output || !output.extractedQuestions || !Array.isArray(output.extractedQuestions)) {
      console.error('AI output is missing, malformed, or extractedQuestions is not an array. Output received:', JSON.stringify(output, null, 2));
      throw new Error('AI failed to return a valid structure for extracted questions. Please check the PDF content or try again.');
    }
    return output;
  }
);
