import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ChecklistSection, ChecklistItem } from '../types';
import { sections as initialSections } from '../utils/data';
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
  // UI related
  sections: ChecklistSection[];
  toggleItem: (sectionId: string, itemId: string) => void;
  getSectionProgress: (sectionId: string) => number;
  getOverallProgress: () => number;
  nextFocusItemId: string | null;
  setNextFocusItemId: (itemId: string | null) => void;
  completedSectionIdToAdvanceFrom: string | null;
  setCompletedSectionIdToAdvanceFrom: (sectionId: string | null) => void;
  saveCurrentProgress: () => Promise<void>;
  loadChecklists: () => Promise<void>;
  availableChecklists: Array<{checklistName: string, lastUpdatedAt: string}>;
  currentChecklistId: string | undefined;
  setCurrentChecklistId: (id: string) => void;
  clearAllData: (options?: { preserveChecklistId?: boolean }) => void;
  toastMessage: string | null;
  clearToastMessage: () => void;
  prMetadata: {
    prUrl?: string;
    prTitle?: string;
    prNumber?: number;
    repository?: string;
  } | null;

  // API related
  saveChecklist: (checklistName: string, content: ChecklistContent) => Promise<void>;
  getChecklists: () => Promise<Array<{checklistName: string, content: ChecklistContent, lastUpdatedAt: string}>>;
  getChecklistIds: () => Promise<string[]>;
  getChecklist: (checklistName: string) => Promise<{checklistName: string, content: ChecklistContent, lastUpdatedAt: string} | null>;
  deleteChecklist: (checklistName: string) => Promise<void>;
  createChecklist: (newChecklistName: string) => Promise<void>;
  createChecklistFromPR: (prUrl: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

interface ChecklistProviderProps {
  children: ReactNode;
}

export const ChecklistProvider: React.FC<ChecklistProviderProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('microservice-checklist');
    return saved ? JSON.parse(saved) : initialSections;
  });
  const [nextFocusItemId, setNextFocusItemId] = useState<string | null>(null);
  const [completedSectionIdToAdvanceFrom, setCompletedSectionIdToAdvanceFrom] = useState<string | null>(null);
  const [availableChecklists, setAvailableChecklists] = useState<Array<{checklistName: string, lastUpdatedAt: string}>>([]);
  const [currentChecklistId, setCurrentChecklistId] = useState<string>();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [prMetadata, setPrMetadata] = useState<{
    prUrl?: string;
    prTitle?: string;
    prNumber?: number;
    repository?: string;
  } | null>(null);

  const clearError = () => {
    setError(null);
  };
  
  const clearToastMessage = () => {
    setToastMessage(null);
  };

  // Load checklists when authenticated or ID changes
  useEffect(() => {
    if (isAuthenticated) {
      loadChecklists().catch(console.error);
    }
  }, [isAuthenticated, currentChecklistId]);

  // Always save to localStorage as a backup
  useEffect(() => {
    localStorage.setItem('microservice-checklist', JSON.stringify(sections));
  }, [sections]);

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
  const getChecklistIds = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view checklists');
      return [];
    }
    
    // setIsLoading(true);
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
  }, [isAuthenticated, user]);
  
  // Function to get a specific checklist by name
  const getChecklist = useCallback(async (checklistName: string) => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to view checklists');
      return null;
    }
    
    // setIsLoading(true);
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
  }, [isAuthenticated, user]);
  
  // Function to delete a checklist
  const deleteChecklist = async (checklistName: string) => {
    if (!isAuthenticated || !user) {
      console.error('Not authenticated or missing user data:', { isAuthenticated, user });
      setError('You must be logged in to delete checklists');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to delete checklist: ${checklistName} for user: ${user.login}`);
      const apiUrl = `${API_BASE_URL}/checklist?userId=${encodeURIComponent(user.login)}&checklistName=${encodeURIComponent(checklistName)}`;
      console.log('DELETE request URL:', apiUrl);
      
      const response = await fetch(
        apiUrl, 
        { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-github-user-id': user.login
          }
        }
      );
      
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        throw new Error(errorData?.error || 'Failed to delete checklist');
      }
      
      console.log('Checklist deleted successfully');
      
      // Update the available checklists list by removing the deleted checklist
      setAvailableChecklists(prev => prev.filter(cl => cl.checklistName !== checklistName));
      
      // If the deleted checklist was the current one, reset to initial state
      if (currentChecklistId === checklistName) {
        setSections(initialSections);
        setCurrentChecklistId(undefined);
      }
      
      setToastMessage(`Successfully deleted checklist: ${checklistName}`);
      setTimeout(() => clearToastMessage(), 3000);
      
    } catch (err) {
      console.error('Error in deleteChecklist:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new checklist
  const createChecklist = async (newChecklistName: string) => {
    if (!isAuthenticated || !user) {
      const authErrorMsg = 'You must be logged in to create checklists';
      setError(authErrorMsg);
      throw new Error(authErrorMsg);
    }
    if (!newChecklistName.trim()) {
      const nameErrorMsg = 'Checklist name cannot be empty';
      setError(nameErrorMsg);
      throw new Error(nameErrorMsg);
    }

    setIsLoading(true);
    setError(null);
    const trimmedNewName = newChecklistName.trim();

    try {
      const initialContent: ChecklistContent = {
        sections: initialSections.reduce((acc, section) => {
          acc[section.id] = {
            items: section.items.reduce((itemAcc, item) => {
              itemAcc[item.id] = false; // All items start unchecked
              return itemAcc;
            }, {} as Record<string, boolean>)
          };
          return acc;
        }, {} as Record<string, { items: Record<string, boolean> }>),
        lastUpdatedAt: new Date().toISOString()
      };

      // First, save the new checklist to the backend
      await saveChecklist(trimmedNewName, initialContent);

      // Then, set it as the current checklist
      // This will also trigger loadChecklists via useEffect to refresh data
      setCurrentChecklistId(trimmedNewName);
      
      // Manually ensure sections are reset to initial state for the new checklist display
      setSections(initialSections);

      // Add the new checklist to the available checklists list immediately
      setAvailableChecklists(prev => [
        ...prev.filter(cl => cl.checklistName !== trimmedNewName), // Remove if exists
        {
          checklistName: trimmedNewName,
          lastUpdatedAt: new Date().toISOString()
        }
      ]);

      setToastMessage(`Successfully created checklist: ${trimmedNewName}`);
      setTimeout(() => clearToastMessage(), 3000);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create checklist';
      setError(errorMsg);
      // console.error('Error in createChecklist:', err); // Already logged by saveChecklist if it throws
      throw new Error(errorMsg); // Re-throw so App.tsx can also catch if needed
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new checklist from GitHub PR
  const createChecklistFromPR = async (prUrl: string) => {
    if (!isAuthenticated || !user) {
      const authErrorMsg = 'You must be logged in to create checklists';
      setError(authErrorMsg);
      throw new Error(authErrorMsg);
    }
    if (!prUrl.trim()) {
      const urlErrorMsg = 'PR URL cannot be empty';
      setError(urlErrorMsg);
      throw new Error(urlErrorMsg);
    }

    // Validate GitHub PR URL format
    const prUrlPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)$/;
    if (!prUrlPattern.test(prUrl.trim())) {
      const formatErrorMsg = 'Please provide a valid GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)';
      setError(formatErrorMsg);
      throw new Error(formatErrorMsg);
    }

    setIsLoading(true);
    setError(null);
    const trimmedPrUrl = prUrl.trim();

    try {
      const response = await fetch(`${API_BASE_URL}/checklist/from-pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login
        },
        body: JSON.stringify({ prUrl: trimmedPrUrl })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to create checklist from PR');
      }

      const result = await response.json();
      const { checklistName, content } = result;

      // Set it as the current checklist
      setCurrentChecklistId(checklistName);
      
      // Process and apply the PR-generated checklist data
      const loadedSections = [...initialSections];
      
      Object.entries(content.sections).forEach(([sectionId, sectionData]: [string, any]) => {
        const sectionIndex = loadedSections.findIndex(s => s.id === sectionId);
        if (sectionIndex !== -1 && sectionData && typeof sectionData === 'object' && 'items' in sectionData) {
          const sectionItems = sectionData.items as Record<string, boolean>;
          const items = loadedSections[sectionIndex].items.map(item => ({
            ...item,
            checked: sectionItems[item.id] || false
          }));
          
          loadedSections[sectionIndex] = {
            ...loadedSections[sectionIndex],
            items
          };
        }
      });
      
      setSections(loadedSections);

      // Extract PR metadata if available
      if (content.prUrl || content.prTitle || content.prNumber || content.repository) {
        setPrMetadata({
          prUrl: content.prUrl,
          prTitle: content.prTitle,
          prNumber: content.prNumber,
          repository: content.repository
        });
      } else {
        setPrMetadata(null);
      }

      // Add the new checklist to the available checklists list immediately
      setAvailableChecklists(prev => [
        ...prev.filter(cl => cl.checklistName !== checklistName), // Remove if exists
        {
          checklistName: checklistName,
          lastUpdatedAt: new Date().toISOString()
        }
      ]);

      setToastMessage(`Successfully created checklist from PR: ${checklistName}`);
      setTimeout(() => clearToastMessage(), 3000);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create checklist from PR';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Load available checklists from the API
  const loadChecklists = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all checklist IDs
      const checklistIds = await getChecklistIds();
      
      // Format the IDs for the dropdown
      const formattedChecklists = [];
      
      // If we have a specific checklist selected, load its data
      if (!!currentChecklistId && checklistIds.includes(currentChecklistId)) {
        const checklist = await getChecklist(currentChecklistId);
        
        if (checklist) {
          // Process and apply the checklist data
          const loadedSections = [...initialSections];
          
          Object.entries(checklist.content.sections).forEach(([sectionId, sectionData]) => {
            const sectionIndex = loadedSections.findIndex(s => s.id === sectionId);
            if (sectionIndex !== -1 && sectionData && typeof sectionData === 'object' && 'items' in sectionData) {
              const sectionItems = sectionData.items as Record<string, boolean>;
              const items = loadedSections[sectionIndex].items.map(item => ({
                ...item,
                checked: sectionItems[item.id] || false
              }));
              
              loadedSections[sectionIndex] = {
                ...loadedSections[sectionIndex],
                items
              };
            }
          });
          
          setSections(loadedSections);
          
          // Extract PR metadata if available
          const content = checklist.content as any;
          if (content.prUrl || content.prTitle || content.prNumber || content.repository) {
            setPrMetadata({
              prUrl: content.prUrl,
              prTitle: content.prTitle,
              prNumber: content.prNumber,
              repository: content.repository
            });
          } else {
            setPrMetadata(null);
          }
          
          // Add to available checklists
          for (const id of checklistIds) {
            formattedChecklists.push({
              checklistName: id,
              lastUpdatedAt: id === currentChecklistId ? 
                checklist.lastUpdatedAt : 
                new Date().toISOString()
            });
          }
        }
      } else if (checklistIds.length > 0) {
        // If we're on the default checklist but have others available,
        // just list them without loading
        setPrMetadata(null); // Clear PR metadata for default checklist
        for (const id of checklistIds) {
          formattedChecklists.push({
            checklistName: id,
            lastUpdatedAt: new Date().toISOString()
          });
        }
      } else if (checklistIds.length > 0 && !checklistIds.includes(currentChecklistId)) {
        // If our current ID doesn't exist in the checklistIds, load the first one
        const firstChecklistId = checklistIds[0];
        const checklist = await getChecklist(firstChecklistId);
        
        if (checklist) {
          // Convert the stored format back to our sections array
          const loadedSections = [...initialSections];
          
          Object.entries(checklist.content.sections).forEach(([sectionId, sectionData]) => {
            const sectionIndex = loadedSections.findIndex(s => s.id === sectionId);
            if (sectionIndex !== -1 && sectionData && typeof sectionData === 'object' && 'items' in sectionData) {
              const sectionItems = sectionData.items as Record<string, boolean>;
              const items = loadedSections[sectionIndex].items.map(item => ({
                ...item,
                checked: sectionItems[item.id] || false
              }));
              
              loadedSections[sectionIndex] = {
                ...loadedSections[sectionIndex],
                items
              };
            }
          });
          
          setSections(loadedSections);
          setCurrentChecklistId(firstChecklistId);
          
          // Extract PR metadata if available
          const content = checklist.content as any;
          if (content.prUrl || content.prTitle || content.prNumber || content.repository) {
            setPrMetadata({
              prUrl: content.prUrl,
              prTitle: content.prTitle,
              prNumber: content.prNumber,
              repository: content.repository
            });
          } else {
            setPrMetadata(null);
          }
          
          // Add to available checklists
          for (const id of checklistIds) {
            formattedChecklists.push({
              checklistName: id,
              lastUpdatedAt: id === firstChecklistId ? 
                checklist.lastUpdatedAt : 
                new Date().toISOString()
            });
          }
        }
      } else if (!!currentChecklistId && checklistIds.length === 0) {
        // This is a case where we have a currentChecklistId but it doesn't exist on the server yet
        // Reset to initial state for this new checklist
        setSections(initialSections);
        
        // We only create a new checklist entry when an item is modified, not when just selecting a checklist.
        // So we don't call saveCurrentProgress() here anymore
        setPrMetadata(null); // Clear PR metadata for new checklist
        
        // Add to available checklists
        formattedChecklists.push({
          checklistName: currentChecklistId,
          lastUpdatedAt: new Date().toISOString()
        });
      }
      
      setAvailableChecklists(formattedChecklists);
    } catch (err) {
      setError('Failed to load checklists. Using local data.');
      console.error('Error loading checklists:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentChecklistId, getChecklistIds, getChecklist]);

  // Function to save current progress to the backend
  const saveCurrentProgress = async () => {
    if (!isAuthenticated || !user || !currentChecklistId) {
      // console.warn('Save progress skipped: not authenticated, no user, or no currentChecklistId');
      return;
    }

    setIsLoading(true);
    setError(null);

    const contentToSave: ChecklistContent = {
      sections: sections.reduce((acc, section) => {
        acc[section.id] = {
          items: section.items.reduce((itemAcc, item) => {
            itemAcc[item.id] = item.checked;
            return itemAcc;
          }, {} as Record<string, boolean>)
        };
        return acc;
      }, {} as Record<string, { items: Record<string, boolean> }>),
      lastUpdatedAt: new Date().toISOString(),
    };

    try {
      await updateChecklist(currentChecklistId, contentToSave); // Assumes updateChecklist handles PUT correctly
      setToastMessage('Progress saved successfully!');
      // console.log('Progress saved for checklist:', currentChecklistId);
      await loadChecklists(); // Refresh available checklists to show new lastUpdated times
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      setToastMessage('Error saving progress.');
      // console.error('Error saving progress:', err);
    } finally {
      setIsLoading(false);
      setTimeout(clearToastMessage, 3000); 
    }
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    // We need to get the new 'checked' state. 
    // It's tricky because setSections is async.
    // Let's find the current state first, then toggle, then use that for the API.

    const currentSection = sections.find(s => s.id === sectionId);
    const currentItem = currentSection?.items.find(i => i.id === itemId);
    
    if (!currentItem) {
      console.error("Item not found for toggling:", sectionId, itemId);
      setToastMessage("Error: Item not found.");
      setTimeout(clearToastMessage, 3000);
      return;
    }

    const newIsChecked = !currentItem.checked; // This is the state we want to send to the API

    // Optimistic UI update
    setSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: section.items.map(item => {
              if (item.id === itemId) {
                return { ...item, checked: newIsChecked }; // Use newIsChecked
              }
              return item;
            }),
          };
        }
        return section;
      })
    );

    // After optimistic update, call the API immediately to save to the database
    if (isAuthenticated && user && currentChecklistId) {
      console.log(`Saving item status to database: ${itemId} in section ${sectionId} to ${newIsChecked ? 'completed' : 'uncompleted'}`);
      
      // Prepare request body with all required fields
      const requestBody = {
        checklistName: currentChecklistId,
        sectionId,
        itemId,
        isChecked: newIsChecked,
      };
      
      console.log("API request payload:", JSON.stringify(requestBody));
      
      // Execute the API call with proper headers and body
      fetch(`${API_BASE_URL}/checklist/item-status`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'x-github-user-id': user.login,
        },
        body: JSON.stringify(requestBody),
      })
      .then(async response => {
        console.log(`API response status: ${response.status}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to update item status and parse error response.' }));
          throw new Error(errorData.error || `API Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Success: Item status saved to database:', data);
        setToastMessage(data.message || 'Status updated successfully');
        
        // Update the lastUpdatedAt timestamp in the available checklists
        setAvailableChecklists(prev => prev.map(cl => 
            cl.checklistName === currentChecklistId 
            ? { ...cl, lastUpdatedAt: new Date().toISOString() } 
            : cl
        ));
      })
      .catch(err => {
        console.error('Error saving item status to database:', err);
        setError(err instanceof Error ? err.message : 'Error saving to database');
        setToastMessage('Error updating status');
        
        // Revert the optimistic update
        setSections(prevSections =>
          prevSections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                items: section.items.map(item => {
                  if (item.id === itemId) {
                    return { ...item, checked: !newIsChecked }; // Revert to original state
                  }
                  return item;
                }),
              };
            }
            return section;
          })
        );
      })
      .finally(() => {
        setTimeout(clearToastMessage, 3000);
      });
    } else {
      // Not authenticated or no checklist ID
      if (!isAuthenticated || !user) {
        setToastMessage("Login to save changes");
        console.warn("Not saving to database: User not authenticated");
        setTimeout(clearToastMessage, 3000);
      } else if (!currentChecklistId) {
        setToastMessage("Select a checklist to save changes");
        console.warn("Not saving to database: No checklist selected");
        setTimeout(clearToastMessage, 3000);
      }
      // Changes are still saved to localStorage by the useEffect hook.
    }
  };

  const getSectionProgress = (sectionId: string): number => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    const totalItems = section.items.length;
    if (totalItems === 0) return 0;
    
    const checkedItems = section.items.filter(item => item.checked).length;
    return Math.round((checkedItems / totalItems) * 100);
  };

  const getOverallProgress = (): number => {
    const totalItems = sections.reduce((total, section) => total + section.items.length, 0);
    if (totalItems === 0) return 0;
    
    const checkedItems = sections.reduce(
      (total, section) => total + section.items.filter(item => item.checked).length, 
      0
    );
    
    return Math.round((checkedItems / totalItems) * 100);
  };
  
  const clearAllData = (options?: { preserveChecklistId?: boolean }) => {
    setSections(initialSections);
    
    // Only reset the checklist ID if not explicitly asked to preserve it
    if (!options?.preserveChecklistId) {
      setCurrentChecklistId('');
    }
    
    localStorage.removeItem('microservice-checklist');
    setToastMessage('All progress cleared');
    setTimeout(() => clearToastMessage(), 3000);
  };

  return (
    <ChecklistContext.Provider value={{
      // UI related
      sections,
      toggleItem,
      getSectionProgress,
      getOverallProgress,
      nextFocusItemId,
      setNextFocusItemId,
      completedSectionIdToAdvanceFrom,
      setCompletedSectionIdToAdvanceFrom,
      saveCurrentProgress,
      loadChecklists,
      availableChecklists,
      currentChecklistId,
      setCurrentChecklistId,
      clearAllData,
      toastMessage,
      clearToastMessage,
      prMetadata,
      
      // API related
      saveChecklist,
      getChecklists: async () => {
        const checklistIds = await getChecklistIds();
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
      },
      getChecklistIds,
      getChecklist,
      deleteChecklist,
      createChecklist,
      createChecklistFromPR,
      isLoading,
      error,
      clearError
    }}>
      {children}
    </ChecklistContext.Provider>
  );
};

export const useChecklist = (): ChecklistContextType => {
  const context = useContext(ChecklistContext);
  if (context === undefined) {
    throw new Error('useChecklist must be used within a ChecklistProvider');
  }
  return context;
}; 