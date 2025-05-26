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
import type { CustomQuizFormParams, CustomQuizGenOutput } from "@/lib/types";
import { generateCustomQuizAction } from "@/app/actions/quizActions";
import { Wand2 } from "lucide-react";
import React from "react";

const formSchema = z.object({
  syllabus: z.string().min(10, { message: "Syllabus must be at least 10 characters." }).max(500),
  subject: z.string().min(3, { message: "Subject must be at least 3 characters." }).max(100),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters." }).max(100),
  numQuestions: z.coerce.number().int().min(1).max(20),
});

interface CustomQuizFormProps {
  onQuizGenerated: (quizData: CustomQuizGenOutput) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export function CustomQuizForm({ onQuizGenerated, setIsLoading }: CustomQuizFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      syllabus: "",
      subject: "",
      topic: "",
      numQuestions: 5,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await generateCustomQuizAction(values);
      onQuizGenerated(result);
      toast({
        title: "Quiz Generated!",
        description: "Your custom quiz is ready.",
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="syllabus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Syllabus</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., High School Chemistry, focusing on atomic structure and bonding." {...field} />
              </FormControl>
              <FormDescription>
                Provide a brief overview of the syllabus or learning objectives.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Chemistry" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topic</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ionic Bonds" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numQuestions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Questions</FormLabel>
              <FormControl>
                <Input type="number" min="1" max="20" {...field} />
              </FormControl>
              <FormDescription>
                Enter a number between 1 and 20.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generate Quiz
        </Button>
      </form>
    </Form>
  );
}
