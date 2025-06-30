import React, { useState, useRef, useCallback } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import ChannelChat from './ChannelChat';
import { Channel, ChatMessage, Task, ChannelSuggestion } from '../types';

interface ResizableChatProps {
  channel: Channel;
  allChannels: Channel[];
  remainingBudget: number;
  onTaskProposal: (tasks: Task[]) => void;
  onChannelSuggestion: (channels: ChannelSuggestion[]) => void;
  onChatUpdate: (messages: ChatMessage[]) => void;
  onClose: () => void;
}

const ResizableChat: React.FC<ResizableChatProps> = ({
  channel,
  allChannels,
  remainingBudget,
  onTaskProposal,
  onChannelSuggestion,
  onChatUpdate,
  onClose,
}) => {
  const [height, setHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeRef.current) return;

    const rect = resizeRef.current.getBoundingClientRect();
    const newHeight = Math.max(300, Math.min(800, e.clientY - rect.top));
    setHeight(newHeight);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      setHeight(600);
    } else {
      setHeight(400);
    }
  };

  return (
    <div 
      ref={resizeRef}
      className={`bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200 ${
        isMaximized ? 'fixed inset-4 z-50' : 'relative'
      }`}
      style={{ height: isMaximized ? 'calc(100vh - 2rem)' : `${height}px` }}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{channel.agent.avatar}</span>
          <h3 className="font-medium text-gray-900">Chat with {channel.agent.name}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMaximize}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat content */}
      <div className="h-full">
        <ChannelChat
          channel={channel}
          allChannels={allChannels}
          remainingBudget={remainingBudget}
          onTaskProposal={onTaskProposal}
          onChannelSuggestion={onChannelSuggestion}
          onChatUpdate={onChatUpdate}
          containerHeight={isMaximized ? 'calc(100vh - 8rem)' : `${height - 60}px`}
        />
      </div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          onMouseDown={handleMouseDown}
          className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center transition-colors ${
            isResizing ? 'bg-blue-200' : 'hover:bg-gray-200'
          }`}
          title="Drag to resize"
        >
          <div className="w-8 h-1 bg-gray-400 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default ResizableChat;