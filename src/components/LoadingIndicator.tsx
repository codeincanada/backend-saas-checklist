import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = "Loading...", 
  className = "mb-4 p-2 bg-blue-100 text-blue-800 rounded-md flex items-center" 
}) => {
  return (
    <div className={className}>
      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message}
    </div>
  );
};

export default LoadingIndicator; 