
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, ListChecks, PieChart, Search } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import React from "react"; // Import React for useState if needed in future

// Mock data for past sessions
const mockSessions = [
  { id: "1", title: "Atomic Structure Basics", subject: "Chemistry", score: 85, date: "2024-07-15", type: "mcq" },
  { id: "2", "title": "Calculus Fundamentals Check", subject: "Mathematics", score: 92, date: "2024-07-12", type: "mcq" },
  { id: "3", "title": "World War II Overview", subject: "History", score: 78, date: "2024-07-10", type: "short-answer" },
  { id: "4", "title": "Cell Biology Quiz (from PDF)", subject: "Biology", score: 60, date: "2024-07-08", type: "pdf-generated" },
];


export default function PastSessionsPage() {
  const [searchTerm, setSearchTerm] = React.useState(""); // Example client-side state

  const filteredSessions = mockSessions.filter(session => 
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <CardTitle className="text-xl mb-1">{session.title}</CardTitle>
                  <Badge variant={session.score >= 80 ? "default" : session.score >=60 ? "secondary" : "destructive"} className="whitespace-nowrap">
                    {session.score}%
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {session.subject} - {new Date(session.date).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-xs text-muted-foreground gap-1 mb-4">
                  {session.type === 'mcq' && <ListChecks className="h-3 w-3" />}
                  {session.type === 'short-answer' && <History className="h-3 w-3" />}
                  {session.type === 'pdf-generated' && <PieChart className="h-3 w-3" />}
                  <span>{session.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Quiz</span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">
                  {/* Placeholder for more details like number of questions, time taken */}
                  Completed with a score of {session.score}%.
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
              No sessions match your search, or you haven't completed any quizzes yet.
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
