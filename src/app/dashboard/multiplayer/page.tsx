import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Gamepad2, PlusCircle, Swords } from "lucide-react";
import Link from "next/link";

export default function MultiplayerPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Multiplayer Quizzes</h1>
        <p className="text-muted-foreground">Challenge your friends or compete with other learners in real-time!</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <PlusCircle className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Create a Game</CardTitle>
            </div>
            <CardDescription>Start a new multiplayer quiz room and invite others to join.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Choose a subject, topic, and number of questions for your game.</p>
            <Button className="w-full" disabled>
              <Gamepad2 className="mr-2 h-5 w-5" /> Create Game (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
               <Swords className="h-8 w-8 text-accent" />
              <CardTitle className="text-2xl">Join a Game</CardTitle>
            </div>
            <CardDescription>Enter a game code or browse available public games to join.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Placeholder for game list or code input */}
            <div className="text-center p-6 border border-dashed rounded-md">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No public games available right now.</p>
              <p className="text-xs text-muted-foreground">This feature is under development.</p>
            </div>
             <Button variant="outline" className="w-full" disabled>
              Browse Games (Coming Soon)
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-8 shadow-lg">
        <CardHeader>
          <CardTitle>How Multiplayer Works</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2">
          <p>• Compete in real-time against other players.</p>
          <p>• Questions are synchronized for all participants.</p>
          <p>• See live scores and rankings as the quiz progresses.</p>
          <p>• Earn bonus points for speed and accuracy!</p>
          <p className="pt-2 font-semibold text-foreground">Stay tuned for this exciting feature!</p>
        </CardContent>
      </Card>
    </div>
  );
}
