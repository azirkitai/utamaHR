import { createContext, ReactNode, useContext, useEffect, useRef, useCallback } from "react";
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
  
  // Auto-logout constants
  const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  const WARNING_TIME = 2 * 60 * 1000; // 2 minutes warning
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  
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

  // Auto-logout functionality
  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Reset warning flag
    warningShownRef.current = false;

    // Only set timer if user is logged in
    if (!user) return;
    
    // Set warning timer (8 minutes - show warning 2 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true;
        toast({
          title: "Session Timeout Warning",
          description: "You will be automatically logged out in 2 minutes due to inactivity. Move your mouse or click anywhere to stay logged in.",
          variant: "destructive",
          duration: 10000, // Show for 10 seconds
        });
      }
    }, IDLE_TIMEOUT - WARNING_TIME);

    // Set logout timer (10 minutes)
    timeoutRef.current = setTimeout(() => {
      toast({
        title: "Session Expired", 
        description: "You have been automatically logged out due to inactivity.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Perform logout after a short delay to show the toast
      setTimeout(() => {
        logoutMutation.mutate();
      }, 1000);
    }, IDLE_TIMEOUT);
  }, [user, logoutMutation, toast, IDLE_TIMEOUT, WARNING_TIME]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Initialize idle timeout functionality
  useEffect(() => {
    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the timer when component mounts and user is logged in
    if (user) {
      resetTimer();
    }

    // Cleanup function
    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [user, handleActivity, resetTimer]);

  // Reset timer when user changes (login/logout)
  useEffect(() => {
    if (user) {
      resetTimer();
    } else {
      // Clear timers when user logs out
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
  }, [user, resetTimer]);

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
