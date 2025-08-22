import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, LoginData, insertUserSchema } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthResponse = {
  user: { id: string; username: string };
  token: string;
  message: string;
};

type AuthContextType = {
  user: { id: string; username: string; role?: string } | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<AuthResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<AuthResponse, Error, LoginData>;
};

// Token management
const TOKEN_KEY = "utamahr_token";

const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

const removeStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Custom fetch function that includes JWT token
  const authenticatedFetch = async (url: string): Promise<any> => {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Token not found");
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        removeStoredToken();
        queryClient.setQueryData(["/api/user"], null);
        throw new Error("Token is invalid");
      }
      throw new Error("Request failed");
    }

    return response.json();
  };

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<{ id: string; username: string; role?: string } | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: () => authenticatedFetch("/api/user"),
    enabled: !!getStoredToken(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Login failed");
      }

      return res.json();
    },
    onSuccess: (response: AuthResponse) => {
      setStoredToken(response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Success!",
        description: response.message || "Login successful",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<AuthResponse> => {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Registration failed");
      }

      return res.json();
    },
    onSuccess: (response: AuthResponse) => {
      setStoredToken(response.token);
      queryClient.setQueryData(["/api/user"], response.user);
      toast({
        title: "Success!",
        description: response.message || "Account successfully created",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Optional: call logout endpoint to blacklist token on server
      const token = getStoredToken();
      if (token) {
        try {
          await fetch("/api/logout", {
            method: "POST",
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        } catch (e) {
          // Ignore logout API errors since we're clearing local storage anyway
        }
      }
    },
    onSuccess: () => {
      removeStoredToken();
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear();
      toast({
        title: "Logout Successful",
        description: "You have been logged out",
        variant: "default",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: isLoading && !!getStoredToken(),
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
