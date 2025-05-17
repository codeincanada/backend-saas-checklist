import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { Filter as FilterIcon, X } from 'lucide-react';

const categories = [
  { id: 'code', label: 'Code Standards', color: 'bg-blue-500' },
  { id: 'deployment', label: 'Deployment', color: 'bg-green-500' },
  { id: 'communication', label: 'Communication', color: 'bg-purple-500' },
  { id: 'monitoring', label: 'Monitoring', color: 'bg-red-500' },
  { id: 'documentation', label: 'Documentation', color: 'bg-yellow-500' },
  { id: 'testing', label: 'Testing', color: 'bg-orange-500' },
  { id: 'security', label: 'Security', color: 'bg-teal-500' },
  { id: 'operations', label: 'Operations', color: 'bg-indigo-500' },
];

const Filter: React.FC = () => {
  const { filterSections, resetFilters } = useChecklist();
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  const handleFilterClick = (categoryId: string) => {
    if (activeFilter === categoryId) {
      setActiveFilter(null);
      resetFilters();
    } else {
      setActiveFilter(categoryId);
      filterSections(categoryId);
    }
  };

  const handleResetClick = () => {
    setActiveFilter(null);
    resetFilters();
  };

  return (
    <div className="container mx-auto mb-6 px-4">
      <div className="flex items-center mb-2">
        <FilterIcon className="mr-2 h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-medium text-gray-700">Filter by Category</h2>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleFilterClick(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center
              ${activeFilter === category.id 
                ? 'ring-2 ring-offset-2 shadow-md' 
                : 'hover:opacity-80'} 
              ${category.color} text-white`}
          >
            {category.label}
            {activeFilter === category.id && (
              <X className="ml-1 h-3 w-3" />
            )}
          </button>
        ))}
        
        {activeFilter && (
          <button 
            onClick={handleResetClick}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-all duration-200"
          >
            Show All
          </button>
        )}
      </div>
    </div>
  );
};

export default Filter;