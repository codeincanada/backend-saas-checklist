import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { AlertCircle } from 'lucide-react';

const ErrorIndicator: React.FC = () => {
  const { error } = useChecklist();

  if (!error) return null;

  return (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
      <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
      <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
    </div>
  );
};

export default ErrorIndicator; 