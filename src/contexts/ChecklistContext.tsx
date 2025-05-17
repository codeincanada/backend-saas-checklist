import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChecklistSection, ChecklistItem } from '../types';
import { sections as initialSections } from '../utils/data';

interface ChecklistContextType {
  sections: ChecklistSection[];
  toggleItem: (sectionId: string, itemId: string) => void;
  getSectionProgress: (sectionId: string) => number;
  getOverallProgress: () => number;
  nextFocusItemId: string | null;
  setNextFocusItemId: (itemId: string | null) => void;
  completedSectionIdToAdvanceFrom: string | null;
  setCompletedSectionIdToAdvanceFrom: (sectionId: string | null) => void;
}

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

interface ChecklistProviderProps {
  children: ReactNode;
}

export const ChecklistProvider: React.FC<ChecklistProviderProps> = ({ children }) => {
  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    const saved = localStorage.getItem('microservice-checklist');
    return saved ? JSON.parse(saved) : initialSections;
  });
  const [nextFocusItemId, setNextFocusItemId] = useState<string | null>(null);
  const [completedSectionIdToAdvanceFrom, setCompletedSectionIdToAdvanceFrom] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('microservice-checklist', JSON.stringify(sections));
  }, [sections]);

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
        setCompletedSectionIdToAdvanceFrom
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