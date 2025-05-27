import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChecklist } from '../contexts/ChecklistContext';
import ChecklistSwitcher from './ChecklistSwitcher';
import LoadingIndicator from './LoadingIndicator';
import ErrorIndicator from './ErrorIndicator';
import ChecklistWorkspace from './ChecklistWorkspace';
import PRInfo from './PRInfo';

const MainContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isLoading, prMetadata } = useChecklist();

  return (
    <main className="py-6 container mx-auto px-4 pb-24">
      {/* Checklists Management */}
      {isAuthenticated && (
        <div className="mb-6 flex justify-end">
          <ChecklistSwitcher />
        </div>
      )}
      
      {/* Loading and Error Indicators */}
      {isLoading && (
        <LoadingIndicator message="Syncing your progress..." />
      )}
      
      <ErrorIndicator />
      
      {/* PR Information */}
      {prMetadata && (
        <PRInfo 
          prUrl={prMetadata.prUrl}
          prTitle={prMetadata.prTitle}
          prNumber={prMetadata.prNumber}
          repository={prMetadata.repository}
        />
      )}
      
      {/* Main Workspace */}
      <ChecklistWorkspace />
    </main>
  );
};

export default MainContent; 