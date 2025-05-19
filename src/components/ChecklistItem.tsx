import React, { useState, useEffect, useRef } from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { ChecklistItem as ChecklistItemType } from '../types';
import { Check, Info } from 'lucide-react';

interface ChecklistItemProps {
  item: ChecklistItemType;
  sectionId: string;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ item, sectionId }) => {
  const { toggleItem, nextFocusItemId, setNextFocusItemId, toastMessage } = useChecklist();
  const [showInfo, setShowInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  // Track save operations
  useEffect(() => {
    if (toastMessage?.includes('database')) {
      // Toast message indicates database operation completed
      setIsSaving(false);
    }
  }, [toastMessage]);

  useEffect(() => {
    if (item.id === nextFocusItemId && itemRef.current) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      itemRef.current.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2');
      setTimeout(() => {
        itemRef.current?.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2');
      }, 1500);
      setNextFocusItemId(null);
    }
  }, [item.id, nextFocusItemId, setNextFocusItemId]);

  // Handle item click
  const handleToggle = () => {
    console.log(`Toggling item ${item.id} in section ${sectionId}`);
    setIsSaving(true);
    // This will trigger the API call in toggleItem function to save only this item's status
    toggleItem(sectionId, item.id);
    // The saving state will be reset when the toast message indicates completion
  };

  return (
    <div 
      ref={itemRef} 
      className="border border-gray-200 rounded-lg mb-2 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
      data-item-id={item.id}
    >
      <div className="p-3 flex items-start gap-3">
        <div 
          className={`flex-shrink-0 w-6 h-6 rounded border ${
            item.checked 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-300'
          } flex items-center justify-center cursor-pointer transition-colors duration-200 ${
            isSaving ? 'opacity-70' : ''
          }`}
          onClick={handleToggle}
        >
          {item.checked && <Check className="h-4 w-4 text-white" />}
        </div>
        
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <label 
              className={`text-gray-800 cursor-pointer ${
                item.checked ? 'line-through text-gray-500' : ''
              }`}
              onClick={handleToggle}
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