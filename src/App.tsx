import React from 'react';
import { ChecklistProvider } from './contexts/ChecklistContext';
import Header from './components/Header';
import Checklist from './components/Checklist';

function App() {
  return (
    <ChecklistProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-6">
          <Checklist />
        </main>
        <footer className="py-4 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Backend Microservice Checklist • Save your progress with LocalStorage
        </footer>
      </div>
    </ChecklistProvider>
  );
}

export default App;