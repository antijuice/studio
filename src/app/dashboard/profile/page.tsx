import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { UserProfile, Badge as BadgeType } from "@/lib/types";
import { Award, BarChart3, Edit3, ShieldCheck, Star, Zap } from "lucide-react";
import Image from "next/image";

// Mock data for badges
const mockBadges: BadgeType[] = [
  { id: "1", name: "Quiz Novice", description: "Completed 1st quiz.", icon: Award, achievedDate: new Date() },
  { id: "2", name: "PDF Pioneer", description: "Generated first quiz from PDF.", icon: ShieldCheck, achievedDate: new Date() },
  { id: "3", name: "ELO Climber", description: "Reached 1200 ELO.", icon: BarChart3, achievedDate: new Date() },
  { id: "4", name: "XP Expert", description: "Earned 5000 XP.", icon: Zap, achievedDate: new Date() },
];

// Mock user data
const mockUser: UserProfile = {
  id: "user123",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  avatarUrl: "https://placehold.co/128x128.png",
  eloRating: 1250,
  experiencePoints: 5800,
  level: 15,
  badges: mockBadges,
  quizHistory: [], // For simplicity, not populating quiz history here
};

// Calculate progress to next level (example logic)
const xpForNextLevel = (level: number) => Math.floor(1000 * Math.pow(1.1, level -1));
const currentLevelXp = xpForNextLevel(mockUser.level);
const nextLevelXp = xpForNextLevel(mockUser.level + 1);
const xpProgress = ((mockUser.experiencePoints - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;


export default function ProfilePage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Card className="w-full shadow-xl">
        <CardHeader className="relative bg-gradient-to-br from-primary via-primary/80 to-accent/60 p-8 rounded-t-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={mockUser.avatarUrl} alt={mockUser.name} data-ai-hint="profile avatar" />
              <AvatarFallback>{mockUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center md:text-left">
              <CardTitle className="text-4xl font-bold text-primary-foreground">{mockUser.name}</CardTitle>
              <CardDescription className="text-lg text-primary-foreground/80">{mockUser.email}</CardDescription>
              <Button variant="outline" size="sm" className="mt-4 text-foreground bg-background/80 hover:bg-background">
                <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="text-accent" /> ELO Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{mockUser.eloRating}</p>
                <p className="text-sm text-muted-foreground">Top 15%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Zap className="text-yellow-400" /> Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{mockUser.experiencePoints.toLocaleString()} XP</p>
                <p className="text-sm text-muted-foreground">Level {mockUser.level}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><Star className="text-orange-400" /> Level Progress</CardTitle>
              </CardHeader>
              <CardContent>
                 <Progress value={xpProgress} className="h-3 my-2" />
                 <p className="text-sm text-muted-foreground text-center">{Math.floor(xpProgress)}% to Level {mockUser.level + 1}</p>
                 <p className="text-xs text-muted-foreground text-center">({mockUser.experiencePoints - currentLevelXp} / {nextLevelXp - currentLevelXp} XP)</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Badges Earned</h2>
            {mockUser.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mockUser.badges.map((badge) => (
                  <Card key={badge.id} className="flex flex-col items-center p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                    <badge.icon className="w-12 h-12 text-accent mb-2" />
                    <h3 className="font-semibold text-sm">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {badge.achievedDate.toLocaleDateString()}
                    </Badge>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No badges earned yet. Keep quizzing!</p>
            )}
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Quiz History</h2>
             <Card className="shadow-md">
                <CardContent className="p-6">
                    <p className="text-muted-foreground">No quiz history available yet. Complete some quizzes to see your stats!</p>
                    {/* Future: List of past quizzes with scores */}
                </CardContent>
            </Card>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
