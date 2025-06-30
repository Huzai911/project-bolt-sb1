import React from 'react';
import { Hash, Folder, Settings, DollarSign, User, LogOut, HelpCircle } from 'lucide-react';
import { Channel } from '../types';

interface SidebarProps {
  channels: Channel[];
  activeChannelId: string | null;
  onChannelSelect: (channelId: string) => void;
  onDashboardSelect: () => void;
  showDashboard: boolean;
  onAccountSelect: () => void;
  onLogout: () => void;
  organizationName?: string;
  onStartTutorial?: () => void;
  hasCompletedTutorial?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  channels,
  activeChannelId,
  onChannelSelect,
  onDashboardSelect,
  showDashboard,
  onAccountSelect,
  onLogout,
  organizationName = "AI Workspace",
  onStartTutorial,
  hasCompletedTutorial
}) => {
  // Group channels by folder
  const channelsByFolder = channels.reduce((acc, channel) => {
    if (!acc[channel.folder]) {
      acc[channel.folder] = [];
    }
    acc[channel.folder].push(channel);
    return acc;
  }, {} as Record<string, Channel[]>);

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col" data-tutorial="sidebar">
      {/* Workspace Header */}
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-lg font-bold">{organizationName}</h1>
        <p className="text-sm text-slate-400">Nate's Command Center</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {/* Dashboard */}
        <button
          onClick={onDashboardSelect}
          className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg mb-4 transition-colors ${
            showDashboard
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Budget Dashboard</span>
        </button>

        {/* Channels by Folder */}
        <div data-tutorial="channel-list">
          {Object.entries(channelsByFolder).map(([folderName, folderChannels]) => (
            <div key={folderName} className="mb-6">
            <div className="flex items-center space-x-2 px-3 py-1 text-slate-400 text-sm font-medium">
              <Folder className="w-4 h-4" />
              <span>{folderName}</span>
            </div>
            <div className="ml-6 space-y-1">
              {folderChannels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel.id)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4" />
                    <span className="text-sm">{channel.name}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400">${channel.budgetRemaining}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-700">
        {/* Tutorial Button */}
        {onStartTutorial && (
          <button 
            onClick={onStartTutorial}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mb-2"
            title={hasCompletedTutorial ? "Restart Tutorial" : "Start Tutorial"}
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">
              {hasCompletedTutorial ? 'Tutorial' : 'Help Tour'}
            </span>
          </button>
        )}
        
        <button 
          onClick={onAccountSelect}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mb-2"
          data-tutorial="account-button"
        >
          <User className="w-4 h-4" />
          <span className="text-sm">Account</span>
        </button>
        <button className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mb-2">
          <Settings className="w-4 h-4" />
          <span className="text-sm">Settings</span>
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;