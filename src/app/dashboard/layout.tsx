
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
  LogOut, // Added LogOut icon
  Loader2
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  {
    label: 'My Quizzes',
    icon: Library,
    isGroup: true,
    subItems: [
      { href: '/dashboard/quizzes/custom', label: 'Create Custom Quiz', icon: Wand2 },
      { href: '/dashboard/quizzes/pdf-generator', label: 'Quiz from PDF', icon: FileText },
      { href: '/dashboard/quizzes/short-answer', label: 'Short Answer Practice', icon: MessageSquareText },
      { href: '/dashboard/quizzes/sessions', label: 'Past Sessions', icon: History },
    ],
  },
  { href: '/dashboard/multiplayer', label: 'Multiplayer', icon: Users },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

// Updated bottomNavItems to include Sign Out functionality via AuthContext
const bottomNavItems = (handleSignOut: () => void) => [
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  // { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { isButton: true, label: 'Sign Out', icon: LogOut, action: handleSignOut }, // Sign Out button
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
    <SidebarProvider defaultOpen>
      <SidebarDecorated>
        <SidebarInset>{children}</SidebarInset>
      </SidebarDecorated>
    </SidebarProvider>
  );
}

function SidebarDecorated({ children }: { children: React.ReactNode }) {
  const { open, toggleSidebar } = useSidebar()
  const pathname = usePathname();
  const { user, signOut } = useAuth(); // Get user and signOut from AuthContext

  const handleSignOut = async () => {
    await signOut();
    // Router push to /login is handled within signOut itself
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
             <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                <SidebarTrigger />
             </Button>
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
            {bottomNavItems(handleSignOut).map((item: any) => ( // Added type any for item
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
