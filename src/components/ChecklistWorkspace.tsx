import React, { useState, useEffect } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import CategoryTabs from './CategoryTabs';
import Checklist from './Checklist';
import { sections as allCategoriesData } from '../utils/data';

const ChecklistWorkspace: React.FC = () => {
  const { 
    sections,
    getSectionProgress, 
    completedSectionIdToAdvanceFrom, 
    setCompletedSectionIdToAdvanceFrom
  } = useChecklist();

  const [activeCategory, setActiveCategory] = useState<string | null>(
    allCategoriesData.length > 0 ? allCategoriesData[0].id : null
  );

  // Auto-advance to next incomplete category when a section is completed
  useEffect(() => {
    if (completedSectionIdToAdvanceFrom) {
      const completedIndex = allCategoriesData.findIndex(c => c.id === completedSectionIdToAdvanceFrom);
      if (completedIndex !== -1) {
        // Search for the next category that isn't 100% complete
        let nextCategoryFound = false;
        for (let i = 1; i < allCategoriesData.length; i++) {
          const nextIndex = (completedIndex + i) % allCategoriesData.length;
          const nextCategoryCandidate = allCategoriesData[nextIndex];
          if (getSectionProgress(nextCategoryCandidate.id) < 100) {
            setActiveCategory(nextCategoryCandidate.id);
            nextCategoryFound = true;
            break;
          }
        }
        // If all are complete, optionally navigate to summary or stay on current
        if (!nextCategoryFound) {
           // Could navigate to a summary view or first tab if all complete
           // setActiveCategory(allCategoriesData.length > 0 ? allCategoriesData[0].id : null);
        }
      }
      setCompletedSectionIdToAdvanceFrom(null); // Reset the trigger
    }
  }, [completedSectionIdToAdvanceFrom, sections, getSectionProgress, setCompletedSectionIdToAdvanceFrom]);
  
  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  return (
    <>
      <CategoryTabs 
        categories={allCategoriesData.map(c => ({ id: c.id, title: c.title, color: c.color }))}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        getSectionProgress={getSectionProgress}
      />
      <Checklist activeCategory={activeCategory} />
    </>
  );
};

export default ChecklistWorkspace; 