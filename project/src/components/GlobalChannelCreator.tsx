import React, { useState } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { suggestChannelsForNeed } from '../services/enhancedAgentChat';
import { Channel, ChannelSuggestion } from '../types';

interface GlobalChannelCreatorProps {
  existingChannels: Channel[];
  remainingBudget: number;
  onChannelCreate: (suggestion: ChannelSuggestion) => void;
}

const GlobalChannelCreator: React.FC<GlobalChannelCreatorProps> = ({
  existingChannels,
  remainingBudget,
  onChannelCreate,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [need, setNeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChannelSuggestion[]>([]);

  const handleAnalyzeNeed = async () => {
    if (!need.trim()) return;

    setLoading(true);
    try {
      const channelSuggestions = await suggestChannelsForNeed(need, existingChannels, remainingBudget);
      setSuggestions(channelSuggestions);
    } catch (error) {
      console.error('Error analyzing need:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = (suggestion: ChannelSuggestion) => {
    onChannelCreate(suggestion);
    setSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
  };

  const handleDismiss = (suggestionName: string) => {
    setSuggestions(prev => prev.filter(s => s.name !== suggestionName));
  };

  const quickNeeds = [
    "I need more marketing diversity",
    "I need better sales processes", 
    "I need more content creation",
    "I need better customer support",
    "I need more social media presence"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Channel Creator</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Channels</span>
        </button>
      </div>

      {showForm && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you need help with?
            </label>
            <textarea
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              placeholder="Describe what you need more of or what's missing from your current setup..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={3}
            />
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {quickNeeds.map((quickNeed, index) => (
                <button
                  key={index}
                  onClick={() => setNeed(quickNeed)}
                  className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm hover:bg-purple-100 transition-colors"
                >
                  {quickNeed}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyzeNeed}
            disabled={!need.trim() || loading}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              !need.trim() || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </div>
            ) : (
              'Analyze & Suggest Channels'
            )}
          </button>
        </div>
      )}

      {/* Channel Suggestions */}
      {suggestions.length > 0 && (
        <div className="mt-6 space-y-4">
          <h4 className="font-medium text-gray-900">Suggested Channels:</h4>
          {suggestions.map((suggestion) => (
            <div key={suggestion.name} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-medium text-gray-900">#{suggestion.name}</h5>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCreateChannel(suggestion)}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => handleDismiss(suggestion.name)}
                    className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                <strong>Why:</strong> {suggestion.reasoning}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{suggestion.agentName} • {suggestion.folder}</span>
                <span>${suggestion.estimatedBudget} budget</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalChannelCreator;