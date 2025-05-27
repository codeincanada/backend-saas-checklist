import React, { useState, useRef, useEffect } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Plus, Trash2, Check, List } from 'lucide-react';

const ChecklistSwitcher: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    availableChecklists,
    currentChecklistId,
    setCurrentChecklistId,
    createChecklist,
    deleteChecklist,
    isLoading
  } = useChecklist();

  const [isOpen, setIsOpen] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
        setNewChecklistName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when create form shows
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return;
    
    try {
      await createChecklist(newChecklistName.trim());
      setNewChecklistName('');
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating checklist:', error);
    }
  };

  const handleDeleteChecklist = async (checklistName: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm(`Are you sure you want to delete "${checklistName}"?`)) {
      try {
        await deleteChecklist(checklistName);
      } catch (error) {
        console.error('Error deleting checklist:', error);
      }
    }
  };

  const handleSelectChecklist = (checklistName: string) => {
    setCurrentChecklistId(checklistName);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const currentChecklist = availableChecklists.find(cl => cl.checklistName === currentChecklistId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 min-w-[200px] group"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <List className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-full">
              {currentChecklist?.checklistName || 'Select Checklist'}
            </span>
            {currentChecklist && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {formatDate(currentChecklist.lastUpdatedAt)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Header */}
                     <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Your Checklists ({availableChecklists.length})
              </h3>
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setNewChecklistName('');
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded transition-colors"
                disabled={isLoading}
              >
                <Plus className="h-3 w-3" />
                New
              </button>
            </div>
          </div>

          {/* Create Form */}
          {showCreateForm && (
                         <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newChecklistName}
                  onChange={(e) => setNewChecklistName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateChecklist();
                    } else if (e.key === 'Escape') {
                      setShowCreateForm(false);
                      setNewChecklistName('');
                    }
                  }}
                  placeholder="Enter checklist name..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                  disabled={isLoading}
                />
                <button
                  onClick={handleCreateChecklist}
                  disabled={!newChecklistName.trim() || isLoading}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:disabled:bg-gray-600 text-white rounded-md transition-colors text-sm"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Checklist List */}
          <div className="max-h-60 overflow-y-auto">
            {availableChecklists.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No checklists yet</p>
                <p className="text-xs mt-1">Create your first checklist to get started</p>
              </div>
            ) : (
              availableChecklists.map((checklist) => (
                <div
                  key={checklist.checklistName}
                  className={`group flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    currentChecklistId === checklist.checklistName
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-r-2 border-indigo-500'
                      : ''
                  }`}
                  onClick={() => handleSelectChecklist(checklist.checklistName)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {currentChecklistId === checklist.checklistName && (
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-medium truncate ${
                        currentChecklistId === checklist.checklistName
                          ? 'text-indigo-900 dark:text-indigo-100'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {checklist.checklistName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Updated {formatDate(checklist.lastUpdatedAt)}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteChecklist(checklist.checklistName, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded transition-all"
                    aria-label={`Delete ${checklist.checklistName}`}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistSwitcher; 