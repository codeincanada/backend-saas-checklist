import React, { useEffect } from 'react';
import { handleAuthCallback } from '../utils/auth';

const AuthCallbackHandler: React.FC = () => {
  useEffect(() => {
    // Handle GitHub OAuth callback if token is present in URL
    const query = new URLSearchParams(window.location.search);
    if (query.has('token')) {
      handleAuthCallback()
        .then(() => {
          console.log('Successfully authenticated with GitHub');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch(error => {
          console.error('Authentication failed:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, []);

  // This component doesn't render anything
  return null;
};

export default AuthCallbackHandler; 