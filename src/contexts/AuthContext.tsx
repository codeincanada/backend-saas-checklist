import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Octokit } from '@octokit/rest';

// Define the Azure Function URL with the actual deployment URL
const AZURE_FUNCTION_URL = import.meta.env.PROD ? 
  'https://github-auth-function-20556.azurewebsites.net/api/githubauth' : 
  'http://localhost:7071/api/githubauth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    login: string;
    avatar_url: string;
    name: string | null;
  } | null;
  login: () => void;
  logout: () => void;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Function to verify token and set user state
  const verifyToken = async (token: string) => {
    try {
      setLoading(true);
      const octokit = new Octokit({ auth: token });
      const { data } = await octokit.users.getAuthenticated();
      
      setUser({
        login: data.login,
        avatar_url: data.avatar_url,
        name: data.name
      });
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      console.error('Invalid token', error);
      // Check if user was previously authenticated
      const wasAuthenticated = isAuthenticated;
      
      // Clear authentication state
      localStorage.removeItem('github-token');
      setUser(null);
      setIsAuthenticated(false);
      
      // Set error message if user was previously authenticated
      if (wasAuthenticated) {
        setAuthError('Your session has expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  // Check for token on component mount
  useEffect(() => {
    const token = localStorage.getItem('github-token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for storage events to detect token changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'github-token' && event.newValue) {
        verifyToken(event.newValue);
      } else if (event.key === 'github-token' && !event.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for custom auth token update event from the same window
  useEffect(() => {
    const handleAuthTokenUpdated = (event: CustomEvent) => {
      if (event.detail && event.detail.token) {
        verifyToken(event.detail.token);
      }
    };

    window.addEventListener('auth-token-updated', handleAuthTokenUpdated as EventListener);
    return () => window.removeEventListener('auth-token-updated', handleAuthTokenUpdated as EventListener);
  }, []);

  // Periodically verify token to check for expiration
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const tokenCheckInterval = setInterval(() => {
      const token = localStorage.getItem('github-token');
      if (token) {
        verifyToken(token);
      }
    }, 15 * 60 * 1000); // Check every 15 minutes
    
    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated]);

  const login = () => {
    // GitHub OAuth flow using Azure Function
    const clientId = 'Ov23lid8MA0Pb0EStu9w'; // GitHub OAuth App client ID from registration
    const redirectUri = encodeURIComponent(`${AZURE_FUNCTION_URL}`);
    const scope = 'read:user';
    
    // Generate a random state parameter to prevent CSRF attacks
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth-state', state);
    
    // Open GitHub authorization URL
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    window.location.href = authUrl;
  };

  const logout = () => {
    localStorage.removeItem('github-token');
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        authError,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 