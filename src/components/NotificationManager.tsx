import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChecklist } from '../contexts/ChecklistContext';
import Toast from './Toast';

const NotificationManager: React.FC = () => {
  const { authError, clearAuthError } = useAuth();
  const { toastMessage, clearToastMessage } = useChecklist();

  const getToastType = (message: string) => {
    if (message.includes('database')) return 'database';
    if (message.includes('Error')) return 'error';
    return 'success';
  };

  return (
    <>
      {authError && (
        <Toast 
          message={authError} 
          type="error" 
          onClose={clearAuthError} 
        />
      )}
      
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={getToastType(toastMessage)} 
          onClose={clearToastMessage} 
        />
      )}
    </>
  );
};

export default NotificationManager; 