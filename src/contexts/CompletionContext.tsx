import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define the API base URL - will use the same one as the auth function for now
const API_BASE_URL = 'https://github-auth-function-20556.azurewebsites.net/api';

interface CompletionData {
  sections: Record<string, {
    items: Record<string, boolean>;
  }>;
  lastUpdatedAt: string;
}

interface CompletionContextType {
  saveCompletion: (taskIdentifier: string, completionData: CompletionData) => Promise<void>;
  getCompletions: () => Promise<Array<{taskIdentifier: string, completionData: CompletionData}>>;
  deleteCompletion: (taskIdentifier: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const CompletionContext = createContext<CompletionContextType | undefined>(undefined);

export const CompletionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clearError = () => {
    setError(null);
  };

  // Function to save a completion
  const saveCompletion = async (taskIdentifier: string, completionData: CompletionData) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to save completions');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        },
        body: JSON.stringify({ taskIdentifier, completionData })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save completion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to get all completions for the user
  const getCompletions = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view completions');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/completions?githubUserId=${encodeURIComponent(user.login)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch completions');
      }
      
      const completions = await response.json();
      return completions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to delete a completion
  const deleteCompletion = async (taskIdentifier: string) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to delete completions');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/completion?githubUserId=${encodeURIComponent(user.login)}&taskIdentifier=${encodeURIComponent(taskIdentifier)}`, 
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-github-user-id': user.login
          }
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete completion');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <CompletionContext.Provider value={{
      saveCompletion,
      getCompletions,
      deleteCompletion,
      isLoading,
      error,
      clearError
    }}>
      {children}
    </CompletionContext.Provider>
  );
};

export const useCompletion = () => {
  const context = useContext(CompletionContext);
  if (context === undefined) {
    throw new Error('useCompletion must be used within a CompletionProvider');
  }
  return context;
}; 