import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import ChecklistSection from './ChecklistSection';
import Filter from './Filter';

const Checklist: React.FC = () => {
  const { filteredSections } = useChecklist();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 print:hidden">
        <Filter />
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredSections.map((section) => (
          <ChecklistSection key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
};

export default Checklist;