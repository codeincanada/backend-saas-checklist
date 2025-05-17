import React, { useEffect, useState } from 'react';
import { ChecklistProvider, useChecklist } from './contexts/ChecklistContext';
import { AuthProvider } from './contexts/AuthContext';
import { handleAuthCallback } from './utils/auth';
import Header from './components/Header';
import Checklist from './components/Checklist';
import CategoryTabs from './components/CategoryTabs';
import { sections as allCategoriesData } from './utils/data';

// Inner component to access ChecklistContext for auto-advancing tabs
const AppContent: React.FC = () => {
  const { 
    sections, // Get all sections to check their progress
    getSectionProgress, 
    completedSectionIdToAdvanceFrom, 
    setCompletedSectionIdToAdvanceFrom 
  } = useChecklist();

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
      <Header />
      <main className="py-6 container mx-auto px-4">
        <CategoryTabs 
          categories={allCategoriesData.map(c => ({ id: c.id, title: c.title, color: c.color }))}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
          getSectionProgress={getSectionProgress}
        />
        <Checklist activeCategory={activeCategory} />
      </main>
      <footer className="py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} Backend Microservice Checklist
      </footer>
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