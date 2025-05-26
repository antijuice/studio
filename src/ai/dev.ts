
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-custom-quiz.ts';
import '@/ai/flows/generate-quiz-from-pdf.ts';
import '@/ai/flows/evaluate-short-answer.ts';
import '@/ai/flows/extract-questions-from-pdf-flow.ts';
import '@/ai/flows/suggest-mcq-answer-flow.ts'; // Added new flow
