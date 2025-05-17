import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChecklistSection, ChecklistItem } from '../types';
import { sections as initialSections } from '../utils/data';
import { useCompletion } from './CompletionContext';
import { useAuth } from './AuthContext';

interface ChecklistContextType {
  sections: ChecklistSection[];
  toggleItem: (sectionId: string, itemId: string) => void;
  getSectionProgress: (sectionId: string) => number;
  getOverallProgress: () => number;
  nextFocusItemId: string | null;
  setNextFocusItemId: (itemId: string | null) => void;
  completedSectionIdToAdvanceFrom: string | null;
  setCompletedSectionIdToAdvanceFrom: (sectionId: string | null) => void;
  isLoading: boolean;
  error: string | null;
  saveCurrentProgress: () => Promise<void>;
  loadCompletions: () => Promise<void>;
  availableCompletions: Array<{taskIdentifier: string, lastUpdatedAt: string}>;
  currentCompletionId: string;
  setCurrentCompletionId: (id: string) => void;
  deleteCurrentCompletion: () => Promise<void>;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

interface ChecklistProviderProps {
  children: ReactNode;
}

// Default completion identifier to use with the API
const DEFAULT_COMPLETION_ID = 'default-checklist';

export const ChecklistProvider: React.FC<ChecklistProviderProps> = ({ children }) => {
  // Get authentication and completion context
  const { isAuthenticated } = useAuth();
  const { saveCompletion, getCompletions, deleteCompletion, isLoading: apiLoading, error: apiError } = useCompletion();

  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('microservice-checklist');
    return saved ? JSON.parse(saved) : initialSections;
  });
  const [nextFocusItemId, setNextFocusItemId] = useState<string | null>(null);
  const [completedSectionIdToAdvanceFrom, setCompletedSectionIdToAdvanceFrom] = useState<string | null>(null);
  const [availableCompletions, setAvailableCompletions] = useState<Array<{taskIdentifier: string, lastUpdatedAt: string}>>([]);
  const [currentCompletionId, setCurrentCompletionId] = useState<string>(DEFAULT_COMPLETION_ID);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load completions from localStorage (fallback) or try to load from API if authenticated
  useEffect(() => {
    const saved = localStorage.getItem('microservice-checklist');
    if (saved) {
      setSections(JSON.parse(saved));
    }

    // If authenticated, fetch available completions
    if (isAuthenticated) {
      loadCompletions().catch(console.error);
    }
  }, [isAuthenticated]);

  // Always save to localStorage as a backup
  useEffect(() => {
    localStorage.setItem('microservice-checklist', JSON.stringify(sections));
  }, [sections]);

  // Load available completions from the API
  const loadCompletions = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const completions = await getCompletions();
      
      // Format completions for the dropdown
      const formattedCompletions = completions.map(comp => ({
        taskIdentifier: comp.taskIdentifier,
        lastUpdatedAt: comp.completionData.lastUpdatedAt || new Date().toISOString()
      }));
      
      setAvailableCompletions(formattedCompletions);
      
      // If we have completions and none is currently selected, load the most recent one
      if (formattedCompletions.length > 0 && currentCompletionId === DEFAULT_COMPLETION_ID) {
        // Sort by date to find the most recent
        const sortedCompletions = [...formattedCompletions].sort(
          (a, b) => new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
        );
        
        const mostRecentId = sortedCompletions[0].taskIdentifier;
        setCurrentCompletionId(mostRecentId);
        
        // Find and load the completion data for this ID
        const completionData = completions.find(c => c.taskIdentifier === mostRecentId);
        if (completionData && completionData.completionData.sections) {
          // Convert the stored format back to our sections array
          const loadedSections = [...initialSections];
          
          Object.entries(completionData.completionData.sections).forEach(([sectionId, sectionData]) => {
            const sectionIndex = loadedSections.findIndex(s => s.id === sectionId);
            if (sectionIndex !== -1) {
              const items = loadedSections[sectionIndex].items.map(item => ({
                ...item,
                checked: sectionData.items[item.id] || false
              }));
              
              loadedSections[sectionIndex] = {
                ...loadedSections[sectionIndex],
                items
              };
            }
          });
          
          setSections(loadedSections);
        }
      }
    } catch (err) {
      setError('Failed to load completions. Using local data.');
      console.error('Error loading completions:', err);
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
      // Convert sections array to the format we want to store
      const completionData = {
        sections: sections.reduce((acc, section) => {
          // Only include sections with at least one checked item
          const checkedItems = section.items.filter(item => item.checked);
          if (checkedItems.length > 0) {
            acc[section.id] = {
              items: section.items.reduce((itemAcc, item) => {
                itemAcc[item.id] = item.checked;
                return itemAcc;
              }, {} as Record<string, boolean>)
            };
          }
          return acc;
        }, {} as Record<string, { items: Record<string, boolean> }>),
        lastUpdatedAt: new Date().toISOString()
      };
      
      await saveCompletion(currentCompletionId, completionData);
      
      // Refresh list of available completions
      await loadCompletions();
    } catch (err) {
      setError('Failed to save completion. Your progress is saved locally.');
      console.error('Error saving completion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete the current completion
  const deleteCurrentCompletion = async () => {
    if (!isAuthenticated || currentCompletionId === DEFAULT_COMPLETION_ID) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteCompletion(currentCompletionId);
      
      // Reset to default completion
      setCurrentCompletionId(DEFAULT_COMPLETION_ID);
      
      // Reset sections to initial state
      setSections(initialSections);
      
      // Refresh list of available completions
      await loadCompletions();
    } catch (err) {
      setError('Failed to delete completion.');
      console.error('Error deleting completion:', err);
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
        const toggledItem = currentSection.items.find(i => i.id === itemId);
        if (toggledItem && toggledItem.checked) { // If we just *checked* an item
            const firstUnchecked = currentSection.items.find(item => !item.checked);
            if (firstUnchecked) {
                nextUncheckedItemIdForFocus = firstUnchecked.id;
            } else {
                // No unchecked items left, this section is complete
                sectionJustCompletedId = sectionId;
            }
        }
      }
      
      // Update states based on the newSections evaluation
      // Schedule these updates to run after the current state update cycle
      // by using a microtask (Promise.resolve().then()) or a zero-delay setTimeout.
      // This ensures that AppContent's useEffect can react to these changes correctly.
      Promise.resolve().then(() => {
          if (nextUncheckedItemIdForFocus) {
            setNextFocusItemId(nextUncheckedItemIdForFocus);
          }
          if (sectionJustCompletedId) {
            setCompletedSectionIdToAdvanceFrom(sectionJustCompletedId);
          }
      });
      // --- End: Logic to run AFTER sections are updated ---
      
      // Auto-save to API when an item is toggled
      Promise.resolve().then(() => {
        if (isAuthenticated) {
          saveCurrentProgress().catch(console.error);
        }
      });

      return newSections;
    });
  };

  const getSectionProgress = (sectionId: string): number => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    const checkedItems = section.items.filter(item => item.checked).length;
    return checkedItems / section.items.length * 100;
  };

  const getOverallProgress = (): number => {
    const totalItems = sections.reduce((acc, section) => acc + section.items.length, 0);
    const checkedItems = sections.reduce(
      (acc, section) => acc + section.items.filter(item => item.checked).length, 
      0
    );
    
    return totalItems ? (checkedItems / totalItems) * 100 : 0;
  };

  return (
    <ChecklistContext.Provider 
      value={{ 
        sections, 
        toggleItem, 
        getSectionProgress, 
        getOverallProgress,
        nextFocusItemId,
        setNextFocusItemId,
        completedSectionIdToAdvanceFrom,
        setCompletedSectionIdToAdvanceFrom,
        isLoading: isLoading || apiLoading,
        error: error || apiError,
        saveCurrentProgress,
        loadCompletions,
        availableCompletions,
        currentCompletionId,
        setCurrentCompletionId,
        deleteCurrentCompletion
      }}
    >
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