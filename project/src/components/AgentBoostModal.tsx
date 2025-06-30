import React, { useState } from 'react';
import { X, Zap, Users, MessageCircle, CreditCard, Loader2, CheckCircle, Brain, Play, Target, Sparkles, Notebook as Robot, Eye, ChevronRight, Settings } from 'lucide-react';
import { Channel } from '../types';
import { agentBoostService } from '../services/agentBoost';
import { aiAutoModeService, AIPromptOption, AIAutoModeResponse } from '../services/aiAutoModeService';

interface AgentBoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChannel: Channel;
  allChannels: Channel[];
  onBoostComplete: (boostId: string) => void;
}

const AgentBoostModal: React.FC<AgentBoostModalProps> = ({
  isOpen,
  onClose,
  currentChannel,
  allChannels,
  onBoostComplete,
}) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [autoPickChannels, setAutoPickChannels] = useState<string[]>([]);
  const [showAutoPickSetup, setShowAutoPickSetup] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [suggestedChannels, setSuggestedChannels] = useState<{channelId: string, reasoning: string, priority: number}[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingAIPrompts, setLoadingAIPrompts] = useState(false);
  const [aiPromptOptions, setAIPromptOptions] = useState<AIPromptOption[]>([]);
  const [selectedPromptOption, setSelectedPromptOption] = useState<string | null>(null);
  const [showPromptOptions, setShowPromptOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'setup' | 'payment' | 'processing' | 'complete'>('setup');
  const [boostId, setBoostId] = useState<string | null>(null);

  const availableChannels = allChannels.filter(channel => channel.id !== currentChannel.id);

  // Load AI suggestions on modal open
  React.useEffect(() => {
    if (isOpen && suggestedChannels.length === 0) {
      loadAISuggestions();
      // Initialize auto-pick channels with all available channels
      setAutoPickChannels(availableChannels.map(c => c.id));
    }
  }, [isOpen]);

  const loadAISuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      // Pass auto-pick channel restrictions to AI
      const suggestions = await agentBoostService.suggestCollaborationChannels(
        currentChannel,
        allChannels,
        userPrompt,
        autoPickChannels
      );
      setSuggestedChannels(suggestions);
      
      // Auto-select top 3 suggestions if in auto mode
      if (autoMode) {
        setSelectedChannels(suggestions.slice(0, 3).map(s => s.channelId));
      }
    } catch (error) {
      console.error('Failed to load AI suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleChannelToggle = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleGenerateAIPrompts = async () => {
    setLoadingAIPrompts(true);
    try {
      const response: AIAutoModeResponse = await aiAutoModeService.generatePromptOptions(
        currentChannel,
        allChannels
      );
      
      setAIPromptOptions(response.promptOptions);
      setShowPromptOptions(true);
      
      // Auto-select recommended channels
      if (response.recommendedChannels.length > 0) {
        setSelectedChannels(response.recommendedChannels);
      }
    } catch (error) {
      console.error('Failed to generate AI prompts:', error);
    } finally {
      setLoadingAIPrompts(false);
    }
  };

  const handleSelectPromptOption = (optionId: string) => {
    const option = aiPromptOptions.find(opt => opt.id === optionId);
    if (option) {
      setUserPrompt(option.prompt);
      setSelectedPromptOption(optionId);
      setShowPromptOptions(false);
    }
  };

  const handleAutoPrompt = () => {
    const autoPrompts = [
      `I've been working on ${currentChannel.description.toLowerCase()} and want to share insights with other departments to see what they're working on and how we might collaborate.`,
      `Our recent work in ${currentChannel.name} has uncovered some interesting patterns. I'd like to connect with other teams to share findings and gather their perspectives.`,
      `I'm looking to optimize our ${currentChannel.description.toLowerCase()} workflows and would value input from other departments about their processes and challenges.`,
      `We've been testing new approaches in ${currentChannel.name} and want to share results while learning from other teams' recent successes.`,
    ];
    
    const randomPrompt = autoPrompts[Math.floor(Math.random() * autoPrompts.length)];
    setUserPrompt(randomPrompt);
  };

  const handleAutoPick = () => {
    if (suggestedChannels.length > 0 && autoPickChannels.length > 0) {
      // Only pick from pre-approved channels
      const filteredSuggestions = suggestedChannels.filter(s => 
        autoPickChannels.includes(s.channelId)
      );
      const topSuggestions = filteredSuggestions.slice(0, Math.min(5, filteredSuggestions.length));
      setSelectedChannels(topSuggestions.map(s => s.channelId));
    } else if (autoPickChannels.length > 0) {
      // If no AI suggestions yet, pick from auto-pick channels
      setSelectedChannels(autoPickChannels.slice(0, 5));
    }
  };

  const handleAutoPickChannelToggle = (channelId: string) => {
    setAutoPickChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSelectAllAutoPickChannels = () => {
    setAutoPickChannels(availableChannels.map(c => c.id));
  };

  const handleClearAllAutoPickChannels = () => {
    setAutoPickChannels([]);
  };

  const handlePurchaseBoost = async () => {
    if (selectedChannels.length === 0 || !userPrompt.trim()) return;

    // Validate that selected channels exist in the system
    const validSelectedChannels = selectedChannels.filter(channelId => 
      allChannels.some(c => c.id === channelId)
    );

    if (validSelectedChannels.length === 0) {
      alert('No valid channels selected. Please select channels that exist in the system.');
      return;
    }

    if (validSelectedChannels.length !== selectedChannels.length) {
      console.warn('Some selected channels were invalid and filtered out');
      setSelectedChannels(validSelectedChannels);
    }

    // Calculate total cost including AI Auto Mode
    const baseCost = 0.99;
    const autoModeCost = autoMode ? aiAutoModeService.getAutoModeCost() : 0;
    const totalCost = baseCost + autoModeCost;

    setLoading(true);
    try {
      const result = await agentBoostService.purchaseBoost(
        currentChannel.id,
        validSelectedChannels,
        userPrompt,
        autoMode,
        suggestedChannels.map(s => s.channelId)
      );

      if (result.success && result.boostId) {
        setBoostId(result.boostId);
        setStep('payment');
        
        // Simulate payment for demo (in production, redirect to Stripe)
        setTimeout(() => {
          handlePaymentComplete(result.boostId!);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to purchase boost:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = async (boostId: string) => {
    setStep('processing');
    
    try {
      // Confirm payment
      await agentBoostService.confirmBoostPayment(boostId);
      
      // Initiate agent conversations
      const targetChannels = allChannels.filter(c => 
        selectedChannels.includes(c.id) && 
        c.agent && 
        c.agent.name && 
        c.description
      );
      
      if (targetChannels.length === 0) {
        throw new Error('No valid target channels found for conversations');
      }
      
      console.log('AgentBoostModal: Starting conversations with channels:', targetChannels.map(c => ({ id: c.id, name: c.name })));
      
      await agentBoostService.initiateAgentConversations(boostId, currentChannel, targetChannels);
      
      setStep('complete');
      
      // Complete after showing success
      setTimeout(() => {
        onBoostComplete(boostId);
        onClose();
        resetModal();
      }, 3000);
    } catch (error) {
      console.error('Failed to process boost:', error);
      alert('Failed to process boost: ' + (error as Error).message);
      setStep('setup'); // Reset to setup on error
    }
  };

  const resetModal = () => {
    setSelectedChannels([]);
    setUserPrompt('');
    setSuggestedChannels([]);
    setAutoMode(false);
    setStep('setup');
    setBoostId(null);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {step === 'setup' && (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Agent Collaboration Boost</h2>
                    <p className="text-gray-600">Connect {currentChannel.agent.name} with other agents</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Auto Mode Toggle */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">AI Auto Mode</h3>
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full font-medium">
                      +$0.99
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoMode}
                      onChange={(e) => setAutoMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  AI analyzes your channel context and generates optimal conversation prompts with strategic channel recommendations.
                </p>
                
                {autoMode && (
                  <div className="space-y-2">
                    {/* Robot Peeking Animation */}
                    <div className="relative bg-white rounded-lg p-3 border border-purple-200 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center animate-bounce">
                            <Robot className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-purple-900">AI is analyzing your workspace...</p>
                          <p className="text-xs text-purple-700">Preparing contextual prompts and channel recommendations</p>
                        </div>
                        <Eye className="w-5 h-5 text-purple-600 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleGenerateAIPrompts}
                        disabled={loadingAIPrompts}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors disabled:bg-purple-300"
                      >
                        {loadingAIPrompts ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>AI Prompts</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => setShowAutoPickSetup(!showAutoPickSetup)}
                        className="flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        <Settings className="w-3 h-3" />
                        <span>Setup</span>
                      </button>
                    </div>
                    
                    {/* Auto Pick Setup */}
                    {showAutoPickSetup && (
                      <div className="mt-4 p-4 bg-white border border-purple-300 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-purple-900">Auto Pick Channel Selection</h4>
                          <div className="flex space-x-1">
                            <button
                              onClick={handleSelectAllAutoPickChannels}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            >
                              All
                            </button>
                            <button
                              onClick={handleClearAllAutoPickChannels}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            >
                              None
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-purple-700 mb-3">
                          Choose which channels Auto Pick can select from ({autoPickChannels.length} selected):
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                          {availableChannels.map((channel) => (
                            <div
                              key={channel.id}
                              onClick={() => handleAutoPickChannelToggle(channel.id)}
                              className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                                autoPickChannels.includes(channel.id)
                                  ? 'bg-purple-100 border border-purple-300'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                autoPickChannels.includes(channel.id)
                                  ? 'bg-purple-600 border-purple-600'
                                  : 'border-gray-300'
                              }`}>
                                {autoPickChannels.includes(channel.id) && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-lg">{channel.agent.avatar}</span>
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{channel.agent.name}</span>
                                <span className="text-xs text-gray-500 ml-2">#{channel.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <button
                            onClick={handleAutoPick}
                            disabled={autoPickChannels.length === 0}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              autoPickChannels.length === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            <Target className="w-3 h-3" />
                            <span>Auto Pick Now</span>
                          </button>
                          
                          <button
                            onClick={() => setShowAutoPickSetup(false)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AI Prompt Options Modal */}
              {showPromptOptions && aiPromptOptions.length > 0 && (
                <div className="mb-6 bg-white border-2 border-purple-300 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Choose Your AI-Generated Prompt</h3>
                    </div>
                    <button
                      onClick={() => setShowPromptOptions(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {aiPromptOptions.map((option, index) => (
                      <div
                        key={option.id}
                        onClick={() => handleSelectPromptOption(option.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedPromptOption === option.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {index + 1}
                              </span>
                              <h4 className="font-medium text-gray-900">{option.title}</h4>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                {option.focusArea}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 ml-2" />
                        </div>
                        
                        <div className="bg-white rounded-lg p-3 mb-3 border border-gray-100">
                          <p className="text-sm text-gray-800 italic">"{option.prompt}"</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-gray-500">Expected outcomes:</span>
                          {option.expectedOutcomes.slice(0, 2).map((outcome, i) => (
                            <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {outcome}
                            </span>
                          ))}
                          {option.expectedOutcomes.length > 2 && (
                            <span className="text-xs text-gray-500">+{option.expectedOutcomes.length - 2} more</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-800">
                      💡 These prompts are strategically crafted based on your channel's context and the available collaboration opportunities.
                    </p>
                  </div>
                </div>
              )}

              {/* Context Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What context should {currentChannel.agent.name} share?
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., We've recently been testing static image ads and found they perform 40% better than video ads. The data shows mobile users prefer quick, clear visuals..."
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This context will help {currentChannel.agent.name} start meaningful conversations with other agents.
                </p>
              </div>

              {/* Channel Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Select channels to collaborate with ({selectedChannels.length} selected)
                  </label>
                  <div className="flex items-center space-x-2">
                    {autoMode && autoPickChannels.length < availableChannels.length && (
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        Auto Pick: {autoPickChannels.length}/{availableChannels.length} channels
                      </span>
                    )}
                  {loadingSuggestions && (
                    <div className="flex items-center space-x-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI analyzing...</span>
                    </div>
                  )}
                  </div>
                </div>

                {/* AI Suggestions */}
                {suggestedChannels.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center space-x-1">
                      <Brain className="w-4 h-4" />
                      <span>AI Recommended Collaborations</span>
                    </h4>
                    <div className="space-y-2">
                      {suggestedChannels.slice(0, 3).map((suggestion, index) => {
                        const channel = allChannels.find(c => c.id === suggestion.channelId);
                        return (
                          <div key={suggestion.channelId} className="flex items-center space-x-2 text-sm">
                            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="font-medium">{channel?.agent.name}</span>
                            <span className="text-gray-600">- {suggestion.reasoning}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-1 mb-4">
                  <p className="text-sm font-medium text-gray-700">Available Channels in Your Workspace:</p>
                  <p className="text-xs text-gray-500">
                    Showing {availableChannels.length} channels from your current workspace
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto border rounded-lg p-2">
                  {availableChannels.map((channel) => {
                    const suggestion = suggestedChannels.find(s => s.channelId === channel.id);
                    const isRecommended = suggestion && suggestion.priority <= 3;
                    const isAutoPickEligible = autoPickChannels.includes(channel.id);
                    
                    return (
                      <div
                        key={channel.id}
                        onClick={() => handleChannelToggle(channel.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                          selectedChannels.includes(channel.id)
                            ? 'border-blue-500 bg-blue-50'
                            : isRecommended
                            ? 'border-purple-300 bg-purple-25 hover:border-purple-400'
                            : 'border-gray-200 hover:border-blue-300'
                        } ${!isAutoPickEligible && autoMode ? 'opacity-60' : ''}`}
                      >
                        {/* Auto Pick Indicator */}
                        {autoMode && !isAutoPickEligible && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                              Not in Auto Pick
                            </span>
                          </div>
                        )}
                        
                        {isRecommended && (
                          <div className="absolute top-2 right-2">
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                              AI Pick #{suggestion.priority}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl" title={`${channel.agent.name} - ${channel.agent.role}`}>
                            {channel.agent.avatar}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-900">{channel.agent.name}</h3>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                #{channel.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{channel.agent.role}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{channel.description}</p>
                            
                            {/* Show current channel stats */}
                            <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                              <span>${channel.budgetRemaining} budget</span>
                              <span>{channel.tasks?.length || 0} tasks</span>
                              <span className="capitalize">{channel.folder} dept</span>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 ${
                            selectedChannels.includes(channel.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedChannels.includes(channel.id) && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                        </div>
                        
                        {/* Auto Pick Status */}
                        {autoMode && (
                          <div className="mt-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${
                              isAutoPickEligible 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isAutoPickEligible ? '✓ Auto Pick Eligible' : '✗ Not in Auto Pick'}
                            </span>
                          </div>
                        )}
                        
                        {suggestion && (
                          <div className="mt-2 text-xs text-purple-700 bg-purple-100 rounded p-2">
                            💡 {suggestion.reasoning}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected Channels Summary */}
                {selectedChannels.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Selected for Collaboration:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedChannels.map(channelId => {
                        const channel = availableChannels.find(c => c.id === channelId);
                        return channel ? (
                          <div key={channelId} className="flex items-center space-x-2 px-3 py-1 bg-white border border-blue-300 rounded-lg text-sm">
                            <span>{channel.agent.avatar}</span>
                            <span className="font-medium">{channel.agent.name}</span>
                            <span className="text-gray-500">#{channel.name}</span>
                            <button
                              onClick={() => handleChannelToggle(channelId)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Remove from selection"
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Boost Details */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">What happens next?</h3>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <strong>{currentChannel.agent.name}</strong> will reach out to <strong>{selectedChannels.length} selected channel{selectedChannels.length !== 1 ? 's' : ''}</strong>:
                  </div>
                  <div className="ml-4 space-y-1 text-sm text-gray-600">
                    {selectedChannels.slice(0, 3).map(channelId => {
                      const channel = availableChannels.find(c => c.id === channelId);
                      return channel ? (
                        <div key={channelId} className="flex items-center space-x-2">
                          <span className="text-base">{channel.agent.avatar}</span>
                          <span>{channel.agent.name} (#{channel.name})</span>
                        </div>
                      ) : null;
                    })}
                    {selectedChannels.length > 3 && (
                      <div className="text-gray-500">+ {selectedChannels.length - 3} more channels</div>
                    )}
                  </div>
                  <ul className="text-sm text-gray-700 space-y-1 mt-3">
                    <li>• Each agent will share insights and ask about their department's progress</li>
                    <li>• Agents may generate new tasks based on conversation insights</li>
                    <li>• You'll see all conversations and can export the results</li>
                    <li>• Conversations typically generate 5-10 valuable insights per agent</li>
                  </ul>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Base Boost Cost</h3>
                      <p className="text-sm text-gray-600">Agent collaboration session</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">$0.99</div>
                    </div>
                  </div>
                  
                  {autoMode && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div>
                        <h3 className="font-medium text-purple-900">AI Auto Mode</h3>
                        <p className="text-sm text-purple-600">Strategic prompt generation</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-900">+$0.99</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t-2 border-gray-300">
                  <div>
                      <h3 className="font-bold text-gray-900">Total Cost</h3>
                      <p className="text-sm text-gray-600">Complete session</p>
                  </div>
                  <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${(0.99 + (autoMode ? 0.99 : 0)).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">one-time payment</div>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={handlePurchaseBoost}
                disabled={selectedChannels.length === 0 || !userPrompt.trim() || loading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
                  selectedChannels.length === 0 || !userPrompt.trim() || loading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Setting up boost...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Purchase Boost - ${(0.99 + (autoMode ? 0.99 : 0)).toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 'payment' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
            <p className="text-gray-600 mb-4">
              Securely processing your ${(0.99 + (autoMode ? 0.99 : 0)).toFixed(2)} boost payment...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connecting Agents</h3>
            <p className="text-gray-600 mb-4">
              {currentChannel.agent.name} is reaching out to {selectedChannels.length} agents...
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Boost Complete!</h3>
            <p className="text-gray-600 mb-4">
              Agents have connected and shared insights. Check the conversations tab to see the results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentBoostModal;