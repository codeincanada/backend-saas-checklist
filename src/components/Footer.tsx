import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChecklist } from '../contexts/ChecklistContext';
import { LogOut, Github } from 'lucide-react';

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
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 shadow-lg z-10">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {showLastUpdated ? (
            <span>Last updated: {formatLastUpdated(currentChecklist.lastUpdatedAt)}</span>
          ) : (
            <span>{currentDate}</span>
          )}
        </div>
        
        {/* Auth Section */}
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2 bg-gray-100 p-1 pl-2 pr-3 rounded-lg">
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="h-6 w-6 rounded-full border border-gray-300"
              />
              <span className="text-sm font-medium hidden sm:block">
                {user.name || user.login}
              </span>
              <button 
                onClick={logout}
                className="ml-1 p-1 hover:bg-gray-200 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded transition-colors text-white text-sm shadow-sm"
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