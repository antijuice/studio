
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { ExtractQuestionsFromPdfOutput, ExtractQuestionsFromPdfInput } from "@/lib/types";
import { extractQuestionsFromPdfAction } from "@/app/actions/quizActions";
import { Sparkles, UploadCloud, Tags, Loader2, Lightbulb, MessageSquareText } from "lucide-react";
import React, { useState } from "react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for potentially larger PDFs with questions
const ACCEPTED_FILE_TYPES = ["application/pdf"];

const formSchema = z.object({
  pdfFile: z
    .custom<FileList>((val) => val instanceof FileList && val.length > 0, "Please select a PDF file.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      "Only .pdf files are accepted."
    ),
  topicHint: z.string().max(500).optional(),
  globalTags: z.string().max(200).optional().describe("Comma-separated tags to apply to all questions."),
  autoSuggestMcqAnswers: z.boolean().default(false).optional(),
  autoSuggestExplanations: z.boolean().default(false).optional(),
});

interface ExtractQuestionsFormProps {
  onExtractionComplete: (data: ExtractQuestionsFromPdfOutput) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function ExtractQuestionsForm({ onExtractionComplete, setIsLoading }: ExtractQuestionsFormProps) {
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topicHint: "",
      globalTags: "",
      autoSuggestMcqAnswers: true, // Default to true for convenience
      autoSuggestExplanations: true, // Default to true for convenience
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFileName(files[0].name);
      form.setValue("pdfFile", files);
    } else {
      setFileName(null);
      form.setValue("pdfFile", new DataTransfer().files); 
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
        const input: ExtractQuestionsFromPdfInput = {
          pdfDataUri,
          topicHint: values.topicHint,
          globalTags: values.globalTags,
          autoSuggestMcqAnswers: values.autoSuggestMcqAnswers,
          autoSuggestExplanations: values.autoSuggestExplanations,
        };
        const result = await extractQuestionsFromPdfAction(input);

        onExtractionComplete(result);
        toast({
          title: "Extraction Complete!",
          description: `Successfully extracted ${result.extractedQuestions.length} question(s) from the PDF.`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        toast({
          title: "Error Extracting Questions",
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

  const isSubmitting = form.formState.isSubmitting;

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
                    <label htmlFor="pdf-upload-extract" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer border-input bg-card hover:bg-muted/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PDF (MAX. 10MB)</p>
                            {fileName && <p className="text-xs text-primary mt-2">{fileName}</p>}
                        </div>
                        <Input
                          id="pdf-upload-extract"
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={handleFileChange}
                          disabled={isSubmitting}
                        />
                    </label>
                </div>
              </FormControl>
              <FormDescription>
                Upload the PDF document to extract questions from.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topicHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic Hint (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Chapter 5: Photosynthesis, Focus on key definitions and processes" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Provide a hint about the PDF's topic to improve AI tagging and categorization.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="globalTags"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center">
                <Tags className="mr-2 h-4 w-4" /> Global Tags (Optional)
              </FormLabel>
              <FormControl>
                <Input placeholder="e.g., biology, midterm, chapter5" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                Comma-separated tags that will be applied to all questions extracted from this PDF.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-md border p-4 bg-muted/30">
            <FormLabel className="text-base font-semibold">AI Auto-Suggestion Options</FormLabel>
            <FormField
            control={form.control}
            name="autoSuggestMcqAnswers"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                    <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    id="autoSuggestMcqAnswers"
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <Label htmlFor="autoSuggestMcqAnswers" className="flex items-center cursor-pointer">
                        <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                        Automatically suggest answers for MCQs if missing
                    </Label>
                    <FormDescription>
                        If an MCQ is extracted without a clear answer, the AI will try to pick one from the options.
                    </FormDescription>
                </div>
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="autoSuggestExplanations"
            render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                <FormControl>
                    <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    id="autoSuggestExplanations"
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <Label htmlFor="autoSuggestExplanations" className="flex items-center cursor-pointer">
                       <MessageSquareText className="mr-2 h-4 w-4 text-blue-500" />
                        Automatically suggest explanations if missing
                    </Label>
                    <FormDescription>
                        If a question is extracted without an explanation, the AI will try to generate one.
                    </FormDescription>
                </div>
                </FormItem>
            )}
            />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting || !fileName}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Extracting..." : "Extract Questions"}
        </Button>
      </form>
    </Form>
  );
}
