import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChecklist } from '../contexts/ChecklistContext';
import { LogOut, Github } from 'lucide-react';
import OverallProgress from './OverallProgress';

const Footer: React.FC = () => {
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  const { currentChecklistId, availableChecklists } = useChecklist();

  // Format current date to user locale
  const currentDate = new Intl.DateTimeFormat(navigator.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  // Get current checklist's last updated timestamp if available
  const currentChecklist = availableChecklists.find(checklist => 
    checklist.checklistName === currentChecklistId
  );
  
  const formatLastUpdated = (dateString: string) => {
    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Determine what to show in the footer
  const showLastUpdated = isAuthenticated && currentChecklist;

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg z-10 transition-colors">
      <OverallProgress />
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {showLastUpdated ? (
            <span>Last updated: {formatLastUpdated(currentChecklist.lastUpdatedAt)}</span>
          ) : (
            <span>{currentDate}</span>
          )}
        </div>
        
        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-600 animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-2 pl-3 pr-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-gray-500 shadow-sm"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
                {user.name || user.login}
              </span>
              <button 
                onClick={logout}
                className="ml-1 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors group"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-700 rounded-lg transition-colors text-white text-sm shadow-sm font-medium"
            >
              <Github className="h-4 w-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer; 