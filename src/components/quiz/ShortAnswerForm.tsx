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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { ShortAnswerFormParams, ShortAnswerEvaluationOutput } from "@/lib/types";
import { evaluateShortAnswerAction } from "@/app/actions/quizActions";
import { CheckCircle, MessageSquareDashed } from "lucide-react";
import React from "react";

const formSchema = z.object({
  question: z.string().min(10, { message: "Question must be at least 10 characters." }).max(1000),
  userAnswer: z.string().min(5, { message: "Your answer must be at least 5 characters." }).max(2000),
  modelAnswer: z.string().max(2000).optional(),
});

interface ShortAnswerFormProps {
  onEvaluationComplete: (evaluation: ShortAnswerEvaluationOutput) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function ShortAnswerForm({ onEvaluationComplete, setIsLoading }: ShortAnswerFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
      userAnswer: "",
      modelAnswer: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await evaluateShortAnswerAction(values);
      onEvaluationComplete(result);
      toast({
        title: "Evaluation Complete!",
        description: "Your answer has been evaluated by the AI.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error Evaluating Answer",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the short answer question here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userAnswer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Answer</FormLabel>
              <FormControl>
                <Textarea placeholder="Type your answer to the question..." {...field} rows={5}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="modelAnswer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model Answer / Mark Scheme (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="If available, provide the model answer or marking criteria..." {...field} rows={3}/>
              </FormControl>
              <FormDescription>
                Providing a model answer helps the AI give more accurate feedback.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          <MessageSquareDashed className="mr-2 h-4 w-4" />
          Evaluate My Answer
        </Button>
      </form>
    </Form>
  );
}
