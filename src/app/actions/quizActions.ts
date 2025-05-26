
"use server";

import { 
  generateCustomQuiz as genCustomQuizAI, 
  type GenerateCustomQuizInput, 
  type GenerateCustomQuizOutput 
} from "@/ai/flows/generate-custom-quiz";
import { 
  generateQuizFromPdf as genQuizFromPdfAI, 
  type GenerateQuizFromPdfInput, 
  type GenerateQuizFromPdfOutput 
} from "@/ai/flows/generate-quiz-from-pdf";
import { 
  evaluateShortAnswer as evalShortAnswerAI, 
  type EvaluateShortAnswerInput, 
  type EvaluateShortAnswerOutput 
} from "@/ai/flows/evaluate-short-answer";
import {
  extractQuestionsFromPdf as extractQuestionsAI,
  type ExtractQuestionsFromPdfInput,
  type ExtractQuestionsFromPdfOutput as AIExtractQuestionsOutput, 
} from "@/ai/flows/extract-questions-from-pdf-flow";
import {
  suggestMcqAnswer as suggestMcqAnswerAI,
  type SuggestMcqAnswerInput,
  type SuggestMcqAnswerOutput,
} from "@/ai/flows/suggest-mcq-answer-flow";
import type { 
  CustomQuizGenOutput, 
  PdfQuizGenOutput, 
  ShortAnswerEvaluationOutput, 
  ExtractedQuestion, 
  ExtractQuestionsFromPdfOutput, 
  SaveQuestionToBankOutput
} from "@/lib/types"; 

export async function generateCustomQuizAction(input: GenerateCustomQuizInput): Promise<CustomQuizGenOutput> {
  try {
    const result = await genCustomQuizAI(input);
    return result as CustomQuizGenOutput; 
  } catch (error) {
    console.error("Error in generateCustomQuizAction:", error);
    throw new Error("Failed to generate custom quiz. Please try again.");
  }
}

export async function generateQuizFromPdfAction(input: GenerateQuizFromPdfInput): Promise<PdfQuizGenOutput> {
  try {
    const result = await genQuizFromPdfAI(input);
    return result as PdfQuizGenOutput;
  } catch (error) {
    console.error("Error in generateQuizFromPdfAction:", error);
    const errorMessage = (error instanceof Error && error.message) ? error.message : String(error);
    if (errorMessage.includes("processing pdfDataUri")) {
       throw new Error("Failed to process PDF. Please ensure it's a valid PDF file and try again.");
    }
    throw new Error("Failed to generate quiz from PDF. Please try again.");
  }
}

export async function evaluateShortAnswerAction(input: EvaluateShortAnswerInput): Promise<ShortAnswerEvaluationOutput> {
  try {
    const result = await evalShortAnswerAI(input);
    return result as ShortAnswerEvaluationOutput;
  } catch (error) {
    console.error("Error in evaluateShortAnswerAction:", error);
    throw new Error("Failed to evaluate short answer. Please try again.");
  }
}

export async function extractQuestionsFromPdfAction(input: ExtractQuestionsFromPdfInput): Promise<ExtractQuestionsFromPdfOutput> {
  try {
    const result: AIExtractQuestionsOutput = await extractQuestionsAI(input);
    
    if (!result || !Array.isArray(result.extractedQuestions)) {
      console.error('Invalid AI output from extractQuestionsAI:', result);
      throw new Error('AI returned an invalid format for extracted questions.');
    }

    const questionsWithIds: ExtractedQuestion[] = result.extractedQuestions.map((q, index) => ({
      ...q,
      id: `extracted-${Date.now()}-${index}`, 
    }));
    return { extractedQuestions: questionsWithIds };
  } catch (error) {
    console.error("Error in extractQuestionsFromPdfAction:", error);
    if (error instanceof Error && error.message.includes("AI failed to return a valid structure")) {
      throw error; // Re-throw specific AI error
    }
    throw new Error("Failed to extract questions from PDF. Please check the PDF or try again.");
  }
}

export async function saveQuestionToBankAction(question: ExtractedQuestion): Promise<SaveQuestionToBankOutput> {
  console.log("Attempting to save question to bank (simulated):", question.id, question.questionText);
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (question.questionText.toLowerCase().includes("fail")) { 
    console.error("Simulated failure saving question:", question.id);
    throw new Error(`Simulated error: Could not save question "${question.questionText.substring(0,20)}..."`);
  }

  const newQuestionIdInBank = `bank-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log("Question (simulated) saved with bank ID:", newQuestionIdInBank);

  return {
    success: true,
    questionId: newQuestionIdInBank,
    message: `Question "${question.questionText.substring(0, 30)}..." (simulated) saved to bank.`,
  };
}

export async function suggestMcqAnswerAction(input: SuggestMcqAnswerInput): Promise<SuggestMcqAnswerOutput> {
  try {
    const result = await suggestMcqAnswerAI(input);
    return result;
  } catch (error) {
    console.error("Error in suggestMcqAnswerAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while suggesting an answer.";
    throw new Error(errorMessage);
  }
}
