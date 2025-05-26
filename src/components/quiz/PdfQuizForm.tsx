"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { PdfQuizFormParams, PdfQuizGenOutput, CustomQuizGenOutput } from "@/lib/types";
import { generateQuizFromPdfAction } from "@/app/actions/quizActions";
import { FileText, UploadCloud } from "lucide-react";
import React, { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  pdfFile: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
  quizDescription: z.string().max(500).optional(),
});

interface PdfQuizFormProps {
  onQuizGenerated: (quizData: CustomQuizGenOutput) => void; // Re-use CustomQuizGenOutput for structured quiz
  setIsLoading: (isLoading: boolean) => void;
}

export function PdfQuizForm({ onQuizGenerated, setIsLoading }: PdfQuizFormProps) {
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quizDescription: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      form.setValue("pdfFile", files); // Update react-hook-form state
    } else {
      setFileName(null);
      form.setValue("pdfFile", new DataTransfer().files); // Reset if no file
    }
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const file = values.pdfFile[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const pdfDataUri = reader.result as string;
      try {
        const result: PdfQuizGenOutput = await generateQuizFromPdfAction({
          pdfDataUri,
          quizDescription: values.quizDescription,
        });
        
        // The AI returns a JSON string, parse it.
        // Ensure robust parsing and type checking.
        let parsedQuiz: CustomQuizGenOutput;
        try {
          parsedQuiz = JSON.parse(result.quiz) as CustomQuizGenOutput;
          // Basic validation of parsed structure
          if (!parsedQuiz || !Array.isArray(parsedQuiz.quiz)) {
            throw new Error("Invalid quiz structure in AI response.");
          }
        } catch (parseError) {
          console.error("Failed to parse quiz from AI response:", parseError);
          toast({
            title: "Error Processing Quiz",
            description: "The AI returned an unexpected quiz format. Please try again or with a different PDF.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        onQuizGenerated(parsedQuiz);
        toast({
          title: "Quiz Generated!",
          description: "Your quiz from the PDF is ready.",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast({
          title: "Error Generating Quiz",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      toast({
        title: "File Reading Error",
        description: "Could not read the PDF file.",
        variant: "destructive",
      });
      setIsLoading(false);
    };
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="pdfFile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>PDF Document</FormLabel>
              <FormControl>
                <div className="relative flex items-center justify-center w-full">
                    <label htmlFor="pdf-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-input bg-card hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF (MAX. 5MB)</p>
                            {fileName && <p className="text-xs text-primary mt-2">{fileName}</p>}
                        </div>
                        <Input 
                          id="pdf-upload" 
                          type="file" 
                          className="hidden" 
                          accept=".pdf"
                          onChange={handleFileChange} // Use custom handler
                        />
                    </label>
                </div>
              </FormControl>
              <FormDescription>
                Upload the PDF document you want to generate a quiz from.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quizDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quiz Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Focus on chapter 3, 10 multiple choice questions about key definitions." {...field} />
              </FormControl>
              <FormDescription>
                Provide any specific instructions for the AI quiz generator.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Quiz from PDF
        </Button>
      </form>
    </Form>
  );
}
