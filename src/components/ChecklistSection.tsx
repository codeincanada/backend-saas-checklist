import React from 'react';
import { useChecklist } from '../contexts/ChecklistContext';
import { ChecklistSection as ChecklistSectionType } from '../types';
import ChecklistItem from './ChecklistItem';
import { Code2, Rocket, MessageSquare, LineChart, FileText, TestTube, ShieldCheck, Settings } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'Code2': <Code2 />,
  'Rocket': <Rocket />,
  'MessageSquare': <MessageSquare />,
  'LineChart': <LineChart />,
  'FileText': <FileText />,
  'TestTube': <TestTube />,
  'ShieldCheck': <ShieldCheck />,
  'Settings': <Settings />,
};

interface ChecklistSectionProps {
  section: ChecklistSectionType;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ section }) => {
  const { getSectionProgress } = useChecklist();
  const progress = getSectionProgress(section.id);

  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden mb-6 transform transition-all duration-300 hover:shadow-lg"
      data-section-id={section.id}
    >
      <div className={`${section.color}`}>
        <div className="p-4 flex justify-between items-center text-white">
          <div className="flex items-center">
            <div className="p-2 bg-white/20 rounded-lg mr-3">
              {iconMap[section.icon]}
            </div>
            <h3 className="text-xl font-bold tracking-tight">{section.title}</h3>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
        
        <div className="h-2 bg-white/20">
          <div 
            className="h-full bg-white/60 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="p-4 animate-fadeIn">
        {section.items.map((item) => (
          <ChecklistItem 
            key={item.id} 
            item={item} 
            sectionId={section.id} 
          />
        ))}
      </div>
    </div>
  );
};

export default ChecklistSection;