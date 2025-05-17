// This function handles the OAuth callback response
export const handleAuthCallback = () => {
  const query = new URLSearchParams(window.location.search);
  const token = query.get('token');
  
  if (token) {
    // Store the token
    localStorage.setItem('github-token', token);
    
    // Dispatch a custom event to notify components that authentication state changed
    window.dispatchEvent(new CustomEvent('auth-token-updated', { detail: { token } }));
    
    // Clear the URL to remove the token parameter
    if (window.history.pushState) {
      const newurl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.pushState({ path: newurl }, '', newurl);
    }
    
    return Promise.resolve(token);
  }

  return Promise.reject(new Error('No token found in URL'));
};

