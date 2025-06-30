import React, { useState, useEffect } from 'react';
import { MessageCircle, Users, Clock, Download, Eye, ChevronRight, Plus, CheckCircle } from 'lucide-react';
import { AgentConversation, agentBoostService } from '../services/agentBoost';
import { Channel } from '../types';

interface AgentConversationsViewerProps {
  channels: Channel[];
  currentChannelId: string;
}

const AgentConversationsViewer: React.FC<AgentConversationsViewerProps> = ({
  channels,
  currentChannelId,
}) => {
  const [conversations, setConversations] = useState<AgentConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<AgentConversation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [currentChannelId]);

  const loadConversations = () => {
    setLoading(true);
    try {
      const boosts = agentBoostService.getActiveBoosts();
      const allConversations = boosts.flatMap(boost => boost.conversations);
      
      // Filter conversations involving current channel
      const relevantConversations = allConversations.filter(
        conv => conv.initiatorChannelId === currentChannelId || conv.targetChannelId === currentChannelId
      );
      
      setConversations(relevantConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelInfo = (channelId: string) => {
    return channels.find(c => c.id === channelId);
  };

  const exportConversation = (conversation: AgentConversation) => {
    const initiatorChannel = getChannelInfo(conversation.initiatorChannelId);
    const targetChannel = getChannelInfo(conversation.targetChannelId);
    
    const exportData = {
      conversation: {
        id: conversation.id,
        initiator: {
          channel: initiatorChannel?.name,
          agent: initiatorChannel?.agent.name,
          role: initiatorChannel?.agent.role,
        },
        target: {
          channel: targetChannel?.name,
          agent: targetChannel?.agent.name,
          role: targetChannel?.agent.role,
        },
        date: conversation.createdAt,
        messages: conversation.messages.map(msg => ({
          from: msg.senderName,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-conversation-${conversation.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Agent Conversations Yet</h3>
        <p className="text-gray-600 mb-4">
          Use the Agent Boost feature to start conversations between AI agents and gather cross-departmental insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Agent Conversations</h3>
        <span className="text-sm text-gray-500">{conversations.length} conversations</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {conversations.map((conversation) => {
          const initiatorChannel = getChannelInfo(conversation.initiatorChannelId);
          const targetChannel = getChannelInfo(conversation.targetChannelId);
          const isInitiator = conversation.initiatorChannelId === currentChannelId;

          return (
            <div
              key={conversation.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{initiatorChannel?.agent.avatar}</span>
                      <span className="font-medium text-gray-900">{initiatorChannel?.agent.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{targetChannel?.agent.avatar}</span>
                      <span className="font-medium text-gray-900">{targetChannel?.agent.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{conversation.messages.length} messages</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{conversation.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Preview of first message */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {conversation.messages[0]?.content}
                    </p>
                  </div>

                  {/* Generated Tasks Indicator */}
                  {conversation.generatedTasks && conversation.generatedTasks.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-1">
                      <Plus className="w-4 h-4" />
                      <span>{conversation.generatedTasks.length} task(s) generated</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedConversation(conversation)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View conversation"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportConversation(conversation)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export conversation"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Agent Conversation</h3>
                </div>
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {selectedConversation.messages.map((message, index) => {
                  const channel = getChannelInfo(
                    (message.senderId || '').includes(selectedConversation.initiatorChannelId?.split('-')[0] || '')
                      ? selectedConversation.initiatorChannelId
                      : selectedConversation.targetChannelId
                  );

                  return (
                    <div key={message.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <span className="text-lg">{message.senderAvatar}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">{message.senderName}</span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Show generated tasks if any */}
              {selectedConversation.generatedTasks && selectedConversation.generatedTasks.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Plus className="w-4 h-4 text-green-600" />
                    <span>Tasks Generated from Conversation</span>
                  </h4>
                  <div className="space-y-3">
                    {selectedConversation.generatedTasks.map((task) => (
                      <div key={task.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 text-sm">{task.title}</h5>
                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>${task.estimatedPay}</span>
                              <span>{task.estimatedTime}</span>
                            </div>
                            {task.reasoning && (
                              <p className="text-xs text-green-700 mt-2 italic">💡 {task.reasoning}</p>
                            )}
                          </div>
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentConversationsViewer;