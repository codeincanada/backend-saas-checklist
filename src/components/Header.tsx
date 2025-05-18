import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Server, Github as GitHubIcon } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, login } = useAuth();

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
          {!isAuthenticated && (
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