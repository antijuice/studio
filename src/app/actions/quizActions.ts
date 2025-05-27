
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
  userId: string // userId MUST be passed from an authenticated client
): Promise<SaveQuestionToBankOutput> {
  
  const serverAuthInstance = auth; // auth is imported from @/lib/firebase (client SDK instance)
  const serverCurrentUser = serverAuthInstance.currentUser;

  console.log(`[Server Action - saveQuestionToBankAction] Server-side client SDK auth.currentUser: ${serverCurrentUser ? serverCurrentUser.uid : 'null (expected in server actions)'}`);
  console.log(`[Server Action - saveQuestionToBankAction] Attempting to save question for client-passed userId: ${userId}`);

  if (!userId) {
    console.error("[Server Action - saveQuestionToBankAction] Error: userId parameter was not provided by the client call.");
    throw new Error("User ID not provided by client. Cannot save question to bank.");
  }
  
  // Note: serverCurrentUser will be null here because the client SDK's auth state
  // is not automatically carried over to server-side instances.
  // Firestore rules (request.auth) are the ultimate check for the actual requester's identity.
  if (!serverCurrentUser) {
      console.warn("[Server Action - saveQuestionToBankAction] Diagnostic: auth.currentUser is null on this server-side client SDK instance. Firestore rules relying on 'request.auth != null' will fail if this call to Firestore is not otherwise authenticated as the end-user by Firebase backend services.");
  }

  try {
    const questionToSave = {
      ...questionData,
      userId, 
      createdAt: serverTimestamp(), 
    };
    const docRef = await addDoc(collection(db, "questions"), questionToSave);
    return {
      success: true,
      questionId: docRef.id,
      message: `Question "${questionData.questionText.substring(0, 30)}..." saved to bank.`,
    };
  } catch (error) {
    console.error("[Server Action - saveQuestionToBankAction] Error during Firestore addDoc:", error);
    let errorMessage = "Failed to save question to bank due to an unknown error. Check server logs.";
    if (error instanceof Error) {
        const firebaseError = error as any; 
        if (firebaseError.code === 'permission-denied' || (firebaseError.message && firebaseError.message.toLowerCase().includes('permission'))) {
             errorMessage = `Firestore Permission Denied: Failed to save question for user ${userId}. This often means 'request.auth' was null in Firestore rules or the rules explicitly denied the write. (Server-side auth.currentUser is typically null in this environment). Details: ${firebaseError.message}`;
             console.error(`[Server Action - saveQuestionToBankAction] Firestore permission error for userId: ${userId}. This indicates 'request.auth' was likely null in your Firestore rules execution context for this server-originated request.`);
        } else if (firebaseError.code) {
            errorMessage = `Firestore Error (${firebaseError.code}): ${firebaseError.message}`;
        } else {
            errorMessage = `Failed to save question to bank: ${error.message}`;
        }
    }
    throw new Error(errorMessage);
  }
}

export async function getBankedQuestionsForUserAction(userId: string): Promise<BankedQuestionFromDB[]> {
   if (!userId) {
    console.warn("[Server Action - getBankedQuestionsForUserAction] User ID not provided by client. Returning empty question bank.");
    return [];
  }
  
  const serverAuthInstance = auth; 
  const serverCurrentUser = serverAuthInstance.currentUser; 
  console.log(`[Server Action - getBankedQuestionsForUserAction] Server-side client SDK auth.currentUser: ${serverCurrentUser ? serverCurrentUser.uid : 'null (expected in server actions)'}`);
  console.log(`[Server Action - getBankedQuestionsForUserAction] Fetching questions for client-passed userId: ${userId}`);

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
    let errorMessage = "Failed to fetch questions from bank. Check server logs.";
    if (error instanceof Error) {
        const firebaseError = error as any; 
        if (firebaseError.code === 'permission-denied') {
            errorMessage = `Firestore Permission Denied: Failed to fetch questions for user ${userId}. This indicates 'request.auth' was likely null or did not match in Firestore rules. Details: ${firebaseError.message}`;
        } else if (firebaseError.code) {
            errorMessage = `Firestore Error (${firebaseError.code}): ${firebaseError.message}`;
        } else {
            errorMessage = `Failed to fetch questions from bank: ${error.message}`;
        }
    }
    throw new Error(errorMessage);
  }
}

export async function removeQuestionFromBankAction(questionDocId: string, userId: string): Promise<{success: boolean, message: string}> {
  // The userId parameter is added here for consistency and potential future use,
  // but primary validation relies on Firestore rules checking request.auth.uid against resource.data.userId.
  const serverAuthInstance = auth; 
  const serverCurrentUser = serverAuthInstance.currentUser; 
  console.log(`[Server Action - removeQuestionFromBankAction] Server-side client SDK auth.currentUser: ${serverCurrentUser ? serverCurrentUser.uid : 'null (expected in server actions)'}`);
  console.log(`[Server Action - removeQuestionFromBankAction] Attempting to remove docId: ${questionDocId} (associated with client-passed userId: ${userId})`);

  if(!questionDocId || !userId) {
    throw new Error("Question document ID or User ID not provided for removal.");
  }

  try {
    // Firestore rules are the primary guard here, ensuring request.auth.uid matches resource.data.userId
    await deleteDoc(doc(db, "questions", questionDocId));
    return {
      success: true,
      message: "Question successfully removed from the bank.",
    };
  } catch (error) {
    console.error("[Server Action - removeQuestionFromBankAction] Error removing question from Firestore:", error);
    let errorMessage = "Failed to remove question from bank. Check server logs.";
    if (error instanceof Error) {
        const firebaseError = error as any; 
        if (firebaseError.code === 'permission-denied') {
            errorMessage = `Firestore Permission Denied: Failed to remove question ${questionDocId}. This indicates 'request.auth' was likely null or did not match in Firestore rules for user ${userId}. Details: ${firebaseError.message}`;
        } else if (firebaseError.code) {
            errorMessage = `Firestore Error (${firebaseError.code}): ${firebaseError.message}`;
        } else {
            errorMessage = `Failed to remove question from bank: ${error.message}`;
        }
    }
    throw new Error(errorMessage);
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
    
 
    