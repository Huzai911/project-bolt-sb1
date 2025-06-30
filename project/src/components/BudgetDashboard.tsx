import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Settings, Plus, X, Edit2 } from 'lucide-react';
import { Channel, BudgetAllocation, ChannelSuggestion } from '../types';
import GlobalChannelCreator from './GlobalChannelCreator';
import BudgetEditor from './BudgetEditor';
import ToolsManager from './ToolsManager';

interface BudgetDashboardProps {
  monthlyBudget: number;
  channels: Channel[];
  onBudgetChange: (newBudget: number) => void;
  onChannelBudgetChange: (channelId: string, newBudget: number) => void;
  onChannelCreate: (suggestion: ChannelSuggestion) => void;
}

const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  monthlyBudget,
  channels,
  onBudgetChange,
  onChannelBudgetChange,
  onChannelCreate,
}) => {
  const [showToolsManager, setShowToolsManager] = React.useState(false);
  
  const totalAllocated = channels.reduce((sum, channel) => sum + channel.budgetAllocated, 0);
  const totalSpent = channels.reduce((sum, channel) => sum + channel.budgetSpent, 0);
  const totalRemaining = monthlyBudget - totalSpent;
  const unallocated = monthlyBudget - totalAllocated;

  const budgetAllocations: BudgetAllocation[] = channels.map(channel => ({
    channelId: channel.id,
    channelName: channel.name,
    allocated: channel.budgetAllocated || 0,
    spent: channel.budgetSpent || 0,
    remaining: (channel.budgetAllocated || 0) - (channel.budgetSpent || 0),
    percentage: monthlyBudget > 0 ? ((channel.budgetAllocated || 0) / monthlyBudget) * 100 : 0,
  }));

  const getBudgetStatus = (spent: number, allocated: number) => {
    if (allocated === 0) return 'good';
    const percentage = (spent / allocated) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'danger': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Budget Dashboard</h1>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" data-tutorial="budget-cards">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Budget</p>
                <p className="text-2xl font-bold text-gray-900">${monthlyBudget}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">${totalSpent}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-gray-900">${totalRemaining}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unallocated</p>
                <p className="text-2xl font-bold text-gray-900">${unallocated}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${unallocated < 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* Budget Control */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6" data-tutorial="budget-control">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Budget Control</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Monthly Budget:</span>
              <BudgetEditor
                label="Monthly Budget"
                value={monthlyBudget}
                onChange={onBudgetChange}
                min={100}
                max={10000}
                size="lg"
              />
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={monthlyBudget}
                onChange={(e) => onBudgetChange(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Slide or type to adjust your monthly AI workspace budget
          </div>
        </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6" data-tutorial="tools-manager">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Tools & Systems</h2>
              <button
                onClick={() => setShowToolsManager(!showToolsManager)}
                className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Manage Tools</span>
              </button>
            </div>
            
            {showToolsManager ? (
              <ToolsManager onClose={() => setShowToolsManager(false)} />
            ) : (
              <div className="text-sm text-gray-600">
                <p className="mb-2">AI automation suggestions will be tailored to your existing tools.</p>
                <p className="text-xs text-gray-500">Click "Manage Tools" to add your current software and platforms.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Channel Creator */}
        <div className="mb-8">
          <div data-tutorial="channel-creator">
            <GlobalChannelCreator
            existingChannels={channels}
            remainingBudget={totalRemaining}
            onChannelCreate={onChannelCreate}
          />
          </div>
        </div>

        {/* Channel Budget Allocation */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Channel Budget Allocation</h2>
          <div className="space-y-4">
            {budgetAllocations.map((allocation) => {
              const status = getBudgetStatus(allocation.spent, allocation.allocated);
              const spentPercentage = (allocation.spent / allocation.allocated) * 100;
              
              return (
                <div key={allocation.channelId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">#{allocation.channelName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {spentPercentage.toFixed(0)}% used
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        ${allocation.spent} / ${allocation.allocated}
                      </div>
                      <BudgetEditor
                        label="Channel Budget"
                        value={allocation.allocated}
                        onChange={(value) => onChannelBudgetChange(allocation.channelId, value)}
                        min={0}
                        max={monthlyBudget}
                        size="sm"
                      />
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        status === 'danger' ? 'bg-red-600' :
                        status === 'warning' ? 'bg-yellow-600' : 'bg-green-600'
                      }`}
                      style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Spent: ${allocation.spent}</span>
                    <span>Remaining: ${allocation.remaining}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDashboard;