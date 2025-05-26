
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
For each question, you must identify its text, determine its type (especially 'mcq' for multiple choice questions), extract options and the correct answer (if applicable), provide an explanation (if available or inferable), suggest relevant tags, a category, describe any relevant images (that are not directly LaTeX-defined), and identify the number of marks/points if specified.

VERY IMPORTANT: When mathematical expressions or equations are present in the question text, options, answers, or explanations, you MUST preserve them using standard LaTeX notation.
- Use $...$ for inline mathematics (e.g., 'the value of $x$ is $5 \\times 10^3$').
- Use $$...$$ for display/block mathematics (e.g., 'solve the equation $$ax^2 + bx + c = 0$$').
- For matrices, use appropriate LaTeX environments such as 'pmatrix' (for parentheses), 'bmatrix' (for square brackets), 'vmatrix' (for single vertical bars), etc. Inside these environments, use '&' to separate elements in a row and '\\\\' to indicate a new row.
  Example of a 2x2 matrix with parentheses: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$
  Example of a 2x2 matrix with square brackets: $$\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$$
- For complex diagrams or graphs defined using LaTeX (e.g., TikZ code), preserve the entire LaTeX code block accurately as a string within the $$...$$ delimiters. For example, if you encounter '\\begin{tikzpicture}...\\end{tikzpicture}', it should be extracted as '$$\\begin{tikzpicture}...\\end{tikzpicture}$$'.
- Ensure all LaTeX is well-formed and correctly represents the mathematical content from the PDF.

Document Content (from PDF):
{{media url=pdfDataUri}}

{{#if topicHint}}
The general topic or context of this document is: {{{topicHint}}}. Use this information to guide your tagging, categorization, image relevance assessment, and LaTeX formatting more accurately.
{{/if}}

{{#if globalTags}}
The user has provided the following global tags that should be applied to ALL questions extracted: "{{{globalTags}}}".
Please parse these comma-separated tags. For each question you extract, ensure its "suggestedTags" array includes these global tags. Then, add 2-4 additional specific tags you identify for that particular question. The final "suggestedTags" array should contain both the global tags and the specific tags you've generated. Avoid duplicating tags if a global tag is also highly relevant specifically.
{{else}}
For each question, provide 3-5 relevant and specific keywords or tags based on its content for the "suggestedTags" array.
{{/if}}

{{#if autoSuggestMcqAnswers}}
Auto-Suggest MCQ Answers: Enabled. For Multiple Choice Questions (MCQs), if you cannot confidently identify the correct answer directly from the text, please analyze the question and its options and suggest the most plausible correct answer. The 'answer' field MUST be the full text of one of the provided options.
{{/if}}

{{#if autoSuggestExplanations}}
Auto-Suggest Explanations: Enabled. For all questions, if an explanation for the answer is not directly present in the text, please try to generate a concise and accurate one. This explanation should clarify why the answer is correct, and for MCQs, might briefly explain why other key options are incorrect if that adds significant value. Ensure mathematical content in explanations is in LaTeX.
{{else}}
For MCQs and True/False questions, if an explanation is not directly present in the text, please try to infer or generate a concise and accurate one.
{{/if}}


Please structure your output as a JSON object strictly adhering to the schema provided for "ExtractQuestionsFromPdfOutput".
The root object must have a key "extractedQuestions", which is an array of question objects.
Each question object in the "extractedQuestions" array must have the following fields:
- "questionText": (string) The full, complete text of the question. Ensure any math (including matrices and complex LaTeX diagrams like TikZ) is in LaTeX.
- "questionType": (enum: 'mcq', 'short_answer', 'true_false', 'fill_in_the_blank', 'unknown') The identified type of the question. Ensure 'mcq' is used for multiple-choice questions.
- "options": (array of strings, optional) For 'mcq' type, list all multiple choice options. Each option must have math (including matrices and complex LaTeX diagrams) in LaTeX. Omit if not an MCQ.
- "answer": (string, optional) The correct answer. Ensure any math (including matrices and complex LaTeX diagrams) in LaTeX.
    - For 'mcq', this must be the full text of the correct option (e.g., "Paris", not "C"). If autoSuggestMcqAnswers is enabled and no answer is found, provide your best suggestion.
    - For 'short_answer' or 'fill_in_the_blank', this is the expected answer text.
    - For 'true_false', this should be "True" or "False".
    - Omit this field if the answer is not identifiable or not applicable (unless auto-suggestion is enabled for MCQs).
- "explanation": (string, optional) An explanation for the correct answer. Ensure any math (including matrices and complex LaTeX diagrams) in LaTeX. If autoSuggestExplanations is enabled and no explanation is found, generate one. Otherwise, for MCQs and True/False, infer or generate if not present. If not applicable or unidentifiable, omit.
- "suggestedTags": (array of strings) As instructed above, combine global tags (if provided) with 3-5 question-specific tags.
- "suggestedCategory": (string) Suggest a single, broader academic subject or category for this question (e.g., "Physics", "Literature", "Ancient History", "Calculus", "Organic Chemistry").
- "relevantImageDescription": (string, optional) Examine the content of the question and its surrounding area on the same page in the PDF. If there is a distinct visual element (like a diagram, chart, photograph, or illustration) that is *not directly defined in LaTeX* and is *directly and highly relevant* to understanding or answering that specific question, provide a brief description of this visual element. For example, 'A diagram of a plant cell with labels for nucleus and chloroplast, relevant to the question about cell organelles.' If no such specific, relevant visual is present for a question, or if it's just decorative or not on the same page, omit this field. Do not attempt to extract image data itself.
- "marks": (integer, optional) If the question text or its immediate vicinity explicitly states the number of marks or points it is worth (e.g., "(5 marks)", "[3 pts]", "Worth 4 points"), extract this number as an integer. If no marks are specified, omit this field.

Important Instructions:
- Focus solely on extracting question-answer units. Ignore non-question text like chapter titles, general instructions not part of a specific question, page numbers, or headers/footers.
- If a question's type is ambiguous, use 'unknown'.
- If parts of a question (like options or a clear answer) are missing or unclear, extract what is available and omit optional fields as necessary, unless auto-suggestion is enabled for that field.
- Ensure the 'answer' for MCQs is the option text, not just a letter/number, unless the options themselves are solely letters/numbers.
- If the PDF contains sections that are not questions, do not attempt to create question objects for them.
- Mark Allocation Guidance (Concise): If marks are specified (e.g., 5 marks), the explanation/answer should ideally cover a corresponding number of key points. Prioritize accuracy and clarity. Ensure all mathematical content is in LaTeX.
- Adhere strictly to the JSON output format and schema descriptions, including LaTeX formatting for all mathematical content, especially matrices and complex LaTeX diagrams like TikZ.
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

