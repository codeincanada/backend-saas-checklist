import React from 'react';
import { ChecklistProvider } from './contexts/ChecklistContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import MainContent from './components/MainContent';
import NotificationManager from './components/NotificationManager';
import AuthCallbackHandler from './components/AuthCallbackHandler';

// Inner component to access all contexts
const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <NotificationManager />
      <Header />
      <MainContent />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChecklistProvider>
          <AuthCallbackHandler />
          <AppContent />
        </ChecklistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;