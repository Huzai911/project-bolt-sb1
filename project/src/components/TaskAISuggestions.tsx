import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, X, ExternalLink, Zap, Bot, Code, Globe, Copy, Check, RefreshCw, Edit2 } from 'lucide-react';
import { Task } from '../types';
import { generateTaskAutomationSuggestions, AISuggestion } from '../services/taskAutomation';

interface TaskAISuggestionsProps {
  task: Task;
  onClose: () => void;
  channelContext?: string;
}

const TaskAISuggestions: React.FC<TaskAISuggestionsProps> = ({ task, onClose, channelContext }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const aiSuggestions = await generateTaskAutomationSuggestions(task, channelContext);
        setSuggestions(aiSuggestions);
      } catch (err) {
        setError('Failed to generate AI suggestions');
        console.error('Error generating AI suggestions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [task, channelContext]);

  const handleRefinesuggestions = async () => {
    if (!refinementPrompt.trim()) return;
    
    try {
      setRefining(true);
      const refinedSuggestions = await generateTaskAutomationSuggestions(
        task, 
        channelContext, 
        refinementPrompt
      );
      setSuggestions(refinedSuggestions);
      setRefinementPrompt('');
      setShowRefinement(false);
    } catch (err) {
      setError('Failed to refine suggestions');
      console.error('Error refining suggestions:', err);
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const getTypeIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'ai-tool':
        return <Bot className="w-4 h-4 text-blue-600" />;
      case 'automation':
        return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'api-integration':
        return <Code className="w-4 h-4 text-green-600" />;
      case 'web-scraping':
        return <Globe className="w-4 h-4 text-purple-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'ai-tool':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'automation':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'api-integration':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'web-scraping':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-gray-900">AI Automation Suggestions</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Analyzing task for automation opportunities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <h4 className="font-medium text-gray-900">AI Automation Suggestions</h4>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRefinement(!showRefinement)}
            className="p-1 text-purple-600 hover:text-purple-800 rounded-full transition-colors"
            title="Refine suggestions"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Refinement Section */}
      {showRefinement && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <h5 className="text-sm font-medium text-purple-900 mb-2">Refine Automation Suggestions</h5>
          <div className="space-y-2">
            <textarea
              value={refinementPrompt}
              onChange={(e) => setRefinementPrompt(e.target.value)}
              placeholder="e.g., 'This could use more wording about creative marketing pain points and emotional ties' or 'Focus on solutions that work with our existing CRM system'"
              className="w-full px-3 py-2 border border-purple-300 rounded text-sm focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleRefinesuggestions}
                disabled={!refinementPrompt.trim() || refining}
                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {refining ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Refining...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Refine</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRefinement(false);
                  setRefinementPrompt('');
                }}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {suggestions.length === 0 ? (
        <p className="text-gray-600 text-sm">No automation suggestions available for this task type.</p>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getTypeColor(suggestion.type)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(suggestion.type)}
                  <h5 className="font-medium text-sm">{suggestion.title}</h5>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                    {suggestion.complexity}
                  </span>
                  <span className="text-xs font-medium">
                    ${suggestion.estimatedCost}
                  </span>
                </div>
              </div>
              
              <p className="text-sm mb-2">{suggestion.description}</p>
              
              <div className="text-xs text-gray-600 mb-2">
                <strong>Steps:</strong> {suggestion.steps.join(' → ')}
              </div>
              
              {suggestion.tools && suggestion.tools.length > 0 && (
                <div className="text-xs text-gray-600 mb-2">
                  <strong>Tools:</strong> {suggestion.tools.join(', ')}
                </div>
              )}
              
              {suggestion.codeSnippet && (
                <div className="mt-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Code Example:</span>
                    <button
                      onClick={() => copyToClipboard(suggestion.codeSnippet!, index)}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                    <code className={`language-${suggestion.codeLanguage || 'javascript'}`}>
                      {suggestion.codeSnippet}
                    </code>
                  </pre>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Saves ~{suggestion.timeSaved} • ${suggestion.costSaved} vs freelancer
                </span>
                {suggestion.actionUrl && (
                  <a
                    href={suggestion.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    <span>Try this</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
          
          <div className="text-xs text-gray-500 pt-2 border-t border-purple-200">
            💡 These suggestions show ways to automate or streamline this task using AI and modern tools.
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskAISuggestions;