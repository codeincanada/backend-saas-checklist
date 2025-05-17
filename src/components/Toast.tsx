import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'success' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  onClose, 
  autoClose = true,
  autoCloseDelay = 5000 
}) => {
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
    info: 'bg-blue-100 border-blue-400 text-blue-800'
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
    info: 'text-blue-500'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full shadow-md rounded-lg border-l-4 p-4 
      ${bgColors[type]} animate-slide-in-right flex items-start`}>
      <div className="mr-3">
        <AlertCircle className={`h-5 w-5 ${iconColors[type]}`} />
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