import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define the API base URL
const API_BASE_URL = 'https://checklist-api.codein.ca/api';

interface ChecklistContent {
  sections: Record<string, {
    items: Record<string, boolean>;
  }>;
  lastUpdatedAt: string;
}

interface ChecklistContextType {
  saveChecklist: (checklistName: string, content: ChecklistContent) => Promise<void>;
  getChecklists: () => Promise<Array<{checklistName: string, content: ChecklistContent, lastUpdatedAt: string}>>;
  getChecklistIds: () => Promise<string[]>;
  getChecklist: (checklistName: string) => Promise<{checklistName: string, content: ChecklistContent, lastUpdatedAt: string} | null>;
  deleteChecklist: (checklistName: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

export const ChecklistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clearError = () => {
    setError(null);
  };

  // Function to save a checklist
  const saveChecklist = async (checklistName: string, content: ChecklistContent) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to save checklists');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        },
        body: JSON.stringify({ checklistName, content })
      });
      
      if (!response.ok) {
        // If checklist already exists, update it instead
        if (response.status === 409) {
          return updateChecklist(checklistName, content);
        }
        
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save checklist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to update an existing checklist
  const updateChecklist = async (checklistName: string, content: ChecklistContent) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to update checklists');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/checklist`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        },
        body: JSON.stringify({ checklistName, content })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to update checklist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    }
  };
  
  // Function to get all checklist IDs for the user
  const getChecklistIds = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view checklists');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/checklists`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch checklist IDs');
      }
      
      const data = await response.json();
      return data.checklistIds || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to get a specific checklist by name
  const getChecklist = async (checklistName: string) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view checklists');
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/checklist/${encodeURIComponent(checklistName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to fetch checklist');
      }
      
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to get all checklists for the user
  const getChecklists = async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view checklists');
      return [];
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First get all checklist IDs
      const checklistIds = await getChecklistIds();
      
      // Then fetch each checklist individually
      const checklists = [];
      for (const id of checklistIds) {
        const checklist = await getChecklist(id);
        if (checklist) {
          checklists.push({
            checklistName: checklist.checklistName,
            content: checklist.content,
            lastUpdatedAt: checklist.lastUpdatedAt
          });
        }
      }
      
      return checklists;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to delete a checklist
  const deleteChecklist = async (checklistName: string) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to delete checklists');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/checklist?userId=${encodeURIComponent(user.login)}&checklistName=${encodeURIComponent(checklistName)}`, 
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
        throw new Error(errorData?.error || 'Failed to delete checklist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ChecklistContext.Provider value={{
      saveChecklist,
      getChecklists,
      getChecklistIds,
      getChecklist,
      deleteChecklist,
      isLoading,
      error,
      clearError
    }}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = () => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  
  return context;
}; 