import React, { useState } from 'react';
import { Pin, DollarSign, MessageCircle, Edit2, Save, X, StickyNote, Zap, Users } from 'lucide-react';
import { useTutorial } from '../hooks/useTutorial';
import { channelTutorialSteps } from '../data/tutorialSteps';
import TutorialTooltip from './TutorialTooltip';
import ResizableChat from './ResizableChat';
import AgentBoostModal from './AgentBoostModal';
import AgentConversationsViewer from './AgentConversationsViewer';
import { agentBoostService } from '../services/agentBoost';
import { Channel, Task, ChannelSuggestion } from '../types';
import TaskCard from './TaskCard';
import TaskProposalCard from './TaskProposalCard';
import ChannelSuggestionCard from './ChannelSuggestionCard';
import BudgetEditor from './BudgetEditor';

interface ChannelViewProps {
  channel: Channel;
  allChannels: Channel[];
  remainingBudget: number;
  onTaskStatusChange: (taskId: string, status: Task['status']) => void;
  onTaskClaim: (taskId: string, claimedBy: string) => void;
  onTaskApprove: (channelId: string, taskId: string) => void;
  onTaskReject: (channelId: string, taskId: string) => void;
  onChannelCreate: (suggestion: ChannelSuggestion) => void;
  onChatUpdate: (channelId: string, messages: any[]) => void;
  onChannelUpdate?: (channelId: string, updates: Partial<Channel>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

const ChannelView: React.FC<ChannelViewProps> = ({
  channel,
  allChannels,
  remainingBudget,
  onTaskStatusChange,
  onTaskClaim,
  onTaskApprove,
  onTaskReject,
  onChannelCreate,
  onChatUpdate,
  onChannelUpdate,
  onTaskUpdate,
}) => {
  const {
    isActive: isTutorialActive,
    startTutorial,
    completeTutorial,
    skipTutorial,
    hasCompletedBefore
  } = useTutorial('channel');
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [pendingChannelSuggestions, setPendingChannelSuggestions] = useState<ChannelSuggestion[]>([]);
  const [editingChannelNotes, setEditingChannelNotes] = useState(false);
  const [channelNotesValue, setChannelNotesValue] = useState(channel.userNotes || '');

  // Auto-start channel tutorial for first-time users
  React.useEffect(() => {
    const isFirstChannelVisit = localStorage.getItem('channel_first_visit') !== 'false';
    const hasCompletedMain = localStorage.getItem('tutorial_main') === 'completed';
    
    if (isFirstChannelVisit && hasCompletedMain && !hasCompletedBefore) {
      setTimeout(() => startTutorial(), 500);
      localStorage.setItem('channel_first_visit', 'false');
    }
  }, [hasCompletedBefore, startTutorial]);

  // Register for task updates from agent boost
  React.useEffect(() => {
    agentBoostService.onTasksGenerated(channel.id, (newTasks) => {
      console.log('New tasks generated from agent conversation:', newTasks);
      // Add the new tasks as proposed tasks
      newTasks.forEach(task => {
        if (onTaskUpdate) {
          // Add to proposed tasks
          onTaskUpdate(task.id, { status: 'proposed', isProposed: true });
        }
      });
    });
  }, [channel.id, onTaskUpdate]);

  const handleChannelBudgetChange = (newBudget: number) => {
    // This would need to be passed up to the parent App component
    // For now, we'll just log it
    console.log('Channel budget change requested:', newBudget);
  };

  const handleSaveChannelNotes = () => {
    if (onChannelUpdate) {
      onChannelUpdate(channel.id, { userNotes: channelNotesValue });
    }
    setEditingChannelNotes(false);
  };

  const handleCancelChannelNotes = () => {
    setChannelNotesValue(channel.userNotes || '');
    setEditingChannelNotes(false);
  };
  const handleTaskProposal = (proposedTasks: Task[]) => {
    console.log('ChannelView: Received task proposals:', proposedTasks);
    // The onChatUpdate will handle saving these to the organization
  };

  const handleChannelSuggestion = (suggestions: ChannelSuggestion[]) => {
    console.log('ChannelView: Received channel suggestions:', suggestions);
    setPendingChannelSuggestions(prev => [...prev, ...suggestions]);
  };

  const handleApproveChannelSuggestion = (suggestion: ChannelSuggestion) => {
    onChannelCreate(suggestion);
    setPendingChannelSuggestions(prev => prev.filter(s => s.name !== suggestion.name));
  };

  const handleRejectChannelSuggestion = (suggestionId: string) => {
    setPendingChannelSuggestions(prev => prev.filter(s => s.name !== suggestionId));
  };

  const openTasks = channel.tasks.filter(task => task.status === 'open');
  const proposedTasks = channel.proposedTasks || [];
  const activeTasks = channel.tasks.filter(task => ['claimed', 'in-progress', 'submitted'].includes(task.status));
  const completedTasks = channel.tasks.filter(task => task.status === 'completed');

  const getBudgetStatus = () => {
    const percentage = (channel.budgetSpent / channel.budgetAllocated) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Channel Tutorial */}
      <TutorialTooltip
        steps={channelTutorialSteps}
        isActive={isTutorialActive}
        onComplete={completeTutorial}
        onSkip={skipTutorial}
      />
      
      {/* Channel Header */}
      <div className="bg-white border-b border-gray-200" data-tutorial="channel-header">
        {/* Main Header Row */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-3xl">{channel.agent.avatar}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">#{channel.name}</h1>
                <p className="text-gray-600 mt-1">{channel.description}</p>
              </div>
            </div>
            
            {/* Budget Info - Compact on Right */}
            <div className="flex items-center space-x-6" data-tutorial="channel-budget">
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Remaining</div>
                <BudgetEditor
                  label="Budget Remaining"
                  value={channel.budgetRemaining}
                  onChange={handleChannelBudgetChange}
                  min={0}
                  max={channel.budgetAllocated}
                  size="lg"
                  className={getBudgetStatus()}
                />
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Allocated</div>
                <BudgetEditor
                  label="Budget Allocated"
                  value={channel.budgetAllocated}
                  onChange={handleChannelBudgetChange}
                  min={channel.budgetSpent}
                  max={10000}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChat(!showChat)}
                data-tutorial="chat-button"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showChat
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat with {channel.agent.name}</span>
              </button>
              
              <button
                onClick={() => setShowBoostModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>Agent Boost</span>
                <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">$0.99</span>
              </button>
              
              <button
                onClick={() => setShowConversations(!showConversations)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showConversations
                    ? 'bg-purple-600 text-white shadow-lg' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-purple-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Conversations</span>
              </button>
            </div>
            
            {/* Agent Status Indicator */}
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>{channel.agent.name} • Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Notes Section */}
      <div className="bg-white border-b border-gray-200 px-6 py-4" data-tutorial="channel-notes">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <StickyNote className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-medium text-gray-900">Channel Context & Notes</h3>
              <button
                onClick={() => setEditingChannelNotes(!editingChannelNotes)}
                className="p-1 text-gray-400 hover:text-purple-600 rounded transition-colors"
                title="Edit channel notes"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
            
            {editingChannelNotes ? (
              <div className="space-y-2">
                <textarea
                  value={channelNotesValue}
                  onChange={(e) => setChannelNotesValue(e.target.value)}
                  placeholder="Add context about this channel... e.g., 'This channel is where the marketing manager checks in with new strategies from our strategy team, and then AI graphics and freelance graphics work together using the prompts provided.'"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveChannelNotes}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={handleCancelChannelNotes}
                    className="flex items-center space-x-1 px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 italic">
                {channel.userNotes || "Add notes about this channel's workflow, team roles, or special considerations..."}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="p-6">
        {/* Chat Interface */}
        {showChat && (
          <div className="mb-6">
            <ResizableChat
              channel={channel}
              allChannels={allChannels}
              remainingBudget={remainingBudget}
              onTaskProposal={handleTaskProposal}
              onChannelSuggestion={handleChannelSuggestion}
              onChatUpdate={(messages) => onChatUpdate(channel.id, messages)}
              onClose={() => setShowChat(false)}
            />
          </div>
        )}

        {/* Agent Conversations */}
        {showConversations && (
          <div className="mb-6">
            <AgentConversationsViewer
              channels={allChannels}
              currentChannelId={channel.id}
            />
          </div>
        )}

        {/* Channel Suggestions */}
        {pendingChannelSuggestions.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              💡 New Channel Suggestions
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pendingChannelSuggestions.map((suggestion) => (
                <ChannelSuggestionCard
                  key={suggestion.name}
                  suggestion={suggestion}
                  onApprove={handleApproveChannelSuggestion}
                  onReject={handleRejectChannelSuggestion}
                />
              ))}
            </div>
          </div>
        )}

        {/* Task Sections */}
        <div className="space-y-8">
          {/* Proposed Tasks */}
          {proposedTasks.length > 0 && (
            <div data-tutorial="proposed-tasks">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🤖 Proposed Tasks ({proposedTasks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {proposedTasks.map(task => (
                  <TaskProposalCard
                    key={task.id}
                    task={task}
                    onApprove={(taskId) => onTaskApprove(channel.id, taskId)}
                    onReject={(taskId) => onTaskReject(channel.id, taskId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Open Tasks */}
          <div data-tutorial="open-tasks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Open Tasks ({openTasks.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {openTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onTaskStatusChange}
                  onClaim={onTaskClaim}
                  onTaskUpdate={onTaskUpdate}
                />
              ))}
            </div>
          </div>

          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Tasks ({activeTasks.length})
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {activeTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onTaskStatusChange}
                    onClaim={onTaskClaim}
                    onTaskUpdate={onTaskUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Completed Tasks ({completedTasks.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={onTaskStatusChange}
                    onClaim={onTaskClaim}
                    onTaskUpdate={onTaskUpdate}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Agent Boost Modal */}
      <AgentBoostModal
        isOpen={showBoostModal}
        onClose={() => setShowBoostModal(false)}
        currentChannel={channel}
        allChannels={allChannels}
        onBoostComplete={(boostId) => {
          console.log('Boost completed:', boostId);
          setShowConversations(true);
        }}
      />
    </div>
  );
};

export default ChannelView;