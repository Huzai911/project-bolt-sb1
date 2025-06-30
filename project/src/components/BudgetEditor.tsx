import React, { useState } from 'react';
import { DollarSign, Edit2, Check, X } from 'lucide-react';

interface BudgetEditorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BudgetEditor: React.FC<BudgetEditorProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 10000,
  size = 'md',
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    if (tempValue >= min && tempValue <= max) {
      onChange(tempValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm px-2 py-1';
      case 'lg':
        return 'text-lg px-4 py-3';
      default:
        return 'text-base px-3 py-2';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-xl font-bold';
      default:
        return 'text-base font-medium';
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex items-center space-x-1">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <input
            type="number"
            value={tempValue}
            onChange={(e) => setTempValue(parseInt(e.target.value) || 0)}
            onKeyPress={handleKeyPress}
            min={min}
            max={max}
            className={`border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getSizeClasses()}`}
            autoFocus
          />
        </div>
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
          title="Save"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 group ${className}`}>
      <div className="flex items-center space-x-1">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <span className={`text-gray-900 ${getTextSizeClasses()}`}>
          {value.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
        title={`Edit ${label}`}
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export default BudgetEditor;