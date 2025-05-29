import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "./api-utils";

// Re-export apiRequest from api-utils for easy access
export { apiRequest } from "./api-utils";

type QueryFnOptions = {
  on401?: "throw" | "returnNull" | "redirect";
};

const defaultQueryFnOptions: QueryFnOptions = {
  on401: "throw",
};

export function getQueryFn<T>(options: QueryFnOptions = {}) {
  const opts = { ...defaultQueryFnOptions, ...options };

  return async function queryFn({ queryKey }: { queryKey: string[] }): Promise<T | undefined> {
    const [endpoint] = queryKey;
    
    try {
      // Import apiRequest from api-utils directly here to avoid circular dependencies
      const { apiRequest } = await import('./api-utils');
      return await apiRequest<T>("GET", endpoint);
    } catch (error) {
      // Special handling for 401 Unauthorized
      if (error instanceof ApiError && error.status === 401) {
        switch (opts.on401) {
          case "returnNull":
            return undefined;
          case "redirect":
            window.location.href = "/auth";
            return undefined;
          case "throw":
          default:
            throw error;
        }
      }
      
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
      queryFn: getQueryFn(),
    },
    mutations: {
      onError: (error) => {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
    },
  },
});