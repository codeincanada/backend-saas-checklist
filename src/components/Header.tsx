import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { useAuth } from '../contexts/AuthContext';
import { Server, Github } from 'lucide-react';

const Header: React.FC = () => {
  const { getOverallProgress } = useChecklist();
  const { isAuthenticated, user, login, logout, loading } = useAuth();
  const progress = getOverallProgress();

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Server className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold tracking-tight">
            Backend Microservice Checklist
          </h1>
        </div>
        
        <div className="flex items-center">
          <div className="w-full md:w-64 mr-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {loading ? (
            <div className="h-10 w-10 rounded-full bg-white/20 animate-pulse"></div>
          ) : isAuthenticated && user ? (
            <div className="flex items-center">
              <img 
                src={user.avatar_url} 
                alt={user.login} 
                className="h-10 w-10 rounded-full border-2 border-white cursor-pointer"
                onClick={logout}
                title="Click to logout"
              />
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors duration-200"
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