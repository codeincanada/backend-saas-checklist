import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';

const OverallProgress: React.FC = () => {
  const { getOverallProgress } = useChecklist();
  const progress = Math.round(getOverallProgress());

  return (
    <div className="mb-6 w-full md:w-auto">
      <div className="flex justify-between text-sm mb-1 text-gray-700 dark:text-gray-300">
        <span>Overall Progress</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <div className="h-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default OverallProgress; 