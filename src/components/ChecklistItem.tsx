import React, { useState } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { ChecklistItem as ChecklistItemType } from '../types';
import { Check, Info } from 'lucide-react';

interface ChecklistItemProps {
  item: ChecklistItemType;
  sectionId: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, sectionId }) => {
  const { toggleItem } = useChecklist();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg mb-2 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
      <div className="p-3 flex items-start gap-3">
        <div 
          className={`flex-shrink-0 w-6 h-6 rounded border ${
            item.checked 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300'
          } flex items-center justify-center cursor-pointer transition-colors duration-200`}
          onClick={() => toggleItem(sectionId, item.id)}
        >
          {item.checked && <Check className="h-4 w-4 text-white" />}
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <label 
              className={`text-gray-800 cursor-pointer ${
                item.checked ? 'line-through text-gray-500' : ''
              }`}
              onClick={() => toggleItem(sectionId, item.id)}
            >
              {item.text}
            </label>
            
            {item.description && (
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Info className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {showInfo && item.description && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
              {item.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistItem;