
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
import { db, collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc, Timestamp } from "@/lib/firebase"; // Firebase imports (auth removed as it's not reliably used here)

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

export async function saveQuestionToBankAction(
  questionData: Omit<ExtractedQuestion, 'id' | 'userId' | 'createdAt'>,
  userId: string // userId passed from client
): Promise<SaveQuestionToBankOutput> {
  if (!userId) {
    // This check is a fallback; client should always send a valid UID.
    throw new Error("User ID not provided. Cannot save question to bank.");
  }

  try {
    const questionToSave = {
      ...questionData,
      userId, // Use the userId passed from the client
      createdAt: serverTimestamp(), 
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
    // Firestore rules will throw specific permission errors if userId doesn't match request.auth.uid
    if (errorMessage.toLowerCase().includes('permission denied') || errorMessage.toLowerCase().includes('missing or insufficient permissions')) {
        throw new Error(`Failed to save question due to permission issues. Ensure you are properly authenticated and allowed to write for this user ID.`);
    }
    throw new Error(`Failed to save question to bank: ${errorMessage}`);
  }
}

export async function getBankedQuestionsForUserAction(userId: string): Promise<BankedQuestionFromDB[]> {
   if (!userId) {
    // This check is a fallback; client should always send a valid UID.
    console.warn("User ID not provided to getBankedQuestionsForUserAction. Returning empty question bank.");
    return [];
  }

  try {
    const q = query(collection(db, "questions"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const questions: BankedQuestionFromDB[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      questions.push({
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : String(data.createdAt || new Date().toISOString()),
      } as BankedQuestionFromDB);
    });
    questions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return questions;
  } catch (error) {
    console.error("Error fetching questions from Firestore:", error);
    // Firestore rules will prevent access if userId doesn't match request.auth.uid
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.toLowerCase().includes('permission denied') || errorMessage.toLowerCase().includes('missing or insufficient permissions')) {
        throw new Error(`Failed to fetch questions due to permission issues. Ensure you are properly authenticated and allowed to read for this user ID.`);
    }
    throw new Error("Failed to fetch questions from bank.");
  }
}

export async function removeQuestionFromBankAction(questionDocId: string): Promise<{success: boolean, message: string}> {
  // Firestore rules are the primary guard here:
  // allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
  // So, no explicit userId check needed from auth.currentUser which can be unreliable here.
  try {
    await deleteDoc(doc(db, "questions", questionDocId));
    return {
      success: true,
      message: "Question successfully removed from the bank.",
    };
  } catch (error) {
    console.error("Error removing question from Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    if (errorMessage.toLowerCase().includes('permission denied') || errorMessage.toLowerCase().includes('missing or insufficient permissions')) {
        throw new Error(`Failed to remove question due to permission issues. Ensure you are properly authenticated and allowed to delete this item.`);
    }
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

    