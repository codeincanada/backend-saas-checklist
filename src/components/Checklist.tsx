import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import ChecklistSectionComponent from './ChecklistSection';

interface ChecklistProps {
  activeCategory: string | null;
}

const Checklist: React.FC<ChecklistProps> = ({ activeCategory }) => {
  const { sections } = useChecklist();

  const currentSection = sections.find(s => s.id === activeCategory);

  return (
    <div className="container mx-auto px-4 pb-8">
      
      <div className="grid grid-cols-1 gap-6">
        {currentSection ? (
          <ChecklistSectionComponent key={currentSection.id} section={currentSection} />
        ) : (
          <p>Select a category to see the checklist items.</p>
        )}
      </div>
    </div>
  );
};

export default Checklist;