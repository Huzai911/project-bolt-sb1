import React, { useState, useRef, useEffect } from 'react';
import { useTutorial } from '../hooks/useTutorial';
import { chatTutorialSteps } from '../data/tutorialSteps';
import TutorialTooltip from './TutorialTooltip';
import { Send, Bot } from 'lucide-react';
import { Channel, ChatMessage, Task, ChannelSuggestion } from '../types';
import { chatWithAgent, AgentResponse } from '../services/enhancedAgentChat';

interface ChannelChatProps {
  channel: Channel;
  allChannels: Channel[];
  remainingBudget: number;
  onTaskProposal: (tasks: Task[]) => void;
  onChannelSuggestion: (channels: ChannelSuggestion[]) => void;
  onChatUpdate: (messages: ChatMessage[]) => void;
  containerHeight?: string;
}

const ChannelChat: React.FC<ChannelChatProps> = ({
  channel,
  allChannels,
  remainingBudget,
  onTaskProposal,
  onChannelSuggestion,
  onChatUpdate,
  containerHeight = '400px',
}) => {
  const {
    isActive: isTutorialActive,
    startTutorial,
    completeTutorial,
    skipTutorial,
    hasCompletedBefore
  } = useTutorial('chat');
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(channel.chatHistory || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-start chat tutorial for first-time users
  React.useEffect(() => {
    const isFirstChatVisit = localStorage.getItem('chat_first_visit') !== 'false';
    const hasCompletedChannel = localStorage.getItem('tutorial_channel') === 'completed';
    
    if (isFirstChatVisit && hasCompletedChannel && !hasCompletedBefore && chatHistory.length === 0) {
      setTimeout(() => startTutorial(), 500);
      localStorage.setItem('chat_first_visit', 'false');
    }
  }, [hasCompletedBefore, startTutorial, chatHistory.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    setChatHistory(channel.chatHistory || []);
  }, [channel.chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      senderId: 'user',
      senderName: 'You',
      senderAvatar: '👤',
      content: message,
      timestamp: new Date(),
      type: 'user',
    };

    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);
    onChatUpdate(newChatHistory); // Update immediately to save user message
    setMessage('');
    setIsLoading(true);

    try {
      const response: AgentResponse = await chatWithAgent(
        channel,
        message,
        newChatHistory,
        allChannels,
        remainingBudget
      );

      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        senderId: channel.agent.id,
        senderName: channel.agent.name,
        senderAvatar: channel.agent.avatar,
        content: response.message,
        timestamp: new Date(),
        type: 'agent',
      };

      // Add attachments if there are proposals or suggestions
      if (response.proposedTasks || response.suggestedChannels) {
        agentMessage.attachments = {
          type: response.proposedTasks ? 'task-proposals' : 'channel-suggestions',
          data: response.proposedTasks
        };
      }

      // Handle channel suggestions
      const finalChatHistory = [...newChatHistory, agentMessage];
      setChatHistory(finalChatHistory);
      onChatUpdate(finalChatHistory);

      // Handle task proposals
      if (response.proposedTasks && response.proposedTasks.length > 0) {
        console.log('Proposed tasks received:', response.proposedTasks);
        onTaskProposal(response.proposedTasks);
      }

      // Handle channel suggestions
      if (response.suggestedChannels && response.suggestedChannels.length > 0) {
        agentMessage.attachments = {
          type: 'channel-suggestions',
          data: response.suggestedChannels
        };
        onChannelSuggestion(response.suggestedChannels);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        senderId: channel.agent.id,
        senderName: channel.agent.name,
        senderAvatar: channel.agent.avatar,
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date(),
        type: 'agent',
      };

      const finalChatHistory = [...newChatHistory, errorMessage];
      setChatHistory(finalChatHistory);
      
      // Always update chat first
      onChatUpdate(finalChatHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "What should we focus on next?",
    "Generate 5 tasks for this week",
    "Give me some research tasks",
    "Create content creation tasks",
    "What marketing tasks do we need?",
    "Generate quick wins under $20",
  ];

  return (
    <div className="flex flex-col" style={{ height: containerHeight }} data-tutorial="chat-container">
      {/* Chat Tutorial */}
      <TutorialTooltip
        steps={chatTutorialSteps}
        isActive={isTutorialActive}
        onComplete={completeTutorial}
        onSkip={skipTutorial}
      />

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Start a conversation with {channel.agent.name}</p>
            <div className="flex flex-wrap gap-2 justify-center" data-tutorial="quick-prompts">
              {quickPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(prompt)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm">{msg.senderAvatar}</span>
                <span className="text-xs opacity-75">{msg.senderName}</span>
              </div>
              <p className="text-sm">{msg.content}</p>
              <p className="text-xs opacity-50 mt-1">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">{channel.agent.name} is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {chatHistory.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100" data-tutorial="quick-prompts">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => setMessage(prompt)}
                className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-xs hover:bg-gray-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200" data-tutorial="message-input">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${channel.agent.name}...`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={`px-4 py-2 rounded-lg transition-colors ${
              !message.trim() || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelChat;