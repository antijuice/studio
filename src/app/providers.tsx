
"use client";

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
// Import any other context providers here, e.g., from TanStack Query
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // Example with QueryClientProvider:
  // return (
  //   <QueryClientProvider client={queryClient}>
  //     <AuthProvider>{children}</AuthProvider>
  //   </QueryClientProvider>
  // );

  return <AuthProvider>{children}</AuthProvider>;
}
