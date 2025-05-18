import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // API related
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
    } catch (err) {
      console.error('Error in deleteChecklist:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load available checklists from the API
  const loadChecklists = async () => {
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
        // Create an empty checklist when selecting a new ID that doesn't exist yet
        setSections(initialSections);
        
        // Create the new empty checklist in the backend
        await saveCurrentProgress();
        
        setToastMessage(`Created new checklist: ${currentChecklistId}`);
        
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
  };

  // Save current progress to the API
  const saveCurrentProgress = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Console log to debug checklist ID issues
      console.log('Saving checklist with ID:', currentChecklistId);
      
      // Check if we have a valid checklist ID to save with
      if (!currentChecklistId) {
        setError('Cannot save: No checklist ID specified');
        console.error('Cannot save: No checklist ID specified');
        return;
      }
      
      // Always include at least an empty object so new checklists are created
      // even if they don't have any checked items yet
      const checklistData = {
        sections: sections.reduce((acc, section) => {
          // Include all sections, not just ones with checked items
          acc[section.id] = {
            items: section.items.reduce((itemAcc, item) => {
              itemAcc[item.id] = item.checked;
              return itemAcc;
            }, {} as Record<string, boolean>)
          };
          return acc;
        }, {} as Record<string, { items: Record<string, boolean> }>),
        lastUpdatedAt: new Date().toISOString()
      };
      
      console.log('Preparing to save checklist with data:', {
        checklistId: currentChecklistId,
        dataSize: JSON.stringify(checklistData).length,
        timestamp: checklistData.lastUpdatedAt
      });
      
      // Make a local copy of the ID to ensure we use the current value
      // We already checked that currentChecklistId is defined above
      const idToSave = currentChecklistId;
      console.log('Using local copy of ID to ensure consistency:', idToSave);
      
      await saveChecklist(idToSave, checklistData);
      
      // Refresh list of available checklists
      await loadChecklists();
      
      // Show success message
      setToastMessage(`Progress saved successfully for checklist: ${idToSave}`);
      
      // Clear message after 3 seconds
      setTimeout(() => clearToastMessage(), 3000);
    } catch (err) {
      setError('Failed to save checklist. Your progress is saved locally.');
      console.error('Error saving checklist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    setNextFocusItemId(null); // Clear previous focus intention first

    setSections(prevSections => {
      const newSections = prevSections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              items: section.items.map(item => 
                item.id === itemId 
                  ? { ...item, checked: !item.checked }
                  : item
              )
            }
          : section
      );

      // --- Start: Logic to run AFTER sections are updated ---
      const currentSection = newSections.find(s => s.id === sectionId);
      let nextUncheckedItemIdForFocus: string | null = null;
      let sectionJustCompletedId: string | null = null;

      if (currentSection) {
        const itemJustToggled = currentSection.items.find(item => item.id === itemId);
        
        // If we just checked an item (not unchecked)
        if (itemJustToggled?.checked) {
          // Find the next unchecked item in this section
          const nextUncheckedItem = currentSection.items.find(
            item => !item.checked && item.id !== itemId
          );
          
          if (nextUncheckedItem) {
            // Still unchecked items in this section
            nextUncheckedItemIdForFocus = nextUncheckedItem.id;
          } else {
            // Section just completed! Find next section with unchecked items
            sectionJustCompletedId = sectionId;
            
            const currentSectionIndex = newSections.findIndex(s => s.id === sectionId);
            if (currentSectionIndex !== -1) {
              // Try to find the next section with unchecked items
              for (let i = currentSectionIndex + 1; i < newSections.length; i++) {
                const nextSection = newSections[i];
                const firstUncheckedItemInNextSection = nextSection.items.find(item => !item.checked);
                
                if (firstUncheckedItemInNextSection) {
                  nextUncheckedItemIdForFocus = firstUncheckedItemInNextSection.id;
                  break;
                }
              }
            }
          }
        }
      }
      
      // Set the next item to auto-focus
      if (nextUncheckedItemIdForFocus) {
        setNextFocusItemId(nextUncheckedItemIdForFocus);
      }
      
      // Set the section we just completed (if applicable)
      if (sectionJustCompletedId) {
        setCompletedSectionIdToAdvanceFrom(sectionJustCompletedId);
      }
      // --- End: Logic to run AFTER sections are updated ---

      return newSections;
    });
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