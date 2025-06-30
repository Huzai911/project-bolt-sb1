import React from 'react';
import { Plus, X, DollarSign } from 'lucide-react';
import { ChannelSuggestion } from '../types';

interface ChannelSuggestionCardProps {
  suggestion: ChannelSuggestion;
  onApprove: (suggestion: ChannelSuggestion) => void;
  onReject: (suggestionId: string) => void;
}

const ChannelSuggestionCard: React.FC<ChannelSuggestionCardProps> = ({
  suggestion,
  onApprove,
  onReject,
}) => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <h4 className="font-medium text-gray-900">New Channel Suggestion</h4>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => onApprove(suggestion)}
            className="p-1 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            title="Create channel"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onReject(suggestion.name)}
            className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
            title="Dismiss suggestion"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <h5 className="font-medium text-sm text-gray-900">#{suggestion.name}</h5>
          <p className="text-sm text-gray-600">{suggestion.description}</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-700 font-medium">Why this channel?</p>
          <p className="text-sm text-gray-600">{suggestion.reasoning}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-green-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{suggestion.agentName}</span> • {suggestion.folder}
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <DollarSign className="w-4 h-4" />
            <span>${suggestion.estimatedBudget}</span>
          </div>
        </div>

        {suggestion.initialTasks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-green-200">
            <p className="text-xs text-gray-500 mb-1">Initial tasks ({suggestion.initialTasks.length}):</p>
            <div className="space-y-1">
              {suggestion.initialTasks.slice(0, 2).map((task, index) => (
                <div key={index} className="text-xs text-gray-600">
                  • {task.title} (${task.estimatedPay})
                </div>
              ))}
              {suggestion.initialTasks.length > 2 && (
                <div className="text-xs text-gray-500">
                  + {suggestion.initialTasks.length - 2} more tasks
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSuggestionCard;