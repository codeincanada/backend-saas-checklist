import React, { useEffect } from 'react';
import { ChecklistProvider } from './contexts/ChecklistContext';
import { AuthProvider } from './contexts/AuthContext';
import { handleAuthCallback } from './utils/auth';
import Header from './components/Header';
import Checklist from './components/Checklist';

function App() {
  useEffect(() => {
    // Handle GitHub OAuth callback if token is present in URL
    const query = new URLSearchParams(window.location.search);
    if (query.has('token')) {
      handleAuthCallback()
        .then(() => {
          console.log('Successfully authenticated with GitHub');
        })
        .catch(error => {
          console.error('Authentication failed:', error);
        });
    }
  }, []);

  return (
    <AuthProvider>
      <ChecklistProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="py-6">
            <Checklist />
          </main>
          <footer className="py-4 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Backend Microservice Checklist
          </footer>
        </div>
      </ChecklistProvider>
    </AuthProvider>
  );
}

export default App;