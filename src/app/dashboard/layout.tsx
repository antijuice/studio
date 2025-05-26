
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpenText,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  ShieldQuestion,
  Trophy,
  Users,
  UserCircle,
  Wand2,
  BotMessageSquare,
  History,
  Library,
  LogOut,
  Loader2,
  Sparkles, 
  LibraryBig, 
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
  SidebarTitle,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { QuestionBankProvider } from '@/contexts/QuestionBankContext';
import { QuizAssemblyProvider } from '@/contexts/QuizAssemblyContext'; // Added import

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  {
    label: 'My Quizzes',
    icon: Library,
    isGroup: true,
    subItems: [
      { href: '/dashboard/quizzes/custom', label: 'Create Custom Quiz', icon: Wand2 },
      { href: '/dashboard/quizzes/pdf-generator', label: 'Quiz from PDF', icon: FileText },
      { href: '/dashboard/quizzes/extract-pdf', label: 'Extract Questions', icon: Sparkles },
      { href: '/dashboard/quizzes/short-answer', label: 'Short Answer Practice', icon: MessageSquareText },
      { href: '/dashboard/quizzes/sessions', label: 'Past Sessions', icon: History },
    ],
  },
  { href: '/dashboard/question-bank', label: 'Question Bank', icon: LibraryBig },
  { href: '/dashboard/multiplayer', label: 'Multiplayer', icon: Users },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

const bottomNavItems = (handleSignOut: () => void) => [
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  { isButton: true, label: 'Sign Out', icon: LogOut, action: handleSignOut },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <QuestionBankProvider>
      <QuizAssemblyProvider> {/* Added Provider */}
        <SidebarProvider defaultOpen>
          <SidebarDecorated>
            <SidebarInset className="overflow-x-hidden">{children}</SidebarInset>
          </SidebarDecorated>
        </SidebarProvider>
      </QuizAssemblyProvider>
    </QuestionBankProvider>
  );
}

function SidebarDecorated({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar(); 
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Mobile-only top bar */}
      <div className="md:hidden p-2 border-b border-border bg-background sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <SidebarTrigger className="h-9 w-9" /> 
           <BotMessageSquare className="w-7 h-7 text-primary" />
           <h1 className="text-lg font-semibold text-primary">QuelprQuiz</h1>
        </div>
        <Link href="/dashboard/profile">
            <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarImage src={user?.photoURL || "https://placehold.co/40x40.png"} alt="User Avatar" data-ai-hint="user avatar" />
                <AvatarFallback>
                  {user?.displayName ? user.displayName.substring(0, 1).toUpperCase() : user?.email ? user.email.substring(0,1).toUpperCase() : 'U'}
                </AvatarFallback>
            </Avatar>
        </Link>
      </div>

      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <BotMessageSquare className="w-8 h-8 text-primary" />
            <h1 className={`text-xl font-semibold text-primary transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 md:opacity-0 group-data-[collapsible=icon]:hidden'}`}>
              QuelprQuiz
            </h1>
          </div>
        </SidebarHeader>
        <Separator className="mb-2 bg-sidebar-border" />
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) =>
              item.isGroup ? (
                <SidebarGroup key={item.label}>
                  <SidebarGroupLabel className="flex items-center gap-2">
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </SidebarGroupLabel>
                  {item.subItems?.map((subItem) => (
                    <SidebarMenuItem key={subItem.href}>
                      <Link href={subItem.href} legacyBehavior passHref>
                        <SidebarMenuButton
                          isActive={pathname === subItem.href}
                          className="justify-start"
                          tooltip={subItem.label}
                        >
                          <subItem.icon className="h-5 w-5" />
                          <span>{subItem.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroup>
              ) : (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href!} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className="justify-start"
                      tooltip={item.label}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarContent>
        <Separator className="my-2 bg-sidebar-border" />
        <SidebarFooter>
          <SidebarMenu>
            {bottomNavItems(handleSignOut).map((item: any) => (
              <SidebarMenuItem key={item.label}>
                {item.isButton ? (
                  <SidebarMenuButton
                    onClick={item.action}
                    className="justify-start"
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                ) : (
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={pathname === item.href}
                      className="justify-start"
                      tooltip={item.label}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="p-4 flex items-center gap-3 border-t border-sidebar-border mt-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || "https://placehold.co/40x40.png"} alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>
                {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : user?.email ? user.email.substring(0,2).toUpperCase() : 'UQ'}
              </AvatarFallback>
            </Avatar>
            <div className={`transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 md:opacity-0 group-data-[collapsible=icon]:hidden'}`}>
              <p className="text-sm font-medium truncate">{user?.displayName || "Quelpr User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      
      {children} 
    </>
  );
}
