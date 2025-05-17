import React from 'react';
import { ChecklistSection } from '../types'; // Assuming categories will be of this type

interface CategoryTabsProps {
  categories: Pick<ChecklistSection, 'id' | 'title' | 'color'>[];
  activeCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ categories, activeCategory, onSelectCategory }) => {
  return (
    <div className="mb-6 border-b border-gray-200 overflow-x-auto whitespace-nowrap">
      <nav className="-mb-px flex space-x-1 sm:space-x-4" aria-label="Tabs">
        {categories.map((category, index) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={`py-4 px-3 sm:px-4 border-b-2 font-medium text-sm 
              ${activeCategory === category.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
              ${index === categories.length - 1 ? 'mr-4 sm:mr-0' : ''} // Add margin to the last item for scroll visibility
            `}
            aria-current={activeCategory === category.id ? 'page' : undefined}
          >
            {category.title}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default CategoryTabs; 