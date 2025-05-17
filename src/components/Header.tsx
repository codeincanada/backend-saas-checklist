import React, { useState } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { useAuth } from '../contexts/AuthContext';
import { Server, Github, LogOut, Save, Trash2, Plus, List } from 'lucide-react';

const Header: React.FC = () => {
  const { 
    saveCurrentProgress, 
    loadCompletions, 
    availableCompletions, 
    currentCompletionId, 
    setCurrentCompletionId,
    deleteCurrentCompletion
  } = useChecklist();
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  const [showCompletions, setShowCompletions] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  
  const handleCreateNew = () => {
    if (newTaskName.trim()) {
      setCurrentCompletionId(newTaskName.trim());
      setNewTaskName('');
      setShowCompletions(false);
      saveCurrentProgress();
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
          {/* Completions Management - Only visible when authenticated */}
          {isAuthenticated && (
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
                  onClick={() => setShowCompletions(!showCompletions)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded transition-colors"
                  title="Manage checklists"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Checklists</span>
                </button>
                
                {showCompletions && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white text-gray-800 rounded-md shadow-lg z-50 p-2">
                    <h3 className="font-medium text-sm px-2 py-1 border-b border-gray-200">Your Checklists</h3>
                    
                    {/* Create new completion */}
                    <div className="p-2 border-b border-gray-200">
                      <div className="flex gap-1 mb-1">
                        <input
                          type="text"
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          placeholder="New checklist name..."
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={handleCreateNew}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          disabled={!newTaskName.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* List of completions */}
                    <div className="max-h-48 overflow-y-auto">
                      {availableCompletions.length === 0 ? (
                        <p className="text-sm text-gray-600 p-2">No saved checklists yet.</p>
                      ) : (
                        availableCompletions.map((completion) => (
                          <div 
                            key={completion.taskIdentifier}
                            className={`flex justify-between items-center p-2 hover:bg-gray-100 transition-colors cursor-pointer rounded ${currentCompletionId === completion.taskIdentifier ? 'bg-indigo-50' : ''}`}
                            onClick={() => {
                              setCurrentCompletionId(completion.taskIdentifier);
                              loadCompletions();
                              setShowCompletions(false);
                            }}
                          >
                            <div>
                              <div className="font-medium text-sm">{completion.taskIdentifier}</div>
                              <div className="text-xs text-gray-500">{formatDate(completion.lastUpdatedAt)}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this checklist?')) {
                                  deleteCurrentCompletion();
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
          )}

          {/* Auth Section */}
          {loading ? (
            <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 bg-white/10 p-1 pl-2 pr-3 rounded-lg">
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="h-8 w-8 rounded-full border border-white"
              />
              <span className="text-sm font-medium hidden md:block">
                {user.name || user.login}
              </span>
              <button 
                onClick={logout}
                className="ml-1 p-1 hover:bg-white/10 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors duration-200 shadow-md"
            >
              <Github className="h-5 w-5" />
              <span>Login with GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;