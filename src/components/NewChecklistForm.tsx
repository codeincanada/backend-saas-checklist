import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChecklist } from '../contexts/ChecklistContext';

const NewChecklistForm: React.FC = () => {
  const { createChecklist } = useChecklist();
  const [newChecklistName, setNewChecklistName] = useState('');

  const handleCreateNewChecklist = async () => {
    if (!newChecklistName.trim()) return;
    try {
      await createChecklist(newChecklistName.trim());
      setNewChecklistName(''); // Clear input after successful creation
    } catch (error) {
      // Error is handled by the context, but you could add specific UI feedback here if needed
      console.error('Failed to create checklist from NewChecklistForm:', error);
    }
  };

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-100 fixed bottom-0 left-0 right-0">
      <div className="container mx-auto px-4">
        <div className="flex">
          <input
            type="text"
            className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="New checklist name..."
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNewChecklist();
              }
            }}
          />
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-r-md px-4 py-2 text-sm flex items-center justify-center"
            onClick={handleCreateNewChecklist}
            disabled={!newChecklistName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" /> Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChecklistForm; 