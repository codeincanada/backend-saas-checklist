import React, { useEffect, useState } from 'react';
import { ChecklistProvider, useChecklist } from './contexts/ChecklistContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Checklist from './components/Checklist';
import CategoryTabs from './components/CategoryTabs';
import Toast from './components/Toast';
import LoadingIndicator from './components/LoadingIndicator';
import { sections as allCategoriesData } from './utils/data';
import { handleAuthCallback } from './utils/auth';
import { Trash2, Plus } from 'lucide-react';

// Inner component to access ChecklistContext for auto-advancing tabs
const AppContent: React.FC = () => {
  const { 
    sections, // Get all sections to check their progress
    getOverallProgress,
    getSectionProgress, 
    completedSectionIdToAdvanceFrom, 
    setCompletedSectionIdToAdvanceFrom,
    isLoading,
    error,
    clearError,
    toastMessage,
    clearToastMessage,
    availableChecklists,
    currentChecklistId,
    setCurrentChecklistId,
    saveCurrentProgress,
    loadChecklists,
    saveChecklist,
    deleteChecklist,
    clearAllData,
    createChecklist
  } = useChecklist();
  
  const { authError, clearAuthError, isAuthenticated } = useAuth();
  const [showChecklistsDropdown, setShowChecklistsDropdown] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');

  const [activeCategory, setActiveCategory] = useState<string | null>(
    allCategoriesData.length > 0 ? allCategoriesData[0].id : null
  );

  useEffect(() => {
    if (completedSectionIdToAdvanceFrom) {
      const completedIndex = allCategoriesData.findIndex(c => c.id === completedSectionIdToAdvanceFrom);
      if (completedIndex !== -1) {
        // Search for the next category that isn't 100% complete
        let nextCategoryFound = false;
        for (let i = 1; i < allCategoriesData.length; i++) {
          const nextIndex = (completedIndex + i) % allCategoriesData.length;
          const nextCategoryCandidate = allCategoriesData[nextIndex];
          if (getSectionProgress(nextCategoryCandidate.id) < 100) {
            setActiveCategory(nextCategoryCandidate.id);
            nextCategoryFound = true;
            break;
          }
        }
        // If all are complete, maybe stay or go to first? For now, just clears.
        if (!nextCategoryFound) {
           // Optionally, navigate to a summary or first tab if all complete
           // setActiveCategory(allCategoriesData.length > 0 ? allCategoriesData[0].id : null);
        }
      }
      setCompletedSectionIdToAdvanceFrom(null); // Reset the trigger
    }
  }, [completedSectionIdToAdvanceFrom, sections, getSectionProgress, setCompletedSectionIdToAdvanceFrom, setActiveCategory]);
  
  const handleSelectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const createNewChecklist = async () => {
    if (!newChecklistName.trim()) return;
    const newName = newChecklistName.trim();
    console.log('Attempting to create new checklist with name via context:', newName);

    try {
      await createChecklist(newName); // Use the new context function
      
      // UI updates after successful creation by context function
      setNewChecklistName('');
      setShowChecklistsDropdown(false);
      // Toast messages and loading states are handled by the context function
    } catch (error) {
      // Error is already set in context by createChecklist, App.tsx can log or alert if needed
      console.error('Error caught in App.tsx from createNewChecklist:', error);
      // alert('Failed to create checklist. Check console for details.'); // Context already sets error state for UI
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {authError && (
        <Toast 
          message={authError} 
          type="error" 
          onClose={clearAuthError} 
        />
      )}
      
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastMessage.includes('database') ? 'database' : 
                toastMessage.includes('Error') ? 'error' : 'success'} 
          onClose={clearToastMessage} 
        />
      )}
      
      <Header />
      <main className="py-6 container mx-auto px-4 pb-24">
        {/* Checklists Management */}
        {isAuthenticated && (
          <div className="mb-4 relative">
            <div className="flex items-center justify-between">
              <div></div>
              <div className="relative">
                <button 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-md flex items-center transition-colors"
                  onClick={() => {
                    setShowChecklistsDropdown(!showChecklistsDropdown);
                    if (!showChecklistsDropdown) {
                      // Refresh the list of checklists when opening the dropdown
                      loadChecklists();
                    }
                  }}
                >
                  <span>Checklists</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showChecklistsDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50 border dark:border-gray-700">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="font-medium text-gray-700 dark:text-gray-200">Your Checklists</h3>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {availableChecklists.map(checklist => (
                        <div
                          key={checklist.checklistName}
                          className={`flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer ${
                            currentChecklistId === checklist.checklistName ? 'bg-indigo-50 text-indigo-700' : ''
                          }`}
                          onClick={async () => {
                            // Set the checklist ID without triggering a save operation
                            console.log(`Selecting checklist: ${checklist.checklistName}`);
                            setCurrentChecklistId(checklist.checklistName);
                            
                            // loadChecklists will just load the data without saving
                            await loadChecklists();
                            
                            // Close the dropdown
                            setShowChecklistsDropdown(false);
                          }}
                        >
                          <div>
                            <div className="font-medium">{checklist.checklistName}</div>
                            <div className="text-xs text-gray-500">
                              Last updated: {formatDate(checklist.lastUpdatedAt)}
                            </div>
                          </div>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              
                              if (window.confirm(`Are you sure you want to delete checklist "${checklist.checklistName}"?`)) {
                                try {
                                  console.log(`Attempting to delete checklist: ${checklist.checklistName}`);
                                  
                                  // Use the explicit checklist ID parameter
                                  await deleteChecklist(checklist.checklistName);
                                  
                                  console.log(`Successfully requested deletion of: ${checklist.checklistName}`);
                                  
                                  // Force reload the list immediately
                                  setTimeout(() => {
                                    loadChecklists();
                                  }, 500);
                                } catch (err) {
                                  console.error('Error when trying to delete checklist:', err);
                                  alert('Failed to delete checklist. Please try again.');
                                }
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 rounded"
                            aria-label={`Delete checklist ${checklist.checklistName}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      {availableChecklists.length === 0 && (
                        <div className="px-4 py-2 text-gray-500 italic">No checklists yet</div>
                      )}
                    </div>
                    
                    <div className="p-3 border-t border-gray-200">
                      <div className="flex">
                        <input
                          type="text"
                          className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm"
                          placeholder="New checklist name..."
                          value={newChecklistName}
                          onChange={(e) => setNewChecklistName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              createNewChecklist();
                            }
                          }}
                        />
                        <button
                          className="bg-indigo-600 text-white rounded-r-md px-3"
                          onClick={createNewChecklist}
                          disabled={!newChecklistName.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Loading and Error Indicators */}
        {isLoading && (
          <LoadingIndicator message="Syncing your progress..." />
        )}
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        <CategoryTabs 
          categories={allCategoriesData.map(c => ({ id: c.id, title: c.title, color: c.color }))}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          getSectionProgress={getSectionProgress}
        />
        <Checklist activeCategory={activeCategory} />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    // Handle GitHub OAuth callback if token is present in URL
    const query = new URLSearchParams(window.location.search);
    if (query.has('token')) {
      handleAuthCallback()
        .then(() => {
          console.log('Successfully authenticated with GitHub');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(error => {
          console.error('Authentication failed:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ChecklistProvider>
          <AppContent />
        </ChecklistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;