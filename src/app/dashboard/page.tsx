import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, CheckCircle, Clock, FileText, Users, Wand2, Zap } from "lucide-react";
import Link from "next/link";

const stats = [
  { title: "ELO Rating", value: "1250", icon: BarChart, progress: 75, color: "text-accent" },
  { title: "Experience Points", value: "5,800 XP", icon: Zap, progress: 60, color: "text-yellow-400" },
  { title: "Quizzes Completed", value: "42", icon: CheckCircle, progress: 85, color: "text-green-500" },
  { title: "Total Study Time", value: "120h 30m", icon: Clock, progress: 50, color: "text-blue-500" },
];

const quickLinks = [
  { href: "/dashboard/quizzes/custom", label: "Create Custom Quiz", icon: Wand2, description: "Generate a quiz tailored to your needs." },
  { href: "/dashboard/quizzes/pdf-generator", label: "Quiz from PDF", icon: FileText, description: "Upload a PDF and create a quiz from it." },
  { href: "/dashboard/multiplayer", label: "Join Multiplayer", icon: Users, description: "Challenge friends or other users." },
];

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, User!</h1>
        <p className="text-muted-foreground">Here's your learning snapshot and quick actions.</p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Progress value={stat.progress} className="mt-2 h-2" indicatorClassName={stat.color.replace('text-','bg-')} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.label} className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <link.icon className="h-8 w-8 text-primary" />
                  <CardTitle className="text-lg">{link.label}</CardTitle>
                </div>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link href={link.href}>Go to {link.label.split(' ')[0]}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* Placeholder for Recent Activity or Upcoming Quizzes */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Recent Activity</h2>
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <p className="text-muted-foreground">No recent activity to display. Start a quiz to see your progress here!</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
