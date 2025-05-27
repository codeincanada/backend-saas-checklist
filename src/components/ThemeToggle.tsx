import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Monitor;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          isDark 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="h-4 w-4" />
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute right-0 mt-2 w-32 rounded-md shadow-lg z-20 ${
            isDark 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  theme === value
                    ? isDark 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-100 text-gray-900'
                    : isDark
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                } ${value === 'light' ? 'rounded-t-md' : ''} ${value === 'system' ? 'rounded-b-md' : ''}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle; 