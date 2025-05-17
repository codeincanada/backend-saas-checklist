import React from 'react';
import { ChecklistSection } from '../types'; // Assuming categories will be of this type
import { Circle, CheckCircle2 } from 'lucide-react'; // Import icons

interface CategoryTabsProps {
  categories: Pick<ChecklistSection, 'id' | 'title' | 'color'>[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  getSectionProgress: (sectionId: string) => number; // New prop
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onSelectCategory, getSectionProgress }) => {
  return (
    <div className="mb-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
      <nav className="-mb-px flex space-x-1 sm:space-x-4" aria-label="Tabs">
        {categories.map((category, index) => {
          const progress = getSectionProgress(category.id);
          let progressIndicator: React.ReactNode = null;

          if (progress === 0) {
            progressIndicator = <Circle className="h-3 w-3 ml-1.5 text-gray-400" />;
          } else if (progress === 100) {
            progressIndicator = <CheckCircle2 className="h-3.5 w-3.5 ml-1.5 text-green-500" />;
          } else {
            progressIndicator = <span className="ml-1.5 text-xs font-normal">({Math.round(progress)}%)</span>;
          }

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`flex items-center py-4 px-3 sm:px-4 border-b-2 font-medium text-sm 
                ${activeCategory === category.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                ${index === categories.length - 1 ? 'mr-4 sm:mr-0' : ''} // Add margin to the last item for scroll visibility
              `}
              aria-current={activeCategory === category.id ? 'page' : undefined}
            >
              {category.title}
              {progressIndicator}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CategoryTabs; 