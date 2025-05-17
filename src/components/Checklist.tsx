import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import ChecklistSection from './ChecklistSection';
import Filter from './Filter';
import { Printer, Save } from 'lucide-react';

const Checklist: React.FC = () => {
  const { filteredSections } = useChecklist();
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <Filter />
        
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
        </div>
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