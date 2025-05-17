import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Octokit } from '@octokit/rest';

// Define the Azure Function URL with the actual deployment URL
const AZURE_FUNCTION_URL = 'https://github-auth-function-20556.azurewebsites.net/api/githubauth';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check if token exists in localStorage and verify it
    const token = localStorage.getItem('github-token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

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
    } catch (error) {
      console.error('Invalid token', error);
      localStorage.removeItem('github-token');
    } finally {
      setLoading(false);
    }
  };

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
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading
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