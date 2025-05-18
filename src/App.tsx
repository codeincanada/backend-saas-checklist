import React, { useEffect, useState } from 'react';
import { ChecklistProvider, useChecklist } from './contexts/ChecklistContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Checklist from './components/Checklist';
import CategoryTabs from './components/CategoryTabs';
import Toast from './components/Toast';
import { sections as allCategoriesData } from './utils/data';
import { handleAuthCallback } from './utils/auth';
import NewChecklistForm from './components/NewChecklistForm';
import ChecklistTabs from './components/ChecklistTabs';
import { Github } from 'lucide-react';

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
  
  const { authError, clearAuthError, isAuthenticated, login } = useAuth();

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
    <div className="min-h-screen bg-gray-50">
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
          type="success" 
          onClose={clearToastMessage} 
        />
      )}
      
      <Header />
      <main className="py-6 container mx-auto px-4 pb-24">
        {/* Checklists Management */}
        {isAuthenticated && (
          <div className="mb-4">
            <ChecklistTabs />
          </div>
        )}
        
        {/* Loading and Error Indicators */}
        {isLoading && (
          <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded-md flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Syncing your progress...
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md flex items-center justify-between">
            <span>Error: {error}</span>
            <button onClick={clearError} className="text-red-800 hover:text-red-600 font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* Overall Progress Bar */}
        {isAuthenticated && currentChecklistId && (
          <div className="mb-6 p-4 bg-white shadow rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-gray-700">Overall Progress</h2>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getOverallProgress()}%` }}
              ></div>
            </div>
            <p className="text-right text-sm text-indigo-600 mt-1">{getOverallProgress()}% complete</p>
          </div>
        )}

        {isAuthenticated && currentChecklistId ? (
          <>
            <CategoryTabs 
              categories={allCategoriesData}
              activeCategory={activeCategory}
              onSelectCategory={handleSelectCategory}
              getSectionProgress={getSectionProgress}
            />
            <Checklist activeCategory={activeCategory} />
          </>
        ) : isAuthenticated ? (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-6">Select a checklist above to get started, or create a new one.</p>
          </div>
        ) : (
          <div className="text-center py-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome to the Backend Microservice Checklist!</h2>
            <p className="text-gray-600">Please log in to manage and track your microservice development progress.</p>
          </div>
        )}
      </main>
      {isAuthenticated ? (
        <NewChecklistForm />
      ) : (
        <footer className="p-3 border-t border-gray-200 bg-white fixed bottom-0 left-0 right-0 shadow-lg z-10">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              {new Intl.DateTimeFormat(navigator.language, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }).format(new Date())}
            </p>
            <button
              onClick={login}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded transition-colors text-white text-sm shadow-sm"
            >
              <Github className="h-4 w-4" />
              <span>Login</span>
            </button>
          </div>
        </footer>
      )}
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
    <AuthProvider>
      <ChecklistProvider>
        <AppContent />
      </ChecklistProvider>
    </AuthProvider>
  );
}

export default App;