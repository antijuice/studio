import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, ArrowUp, ArrowDown, Minus } from "lucide-react";

// Mock leaderboard data
const mockLeaderboard = [
  { rank: 1, name: "Champion Cody", elo: 1580, trend: "up", avatar: "https://placehold.co/40x40.png?text=CC" , gamesPlayed: 120},
  { rank: 2, name: "Prodigy Pat", elo: 1550, trend: "up", avatar: "https://placehold.co/40x40.png?text=PP", gamesPlayed: 95 },
  { rank: 3, name: "Master Morgan", elo: 1525, trend: "down", avatar: "https://placehold.co/40x40.png?text=MM", gamesPlayed: 150 },
  { rank: 4, name: "Ace Alex", elo: 1490, trend: "stable", avatar: "https://placehold.co/40x40.png?text=AA", gamesPlayed: 88 },
  { rank: 5, name: "Guru Gabby", elo: 1470, trend: "up", avatar: "https://placehold.co/40x40.png?text=GG", gamesPlayed: 110 },
  { rank: 6, name: "Skilled Sam", elo: 1450, trend: "down", avatar: "https://placehold.co/40x40.png?text=SS", gamesPlayed: 70 },
  { rank: 7, name: "User123 (You)", elo: 1250, trend: "up", avatar: "https://placehold.co/40x40.png?text=U", isCurrentUser: true, gamesPlayed: 42 },
  { rank: 8, name: "Learner Lee", elo: 1230, trend: "stable", avatar: "https://placehold.co/40x40.png?text=LL", gamesPlayed: 55 },
];

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <ArrowUp className="h-4 w-4 text-green-500" />;
  if (trend === "down") return <ArrowDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export default function LeaderboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-muted-foreground">See how you rank against other QuelprQuiz masters based on ELO rating.</p>
        </div>
         {/* Placeholder for filters like "Global", "Friends", "Weekly" */}
      </header>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
          <CardDescription>Updated in real-time. Keep quizzing to climb the ranks!</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead className="text-right">ELO Rating</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Trend</TableHead>
                <TableHead className="text-right hidden md:table-cell">Games Played</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeaderboard.map((player) => (
                <TableRow key={player.rank} className={player.isCurrentUser ? "bg-primary/10" : ""}>
                  <TableCell className="font-medium text-center">
                    {player.rank === 1 && <Trophy className="h-5 w-5 text-yellow-400 inline-block" />}
                    {player.rank === 2 && <Trophy className="h-5 w-5 text-slate-400 inline-block" />}
                    {player.rank === 3 && <Trophy className="h-5 w-5 text-orange-400 inline-block" />}
                    {player.rank > 3 && player.rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={player.avatar} alt={player.name} data-ai-hint="leaderboard avatar" />
                        <AvatarFallback>{player.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{player.name}</p>
                        {player.isCurrentUser && <Badge variant="outline">You</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{player.elo}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <TrendIcon trend={player.trend} />
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">{player.gamesPlayed}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Understanding ELO</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-1">
            <p>ELO is a rating system that measures your skill level relative to other players.</p>
            <p>Winning quizzes against higher-rated content or players increases your ELO more significantly.</p>
            <p>Losing to lower-rated content or players decreases it more.</p>
            <p>Consistent play and strong performance are key to climbing the leaderboard!</p>
        </CardContent>
      </Card>
    </div>
  );
}
