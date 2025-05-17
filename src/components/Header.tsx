import React from 'react';
// import { useChecklist } from '../contexts/ChecklistContext'; // No longer needed here
import { useAuth } from '../contexts/AuthContext';
import { Server, Github, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  // const { getOverallProgress } = useChecklist(); // Removed
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  // const progress = getOverallProgress(); // Removed

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
          {/* Progress Bar Section Removed */}

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