import React from 'react';
import { GitPullRequest, ExternalLink, Calendar, User, GitBranch } from 'lucide-react';

interface PRInfoProps {
  prUrl?: string;
  prTitle?: string;
  prNumber?: number;
  repository?: string;
  lastUpdatedAt?: string;
}

const PRInfo: React.FC<PRInfoProps> = ({ 
  prUrl, 
  prTitle, 
  prNumber, 
  repository, 
  lastUpdatedAt 
}) => {
  if (!prUrl || !prTitle || !prNumber || !repository) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <GitPullRequest className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 truncate">
              {prTitle}
            </h3>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              title="Open PR in GitHub"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1">
              <GitBranch className="h-3 w-3" />
              <span>{repository}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">#{prNumber}</span>
            </div>
            {lastUpdatedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Updated {formatDate(lastUpdatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRInfo; 