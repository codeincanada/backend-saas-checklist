import React, { useEffect } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { Trash2 } from 'lucide-react';

const ChecklistTabs: React.FC = () => {
  const {
    availableChecklists,
    currentChecklistId,
    setCurrentChecklistId,
    loadChecklists,
    deleteChecklist,
    isLoading
  } = useChecklist();

  useEffect(() => {
    loadChecklists();
  }, [loadChecklists]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown date';
    }
  };

  if (isLoading && availableChecklists.length === 0) {
    return (
      <div className="flex items-center space-x-2 p-2 text-sm text-gray-500">
        Loading checklists...
      </div>
    );
  }
  
  if (availableChecklists.length === 0) {
    return (
      <div className="p-2 text-sm text-gray-500 italic">
        No checklists found. Create one below!
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 overflow-x-auto py-2 px-1 bg-white shadow-sm rounded-md">
      {availableChecklists.map((checklist) => (
        <div
          key={checklist.checklistName}
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer min-w-max hover:bg-indigo-100 transition-colors duration-150 ease-in-out ${
            currentChecklistId === checklist.checklistName
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:text-indigo-700'
          }`}
          onClick={async () => {
            if (currentChecklistId !== checklist.checklistName) {
              setCurrentChecklistId(checklist.checklistName);
              // loadChecklists will be triggered by context's useEffect on currentChecklistId change
            }
          }}
          title={`Last updated: ${formatDate(checklist.lastUpdatedAt)}`}
        >
          <span className="text-sm font-medium px-2 whitespace-nowrap">
            {checklist.checklistName}
          </span>
          <button
            onClick={async (e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete checklist "${checklist.checklistName}"?`)) {
                try {
                  await deleteChecklist(checklist.checklistName);
                  // loadChecklists will be called by context to refresh the list
                } catch (err) {
                  console.error('Error deleting checklist from tabs:', err);
                  // Potentially show a toast message here via context
                }
              }
            }}
            className={`p-1 rounded hover:bg-red-200 ${
              currentChecklistId === checklist.checklistName ? 'text-red-100 hover:text-red-700' : 'text-red-500 hover:text-red-700'
            }`}
            aria-label={`Delete checklist ${checklist.checklistName}`}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ChecklistTabs; 