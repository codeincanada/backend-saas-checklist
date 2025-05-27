import React from 'react';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Backend Microservice Checklist</h1>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;