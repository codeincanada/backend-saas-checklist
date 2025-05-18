import React, { useEffect, useState } from 'react';
import { ChecklistProvider, useChecklist } from './contexts/ChecklistContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CompletionProvider } from './contexts/CompletionContext';
import { handleAuthCallback } from './utils/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import Checklist from './components/Checklist';
import CategoryTabs from './components/CategoryTabs';
import Toast from './components/Toast';
import { sections as allCategoriesData } from './utils/data';

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
    toastMessage,
    clearToastMessage
  } = useChecklist();
  
  const { authError, clearAuthError } = useAuth();

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
          <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md">
            {error}
          </div>
        )}
        
        {/* Overall Progress Bar - New Location */}
        <div className="mb-6 w-full md:w-auto"> {/* Adjusted width and margin */}
          <div className="flex justify-between text-sm mb-1 text-gray-700"> {/* Adjusted text color */}
            <span>Overall Progress</span>
            <span className="font-medium">{Math.round(getOverallProgress())}%</span>
          </div>
          <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden"> {/* Adjusted bg color */}
            <div
              className="h-full bg-indigo-600 transition-all duration-500 ease-out" // Adjusted progress bar color
              style={{ width: `${getOverallProgress()}%` }}
            ></div>
          </div>
        </div>

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
    <AuthProvider>
      <CompletionProvider>
        <ChecklistProvider>
          <AppContent />
        </ChecklistProvider>
      </CompletionProvider>
    </AuthProvider>
  );
}

export default App;