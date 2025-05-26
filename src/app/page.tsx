import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold text-primary">QuelprQuiz</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Master your exams with AI-powered quizzes and personalized learning.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-foreground/80">
            Generate custom quizzes, compete with peers, track your progress with ELO ranking, and unlock achievements. Ready to elevate your study game?
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} QuelprQuiz. All rights reserved.</p>
        <p>Powered by AI, built for students.</p>
      </footer>
    </div>
  );
}
