import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChecklistSection, ChecklistItem } from '../types';
import { sections as initialSections } from '../utils/data';

interface ChecklistContextType {
  sections: ChecklistSection[];
  toggleItem: (sectionId: string, itemId: string) => void;
  getSectionProgress: (sectionId: string) => number;
  getOverallProgress: () => number;
  filterSections: (category?: string) => void;
  resetFilters: () => void;
  filteredSections: ChecklistSection[];
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

  const [filteredSections, setFilteredSections] = useState<ChecklistSection[]>(sections);

  useEffect(() => {
    localStorage.setItem('microservice-checklist', JSON.stringify(sections));
    setFilteredSections(sections);
  }, [sections]);

  const toggleItem = (sectionId: string, itemId: string) => {
    setSections(prevSections => 
      prevSections.map(section => 
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
      )
    );
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

  const filterSections = (category?: string) => {
    if (!category) {
      setFilteredSections(sections);
      return;
    }
    
    setFilteredSections(sections.filter(section => section.id === category));
  };

  const resetFilters = () => {
    setFilteredSections(sections);
  };

  return (
    <ChecklistContext.Provider 
      value={{ 
        sections, 
        toggleItem, 
        getSectionProgress, 
        getOverallProgress,
        filterSections,
        resetFilters,
        filteredSections
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