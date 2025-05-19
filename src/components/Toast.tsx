import React, { useEffect } from 'react';
import { AlertCircle, X, Save, CheckCircle, Info as InfoIcon } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info' | 'database';
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  onClose, 
  autoClose = true,
  autoCloseDelay = 5000 
}) => {
  // Automatically detect database messages
  const isDatabaseOperation = message.includes('database') || message.includes('saving to database');
  const effectiveType = isDatabaseOperation && type !== 'error' ? 'database' : type;

  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  const bgColors = {
    error: 'bg-red-100 border-red-400 text-red-800',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    success: 'bg-green-100 border-green-400 text-green-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
    database: 'bg-purple-100 border-purple-400 text-purple-800'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    info: 'text-blue-500',
    database: 'text-purple-500'
  };
  
  // Select the right icon based on message type
  const getIcon = () => {
    if (effectiveType === 'error') return <AlertCircle className={`h-5 w-5 ${iconColors.error}`} />;
    if (effectiveType === 'success') return <CheckCircle className={`h-5 w-5 ${iconColors.success}`} />;
    if (effectiveType === 'database') {
      // Show appropriate icon based on operation status
      return message.includes('updated in database') || message.includes('saved to database') 
        ? <CheckCircle className={`h-5 w-5 ${iconColors.database}`} />
        : <Save className={`h-5 w-5 ${iconColors.database} ${message.includes('Saving') ? 'animate-spin' : ''}`} />;
    }
    if (effectiveType === 'warning') return <AlertCircle className={`h-5 w-5 ${iconColors.warning}`} />;
    return <InfoIcon className={`h-5 w-5 ${iconColors.info}`} />;
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-md rounded-lg border-l-4 p-4 
      ${bgColors[effectiveType]} animate-slide-in-right flex items-start`}>
      <div className="mr-3">
        {getIcon()}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {message}
        </p>
      </div>
      <button 
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast; 