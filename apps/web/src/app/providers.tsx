import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/shared/lib/query-client";
import { Toaster } from "@/shared/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster />
      {/* Compiled out of production builds. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
