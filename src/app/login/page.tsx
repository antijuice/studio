
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, type UserCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Loader2, BotMessageSquare } from "lucide-react";

// Simple inline SVG for Google icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.53-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider);
      // Successful sign-in will trigger onAuthStateChanged in AuthContext
      // and the useEffect above will handle redirection.
      console.log("Signed in user:", result.user.displayName);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      // You might want to show a toast notification to the user here
    }
  };

  if (loading || (!loading && user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-8">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <BotMessageSquare className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Welcome to QuelprQuiz</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            Sign in to continue to your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={handleGoogleSignIn} variant="outline" size="lg" className="w-full">
            <GoogleIcon />
            <span className="ml-2">Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>
       <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} QuelprQuiz. All rights reserved.</p>
      </footer>
    </div>
  );
}
