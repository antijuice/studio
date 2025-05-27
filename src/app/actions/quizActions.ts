
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
// Import auth to check its state on the server (for debugging)
import { auth, db, collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc, Timestamp } from "@/lib/firebase"; 

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

  // --- DEBUGGING ---
  const serverAuthInstance = auth; // auth is imported from @/lib/firebase
  const serverCurrentUser = serverAuthInstance.currentUser; // This will likely be null in a Server Action environment for client SDK
  console.log("[Server Action - saveQuestionToBankAction] Auth object available on server:", !!serverAuthInstance);
  console.log("[Server Action - saveQuestionToBankAction] auth.currentUser on server:", serverCurrentUser ? serverCurrentUser.uid : null);
  console.log("[Server Action - saveQuestionToBankAction] userId passed from client to be saved:", userId);
  // --- END DEBUGGING ---

  try {
    const questionToSave = {
      ...questionData,
      userId, // Use the userId passed from the client
      createdAt: serverTimestamp(), 
    };
    // console.log("[Server Action] Attempting to save to Firestore:", JSON.stringify(questionToSave, null, 2));
    const docRef = await addDoc(collection(db, "questions"), questionToSave);
    // console.log("[Server Action] Question saved to Firestore with ID:", docRef.id);
    return {
      success: true,
      questionId: docRef.id,
      message: `Question "${questionData.questionText.substring(0, 30)}..." saved to bank.`,
    };
  } catch (error) {
    console.error("[Server Action - saveQuestionToBankAction] Error saving question to Firestore:", error); 
    if (error instanceof Error) {
        // Check if it's a FirebaseError and has a code
        const firebaseError = error as any; // Cast to any to check for 'code'
        if (firebaseError.code) {
             // Log the specific Firebase error code and message
            console.error(`[Server Action - saveQuestionToBankAction] Firebase Error Code: ${firebaseError.code}, Message: ${firebaseError.message}`);
            throw new Error(`Firestore Error (${firebaseError.code}): ${firebaseError.message}`);
        }
        throw new Error(`Failed to save question to bank: ${error.message}`);
    }
    throw new Error("Failed to save question to bank due to an unknown error. Check server logs.");
  }
}

export async function getBankedQuestionsForUserAction(userId: string): Promise<BankedQuestionFromDB[]> {
   if (!userId) {
    // This check is a fallback; client should always send a valid UID.
    console.warn("[Server Action - getBankedQuestionsForUserAction] User ID not provided. Returning empty question bank.");
    return [];
  }
  // --- DEBUGGING ---
  const serverAuthInstance = auth; 
  const serverCurrentUser = serverAuthInstance.currentUser; 
  console.log("[Server Action - getBankedQuestionsForUserAction] Auth object available on server:", !!serverAuthInstance);
  console.log("[Server Action - getBankedQuestionsForUserAction] auth.currentUser on server (expected null):", serverCurrentUser ? serverCurrentUser.uid : null);
  console.log("[Server Action - getBankedQuestionsForUserAction] Fetching questions for userId from client:", userId);
  // --- END DEBUGGING ---

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
    console.error("[Server Action - getBankedQuestionsForUserAction] Error fetching questions from Firestore:", error);
    if (error instanceof Error) {
        const firebaseError = error as any; 
        if (firebaseError.code) {
            console.error(`[Server Action - getBankedQuestionsForUserAction] Firebase Error Code: ${firebaseError.code}, Message: ${firebaseError.message}`);
            throw new Error(`Firestore Error (${firebaseError.code}): ${firebaseError.message}`);
        }
        throw new Error(`Failed to fetch questions from bank: ${error.message}`);
    }
    throw new Error("Failed to fetch questions from bank. Check server logs.");
  }
}

export async function removeQuestionFromBankAction(questionDocId: string): Promise<{success: boolean, message: string}> {
  // Firestore rules are the primary guard here.
  // --- DEBUGGING ---
  const serverAuthInstance = auth; 
  const serverCurrentUser = serverAuthInstance.currentUser; 
  console.log("[Server Action - removeQuestionFromBankAction] Auth object available on server:", !!serverAuthInstance);
  console.log("[Server Action - removeQuestionFromBankAction] auth.currentUser on server (expected null):", serverCurrentUser ? serverCurrentUser.uid : null);
  console.log("[Server Action - removeQuestionFromBankAction] Attempting to remove docId:", questionDocId);
  // --- END DEBUGGING ---
  try {
    await deleteDoc(doc(db, "questions", questionDocId));
    return {
      success: true,
      message: "Question successfully removed from the bank.",
    };
  } catch (error) {
    console.error("[Server Action - removeQuestionFromBankAction] Error removing question from Firestore:", error);
    if (error instanceof Error) {
        const firebaseError = error as any; 
        if (firebaseError.code) {
            console.error(`[Server Action - removeQuestionFromBankAction] Firebase Error Code: ${firebaseError.code}, Message: ${firebaseError.message}`);
            throw new Error(`Firestore Error (${firebaseError.code}): ${firebaseError.message}`);
        }
        throw new Error(`Failed to remove question from bank: ${error.message}`);
    }
    throw new Error("Failed to remove question from bank. Check server logs.");
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
    

    