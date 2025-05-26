
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
  type ExtractQuestionsFromPdfOutput as AIExtractQuestionsOutput, // Renamed to avoid conflict with local type
} from "@/ai/flows/extract-questions-from-pdf-flow";
import type { 
  CustomQuizGenOutput, 
  PdfQuizGenOutput, 
  ShortAnswerEvaluationOutput, 
  ExtractedQuestion, 
  ExtractQuestionsFromPdfOutput, // This is the type used in the UI and action signature
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
    // Map AI output to UI type, adding a temporary client-side ID
    const questionsWithIds: ExtractedQuestion[] = result.extractedQuestions.map((q, index) => ({
      ...q,
      id: `extracted-${Date.now()}-${index}`, // Simple unique ID for client-side keying
    }));
    return { extractedQuestions: questionsWithIds };
  } catch (error) {
    console.error("Error in extractQuestionsFromPdfAction:", error);
    throw new Error("Failed to extract questions from PDF. Please try again.");
  }
}

export async function saveQuestionToBankAction(question: ExtractedQuestion): Promise<SaveQuestionToBankOutput> {
  console.log("Attempting to save question to bank (simulated):", question.id, question.questionText);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate a successful save for now
  // In a real app, this would involve database interaction:
  // - Check for duplicates
  // - Save the question
  // - Return the actual ID from the database
  if (question.questionText.toLowerCase().includes("fail")) { // Simulate a failure for testing
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
