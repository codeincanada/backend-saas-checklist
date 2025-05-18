import React, { useState } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { useAuth } from '../contexts/AuthContext';
import { Server, Save, Trash2, Plus, List, Github as GitHubIcon } from 'lucide-react';

const Header: React.FC = () => {
  const { 
    saveCurrentProgress, 
    loadChecklists, 
    availableChecklists, 
    currentChecklistId, 
    setCurrentChecklistId,
    deleteCurrentChecklist,
    clearAllData
  } = useChecklist();
  const { isAuthenticated, login } = useAuth();
  const [showChecklistsDropdown, setShowChecklistsDropdown] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  
  const handleCreateNew = async () => {
    if (newChecklistName.trim()) {
      // Set the new checklist name first
      setCurrentChecklistId(newChecklistName.trim());
      
      // Then clear existing data to start fresh with the new checklist
      clearAllData();
      
      // Save the new checklist with this name
      await saveCurrentProgress();
      
      // Reload the list of checklists to show the new one
      await loadChecklists();
      
      // Clear the input and close the dropdown
      setNewChecklistName('');
      setShowChecklistsDropdown(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Server className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold tracking-tight">
            Backend Microservice Checklist
          </h1>
        </div>
        
        <div className="flex md:flex-row flex-col items-center gap-4">
          {/* Checklists Management - Only visible when authenticated */}
          {isAuthenticated ? (
            <div className="relative">
              <div className="flex gap-2">
                <button 
                  onClick={() => saveCurrentProgress()} 
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded transition-colors"
                  title="Save progress"
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowChecklistsDropdown(!showChecklistsDropdown);
                    if (!showChecklistsDropdown) {
                      // Refresh the list of checklists when opening the dropdown
                      loadChecklists();
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                  title="Manage checklists"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Checklists</span>
                </button>
                
                {showChecklistsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white text-gray-800 rounded-md shadow-lg z-50 p-2">
                    <h3 className="font-medium text-sm px-2 py-1 border-b border-gray-200">Your Checklists</h3>
                    
                    {/* Create new checklist */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="flex gap-1 mb-1">
                        <input
                          type="text"
                          value={newChecklistName}
                          onChange={(e) => setNewChecklistName(e.target.value)}
                          placeholder="New checklist name..."
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={handleCreateNew}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          disabled={!newChecklistName.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* List of checklists */}
                    <div className="max-h-48 overflow-y-auto">
                      {availableChecklists.length === 0 ? (
                        <p className="text-sm text-gray-600 p-2">No saved checklists yet.</p>
                      ) : (
                        availableChecklists.map((checklist) => (
                          <div 
                            key={checklist.checklistName}
                            className={`flex justify-between items-center p-2 hover:bg-gray-100 transition-colors cursor-pointer rounded ${currentChecklistId === checklist.checklistName ? 'bg-indigo-50' : ''}`}
                            onClick={async () => {
                              // First set the ID
                              setCurrentChecklistId(checklist.checklistName);
                              
                              // Then load the checklists to update the UI
                              await loadChecklists();
                              
                              // Close the dropdown
                              setShowChecklistsDropdown(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">{checklist.checklistName}</div>
                              <div className="text-xs text-gray-500">{formatDate(checklist.lastUpdatedAt)}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this checklist?')) {
                                  deleteCurrentChecklist();
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 rounded"
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
            </div>
          ) : (
            <button 
              onClick={() => login()} 
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 rounded transition-colors"
              title="Sign in to save your progress"
            >
              <GitHubIcon className="h-4 w-4" />
              <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;