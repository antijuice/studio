
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ListChecks, PieChart, Search, BarChart, FileText, Wand2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { useQuizSession } from "@/contexts/QuizSessionContext";
import type { QuizSession } from "@/lib/types";

const QuizTypeIcon = ({ type }: { type: QuizSession['type'] }) => {
  if (type === 'mcq') return <ListChecks className="h-4 w-4" />;
  if (type === 'short-answer') return <BarChart className="h-4 w-4" />; // Changed for variety
  if (type === 'pdf-generated') return <FileText className="h-4 w-4" />;
  if (type === 'custom') return <Wand2 className="h-4 w-4" />;
  return <PieChart className="h-4 w-4" />; // Default
};

const getQuizTypeLabel = (type: QuizSession['type']) => {
  if (!type) return "Quiz";
  return type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function PastSessionsPage() {
  const { getQuizSessions } = useQuizSession();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setSessions(getQuizSessions());
  }, [getQuizSessions]);

  const filteredSessions = sessions.filter(session => 
    session.quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.subject && session.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (session.topic && session.topic.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a,b) => b.completedAt.getTime() - a.completedAt.getTime()); // Sort by most recent

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Past Quiz Sessions</h1>
          <p className="text-muted-foreground">Review your performance and learn from previous quizzes.</p>
        </div>
        <div className="relative w-full md:w-auto">
            <Input 
              placeholder="Search sessions by title or subject..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </header>

      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="shadow-lg hover:shadow-xl transition-shadow flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl mb-1">{session.quizTitle}</CardTitle>
                  <Badge variant={session.score >= 80 ? "default" : session.score >=60 ? "secondary" : "destructive"} className="whitespace-nowrap">
                    {session.score}%
                  </Badge>
                </div>
                <CardDescription className="text-sm space-y-1">
                  {session.subject && <span>Subject: {session.subject} <br/></span>}
                  {session.topic && <span>Topic: {session.topic} <br/></span>}
                  <span>Completed: {new Date(session.completedAt).toLocaleDateString()}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-xs text-muted-foreground gap-1 mb-4">
                  <QuizTypeIcon type={session.type} />
                  <span>{getQuizTypeLabel(session.type)}</span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">
                  Review your {session.answers.length} answers. Score: {session.score}%.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/quizzes/sessions/${session.id}`}>Review Session</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Past Sessions Found</h2>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No sessions match your search." : "You haven't completed any quizzes yet."}
            </p>
            <Button asChild>
              <Link href="/dashboard/quizzes/custom">Start a New Quiz</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
