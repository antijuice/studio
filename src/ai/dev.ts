import { config } from 'dotenv';
config();

import '@/ai/flows/generate-custom-quiz.ts';
import '@/ai/flows/generate-quiz-from-pdf.ts';
import '@/ai/flows/evaluate-short-answer.ts';