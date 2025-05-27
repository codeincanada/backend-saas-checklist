import React, { useState, useRef, useEffect } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, List, GitPullRequest, Type, Check, X } from 'lucide-react';

const ChecklistManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
    availableChecklists,
    currentChecklistId,
    setCurrentChecklistId,
    createChecklist,
    createChecklistFromPR,
    deleteChecklist,
    isLoading
  } = useChecklist();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createMode, setCreateMode] = useState<'manual' | 'pr'>('manual');
  const [newChecklistName, setNewChecklistName] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when create form shows
  useEffect(() => {
    if (showCreateForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateForm, createMode]);

  const handleCreateChecklist = async () => {
    if (createMode === 'manual') {
      if (!newChecklistName.trim()) return;
      try {
        await createChecklist(newChecklistName.trim());
        setNewChecklistName('');
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating checklist:', error);
      }
    } else if (createMode === 'pr') {
      if (!prUrl.trim()) return;
      try {
        await createChecklistFromPR(prUrl.trim());
        setPrUrl('');
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error creating checklist from PR:', error);
      }
    }
  };

  const handleDeleteChecklist = async (checklistName: string) => {
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

  return (
    <div className="mb-6 space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <List className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Your Checklists ({availableChecklists.length})
          </h2>
        </div>
        
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setNewChecklistName('');
            setPrUrl('');
            setCreateMode('manual');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4" />
          New Checklist
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          {/* Mode Switcher */}
          <div className="flex mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setCreateMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                createMode === 'manual'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Type className="h-4 w-4" />
              Manual Creation
            </button>
            <button
              onClick={() => setCreateMode('pr')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                createMode === 'pr'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <GitPullRequest className="h-4 w-4" />
              From GitHub PR
            </button>
          </div>

          {/* Input Form */}
          <div className="flex gap-3">
            {createMode === 'manual' && (
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
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                disabled={isLoading}
              />
            )}
            
            {createMode === 'pr' && (
              <input
                ref={inputRef}
                type="text"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateChecklist();
                  } else if (e.key === 'Escape') {
                    setShowCreateForm(false);
                    setPrUrl('');
                  }
                }}
                placeholder="https://github.com/owner/repo/pull/123"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                disabled={isLoading}
              />
            )}
            
            <button
              onClick={handleCreateChecklist}
              disabled={(createMode === 'manual' && !newChecklistName.trim()) || (createMode === 'pr' && !prUrl.trim()) || isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-500 dark:hover:bg-green-600 dark:disabled:bg-gray-600 text-white rounded-md transition-colors"
            >
              <Check className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewChecklistName('');
                setPrUrl('');
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white rounded-md transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checklists Grid */}
      {availableChecklists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <List className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No checklists yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first checklist to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Checklist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableChecklists.map((checklist) => (
            <div
              key={checklist.checklistName}
              className={`group relative p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                currentChecklistId === checklist.checklistName
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-500 ring-opacity-50'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleSelectChecklist(checklist.checklistName)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${
                    currentChecklistId === checklist.checklistName
                      ? 'text-indigo-900 dark:text-indigo-100'
                      : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {checklist.checklistName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Updated {formatDate(checklist.lastUpdatedAt)}
                  </p>
                  {currentChecklistId === checklist.checklistName && (
                    <div className="flex items-center gap-1 mt-2">
                      <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Active</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChecklist(checklist.checklistName);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded transition-all"
                  aria-label={`Delete ${checklist.checklistName}`}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChecklistManager; 