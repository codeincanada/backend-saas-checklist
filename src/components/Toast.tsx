import React, { useEffect } from 'react';
import { AlertCircle, X, CheckCircle, Info as InfoIcon } from 'lucide-react';

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
    database: 'bg-indigo-100 border-indigo-400 text-indigo-800'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    info: 'text-blue-500',
    database: 'text-indigo-500'
  };
  
  // Select the right icon based on message type
  const getIcon = () => {
    if (effectiveType === 'error') return <AlertCircle className={`h-5 w-5 ${iconColors.error}`} />;
    if (effectiveType === 'success') return <CheckCircle className={`h-5 w-5 ${iconColors.success}`} />;
    if (effectiveType === 'database') return <CheckCircle className={`h-5 w-5 ${iconColors.database}`} />;
    if (effectiveType === 'warning') return <AlertCircle className={`h-5 w-5 ${iconColors.warning}`} />;
    return <InfoIcon className={`h-5 w-5 ${iconColors.info}`} />;
  };

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 md:left-auto md:right-4 md:transform-none z-50 max-w-sm w-auto mx-4 shadow-md rounded-lg border-l-4 p-4 
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