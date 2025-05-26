
"use server";

import { 
  generateCustomQuiz as genCustomQuizAI, 
  type GenerateCustomQuizInput, 
  type GenerateCustomQuizOutput 
} from "@/ai/flows/generate-custom-quiz";
import { 
  generateQuizFromPdf as genQuizFromPdfAI, 
  type GenerateQuizFromPdfInput as GenQuizFromPdfAIInput, 
  type GenerateQuizFromPdfOutput 
} from "@/ai/flows/generate-quiz-from-pdf";
import { 
  evaluateShortAnswer as evalShortAnswerAI, 
  type EvaluateShortAnswerInput, 
  type EvaluateShortAnswerOutput 
} from "@/ai/flows/evaluate-short-answer";
import {
  extractQuestionsFromPdf as extractQuestionsAI,
  type ExtractQuestionsFromPdfInput as AIExtractQuestionsInput, 
  type ExtractQuestionsFromPdfOutput as AIExtractQuestionsOutput, 
} from "@/ai/flows/extract-questions-from-pdf-flow";
import {
  suggestMcqAnswer as suggestMcqAnswerAI,
  type SuggestMcqAnswerInput,
  type SuggestMcqAnswerOutput,
} from "@/ai/flows/suggest-mcq-answer-flow";
import {
  suggestExplanation as suggestExplanationAI,
  type SuggestExplanationInput, 
  type SuggestExplanationOutput,
} from "@/ai/flows/suggest-explanation-flow";
import type { 
  CustomQuizGenOutput, 
  PdfQuizGenOutput, 
  ShortAnswerEvaluationOutput, 
  ExtractedQuestion, 
  ExtractQuestionsFromPdfOutput, 
  SaveQuestionToBankOutput,
  ExtractQuestionsFromPdfInput,
  BankedQuestionFromDB
} from "@/lib/types"; 
import { db, auth, collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc, Timestamp } from "@/lib/firebase"; // Firebase imports

export async function generateCustomQuizAction(input: GenerateCustomQuizInput): Promise<CustomQuizGenOutput> {
  try {
    const result = await genCustomQuizAI(input);
    return result as CustomQuizGenOutput; 
  } catch (error) {
    console.error("Error in generateCustomQuizAction:", error);
    throw new Error("Failed to generate custom quiz. Please try again.");
  }
}

export async function generateQuizFromPdfAction(input: GenQuizFromPdfAIInput): Promise<PdfQuizGenOutput> {
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
    const result: AIExtractQuestionsOutput = await extractQuestionsAI(input as AIExtractQuestionsInput);
    
    if (!result || !Array.isArray(result.extractedQuestions)) {
      console.error('Invalid AI output from extractQuestionsAI:', result);
      throw new Error('AI returned an invalid format for extracted questions.');
    }

    // Client-side ID generation for UI keying during extraction phase
    const questionsWithClientIds: ExtractedQuestion[] = result.extractedQuestions.map((q, index) => ({
      ...q,
      id: `extracted-${Date.now()}-${index}`, 
    }));
    return { extractedQuestions: questionsWithClientIds };
  } catch (error) {
    console.error("Error in extractQuestionsFromPdfAction:", error);
    if (error instanceof Error && error.message.includes("AI failed to return a valid structure")) {
      throw error; 
    }
    throw new Error("Failed to extract questions from PDF. Please check the PDF or try again.");
  }
}

export async function saveQuestionToBankAction(questionData: Omit<ExtractedQuestion, 'id' | 'userId' | 'createdAt'>): Promise<SaveQuestionToBankOutput> {
  if (!auth.currentUser) {
    throw new Error("User not authenticated. Cannot save question to bank.");
  }
  const userId = auth.currentUser.uid;

  try {
    const questionToSave = {
      ...questionData,
      userId,
      createdAt: serverTimestamp(), // Firestore server-side timestamp
    };
    const docRef = await addDoc(collection(db, "questions"), questionToSave);
    console.log("Question saved to Firestore with ID:", docRef.id);
    return {
      success: true,
      questionId: docRef.id,
      message: `Question "${questionData.questionText.substring(0, 30)}..." saved to bank.`,
    };
  } catch (error) {
    console.error("Error saving question to Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred saving to database.";
    throw new Error(`Failed to save question to bank: ${errorMessage}`);
  }
}

export async function getBankedQuestionsForUserAction(): Promise<BankedQuestionFromDB[]> {
  if (!auth.currentUser) {
    console.warn("User not authenticated. Returning empty question bank.");
    return [];
  }
  const userId = auth.currentUser.uid;

  try {
    const q = query(collection(db, "questions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const questions: BankedQuestionFromDB[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      questions.push({
        ...data,
        id: docSnap.id,
        // Ensure createdAt is a serializable format (ISO string)
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt || new Date().toISOString()),
      } as BankedQuestionFromDB);
    });
    // Sort by creation date, newest first
    questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Firestore:", error);
    throw new Error("Failed to fetch questions from bank.");
  }
}

export async function removeQuestionFromBankAction(questionDocId: string): Promise<{success: boolean, message: string}> {
  if (!auth.currentUser) {
    throw new Error("User not authenticated. Cannot remove question.");
  }
  // Firestore rules should be the primary way to ensure a user can only delete their own questions.
  // For an additional layer, you could fetch the doc first and check userId, but that's an extra read.
  try {
    await deleteDoc(doc(db, "questions", questionDocId));
    return {
      success: true,
      message: "Question successfully removed from the bank.",
    };
  } catch (error) {
    console.error("Error removing question from Firestore:", error);
    throw new Error("Failed to remove question from bank.");
  }
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

export async function suggestExplanationAction(input: SuggestExplanationInput): Promise<SuggestExplanationOutput> {
  try {
    const result = await suggestExplanationAI(input);
    return result;
  } catch (error)
{
    console.error("Error in suggestExplanationAction:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while suggesting an explanation.";
    throw new Error(errorMessage);
  }
}
