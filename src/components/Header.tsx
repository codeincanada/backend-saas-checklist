import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { Server } from 'lucide-react';

const Header: React.FC = () => {
  const { getOverallProgress } = useChecklist();
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
        
        <div className="w-full md:w-64">
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
      </div>
    </header>
  );
};

export default Header;