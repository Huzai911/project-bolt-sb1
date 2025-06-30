import React, { useState } from 'react';
import TutorialTooltip from './components/TutorialTooltip';
import { useTutorial } from './hooks/useTutorial';
import { mainTutorialSteps } from './data/tutorialSteps';
import { authService } from './services/authService';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import BudgetDashboard from './components/BudgetDashboard';
import ChannelView from './components/ChannelView';
import BusinessWizard from './components/BusinessWizard';
import AccountManager from './components/AccountManager';
import { Channel, Task, WorkspaceData, ChannelSuggestion } from './types';
import { generateChannelsFromSuggestions, distributeRemainingBudget } from './utils/channelGenerator';
import { organizationManager, StoredOrganization } from './services/organizationManager';

function App() {
  const {
    isActive: isTutorialActive,
    startTutorial,
    completeTutorial,
    skipTutorial,
    hasCompletedBefore
  } = useTutorial('main');
  
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [currentOrganization, setCurrentOrganization] = useState<StoredOrganization | null>(null);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const [showAccount, setShowAccount] = useState(false);

  // Load organization on component mount
  React.useEffect(() => {
    if (!isAuthenticated) return;
    
    const currentOrgId = organizationManager.getCurrentOrganizationId();
    if (currentOrgId) {
      const organization = organizationManager.getOrganization(currentOrgId);
      if (organization) {
        loadOrganization(organization);
      }
    }
  }, [isAuthenticated]);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setCurrentOrganization(null);
    setWorkspaceData(null);
    setActiveChannelId(null);
    setShowDashboard(true);
    setShowAccount(false);
  };

  const loadOrganization = (organization: StoredOrganization) => {
    setCurrentOrganization(organization);
    
    const workspaceChannels = organization.channels.map(channel => {
      // Ensure channel has all required properties including agent
      // If agent is missing, create a default one
      const agent = channel.agent || {
        name: `${channel.name} Agent`,
        role: channel.description || 'Marketing Assistant',
        avatar: '🤖',
        personality: 'Professional and helpful',
        expertise: [channel.name.toLowerCase()],
      };
      
      // Ensure budget values exist and are valid numbers
      const budgetAllocated = typeof channel.budgetAllocated === 'number' && channel.budgetAllocated > 0 
        ? channel.budgetAllocated 
        : Math.floor(organization.monthlyBudget / organization.channels.length); // Distribute budget evenly if missing
      
      const budgetSpent = typeof channel.budgetSpent === 'number' ? channel.budgetSpent : 0;
      const budgetRemaining = budgetAllocated - budgetSpent;
      
      return {
        ...channel,
        agent,
        budgetAllocated,
        budgetSpent,
        budgetRemaining,
        tasks: channel.tasks || [],
        proposedTasks: channel.proposedTasks || [],
        pinnedMessage: channel.pinnedMessage ?? '',
        chatHistory: (channel.chatHistory || []).map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
      };
    });

    const newWorkspaceData: WorkspaceData = {
      monthlyBudget: organization.monthlyBudget,
      channels: workspaceChannels,
      totalSpent: workspaceChannels.reduce((sum, channel) => sum + channel.budgetSpent, 0),
      totalRemaining: organization.monthlyBudget - workspaceChannels.reduce((sum, channel) => sum + channel.budgetSpent, 0),
    };

    setWorkspaceData(newWorkspaceData);
    organizationManager.setCurrentOrganization(organization.id);
  };

  const handleWizardComplete = (organizationId: string) => {
    const organization = organizationManager.getOrganization(organizationId);
    if (organization) {
      loadOrganization(organization);
    }
  };

  const handleOrganizationSwitch = (organizationId: string) => {
    const organization = organizationManager.getOrganization(organizationId);
    if (organization) {
      loadOrganization(organization);
      setShowAccount(false);
    }
  };

  // Save workspace changes to organization
  const saveWorkspaceToOrganization = (updatedWorkspaceData: WorkspaceData) => {
    if (currentOrganization) {
      organizationManager.updateOrganizationChannels(
        currentOrganization.id,
        updatedWorkspaceData.channels,
        updatedWorkspaceData.totalSpent
      );
      
      // Update current organization reference
      const updatedOrg = organizationManager.getOrganization(currentOrganization.id);
      if (updatedOrg) {
        setCurrentOrganization(updatedOrg);
      }
    }
  };

  const handleBudgetChange = (newBudget: number) => {
    if (!workspaceData || !currentOrganization) return;
    
    const updatedWorkspaceData = {
      ...workspaceData,
      monthlyBudget: newBudget,
      totalRemaining: newBudget - workspaceData.totalSpent,
    };
    
    setWorkspaceData(updatedWorkspaceData);
    organizationManager.updateOrganizationBudget(currentOrganization.id, newBudget);
    
    // Update current organization reference
    const updatedOrg = organizationManager.getOrganization(currentOrganization.id);
    if (updatedOrg) {
      setCurrentOrganization(updatedOrg);
    }
  };

  const handleChannelBudgetChange = (channelId: string, newBudget: number) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel =>
        channel.id === channelId
          ? {
              ...channel,
              budgetAllocated: newBudget,
              budgetRemaining: newBudget - channel.budgetSpent,
            }
          : channel
      ),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    if (!workspaceData) return;

    let updatedTotalSpent = workspaceData.totalSpent;
    const task = workspaceData.channels
      .flatMap(c => c.tasks)
      .find(t => t.id === taskId);

    // If task is being marked as completed, add to spent amount
    if (task && status === 'completed' && task.status !== 'completed') {
      updatedTotalSpent += task.estimatedPay;
    }

    const updatedWorkspaceData = {
      ...workspaceData,
      totalSpent: updatedTotalSpent,
      totalRemaining: workspaceData.monthlyBudget - updatedTotalSpent,
      channels: workspaceData.channels.map(channel => ({
        ...channel,
        tasks: channel.tasks.map(t => {
          if (t.id === taskId) {
            const updatedTask = { ...t, status };
            
            // If task is being marked as completed, add completion date
            if (status === 'completed' && t.status !== 'completed') {
              updatedTask.completedAt = new Date();
            }
            
            return updatedTask;
          }
          return t;
        }),
        // Update channel budget if task was completed
        budgetSpent: channel.tasks.some(t => t.id === taskId) && 
                    task && status === 'completed' && task.status !== 'completed'
          ? channel.budgetSpent + task.estimatedPay
          : channel.budgetSpent,
        budgetRemaining: channel.tasks.some(t => t.id === taskId) && 
                        task && status === 'completed' && task.status !== 'completed'
          ? channel.budgetRemaining - task.estimatedPay
          : channel.budgetRemaining,
      })),
    };

    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleTaskClaim = (taskId: string, claimedBy: string) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel => ({
        ...channel,
        tasks: channel.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'claimed' as Task['status'], claimedBy }
            : task
        ),
      })),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleTaskApprove = (channelId: string, taskId: string) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel => {
        if (channel.id === channelId) {
          const proposedTask = channel.proposedTasks?.find(t => t.id === taskId);
          if (proposedTask) {
            return {
              ...channel,
              tasks: [...channel.tasks, { ...proposedTask, status: 'open' as Task['status'], isProposed: false }],
              proposedTasks: channel.proposedTasks?.filter(t => t.id !== taskId) || [],
            };
          }
        }
        return channel;
      }),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleTaskReject = (channelId: string, taskId: string) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel =>
        channel.id === channelId
          ? {
              ...channel,
              proposedTasks: channel.proposedTasks?.filter(t => t.id !== taskId) || [],
            }
          : channel
      ),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleChannelCreate = (suggestion: ChannelSuggestion) => {
    if (!workspaceData) return;

    const newChannels = generateChannelsFromSuggestions([suggestion]);
    const newChannel = {
      ...newChannels[0],
      proposedTasks: [],
      chatHistory: [],
    };

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: [...workspaceData.channels, newChannel],
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleChatUpdate = (channelId: string, messages: any[]) => {
    if (!workspaceData) return;

    console.log('App: Updating chat for channel:', channelId, 'Messages:', messages.length);

    // Extract task proposals from the latest message
    const latestMessage = messages[messages.length - 1];
    console.log('App: Latest message:', latestMessage?.content?.substring(0, 100) + '...');
    console.log('App: Message attachments:', latestMessage?.attachments);
    
    if (latestMessage?.attachments?.type === 'task-proposals' && latestMessage.attachments.data) {
      const proposedTasks = latestMessage.attachments.data;
      console.log('App: Processing proposed tasks:', proposedTasks.length, 'tasks');
      
      // Add proposed tasks to the channel
      const updatedWorkspaceData = {
        ...workspaceData,
        channels: workspaceData.channels.map(channel => {
          if (channel.id === channelId) {
            console.log('App: Adding proposed tasks to channel:', channel.name, 'Existing proposed tasks:', (channel.proposedTasks || []).length);
            return {
              ...channel,
              proposedTasks: [...(channel.proposedTasks || []), ...proposedTasks],
              chatHistory: messages,
            };
          }
          return channel;
        }),
      };
      
      setWorkspaceData(updatedWorkspaceData);
      saveWorkspaceToOrganization(updatedWorkspaceData);
      console.log('App: Successfully saved proposed tasks to organization');
    } else {
      // Just update chat history without proposed tasks
      const updatedWorkspaceData = {
        ...workspaceData,
        channels: workspaceData.channels.map(channel =>
          channel.id === channelId
            ? { ...channel, chatHistory: messages }
            : channel
        ),
      };
      
      setWorkspaceData(updatedWorkspaceData);
      saveWorkspaceToOrganization(updatedWorkspaceData);
      console.log('App: Updated chat history for channel:', channelId);
    }
  };

  const handleChannelUpdate = (channelId: string, updates: Partial<Channel>) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel =>
        channel.id === channelId
          ? { ...channel, ...updates }
          : channel
      ),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    if (!workspaceData) return;

    const updatedWorkspaceData = {
      ...workspaceData,
      channels: workspaceData.channels.map(channel => ({
        ...channel,
        tasks: channel.tasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates }
            : task
        ),
        proposedTasks: channel.proposedTasks?.map(task =>
          task.id === taskId
            ? { ...task, ...updates }
            : task
        ) || [],
      })),
    };
    
    setWorkspaceData(updatedWorkspaceData);
    saveWorkspaceToOrganization(updatedWorkspaceData);
  };
  const handleChannelSelect = (channelId: string) => {
    console.log('App: Selecting channel:', channelId);
    console.log('App: Available channels:', workspaceData?.channels.map(c => ({ id: c.id, name: c.name })));
    setActiveChannelId(channelId);
    setShowDashboard(false);
  };

  const handleDashboardSelect = () => {
    console.log('App: Selecting dashboard');
    setShowDashboard(true);
    setActiveChannelId(null);
  };

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onAuthSuccess={handleAuthSuccess} />;
  }
  // Show wizard if no current organization
  if (!currentOrganization || !workspaceData) {
    return <BusinessWizard onComplete={handleWizardComplete} />;
  }

  const activeChannel = workspaceData.channels.find(c => c.id === activeChannelId);

  return (
    <div className="min-h-screen bg-gray-100 flex tutorial-welcome">
      {/* Tutorial System */}
      <TutorialTooltip
        steps={mainTutorialSteps}
        isActive={isTutorialActive}
        onComplete={completeTutorial}
        onSkip={skipTutorial}
      />
      
      <Sidebar
        channels={workspaceData.channels}
        activeChannelId={activeChannelId}
        onChannelSelect={handleChannelSelect}
        onDashboardSelect={handleDashboardSelect}
        showDashboard={showDashboard}
        onAccountSelect={() => setShowAccount(true)}
        onLogout={handleLogout}
        organizationName={currentOrganization.name}
        onStartTutorial={startTutorial}
        hasCompletedTutorial={hasCompletedBefore}
      />
      
      {showAccount ? (
        <AccountManager 
          onClose={() => setShowAccount(false)}
          currentOrganization={currentOrganization}
          onOrganizationSwitch={handleOrganizationSwitch}
          onLogout={handleLogout}
          onStartTutorial={startTutorial}
        />
      ) : showDashboard ? (
        <BudgetDashboard
          monthlyBudget={workspaceData.monthlyBudget}
          channels={workspaceData.channels}
          onBudgetChange={handleBudgetChange}
          onChannelBudgetChange={handleChannelBudgetChange}
          onChannelCreate={handleChannelCreate}
        />
      ) : activeChannel ? (
        <ChannelView
          channel={activeChannel}
          allChannels={workspaceData.channels}
          remainingBudget={workspaceData.totalRemaining}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskClaim={handleTaskClaim}
          onTaskApprove={handleTaskApprove}
          onTaskReject={handleTaskReject}
          onChannelCreate={handleChannelCreate}
          onChatUpdate={handleChatUpdate}
          onChannelUpdate={handleChannelUpdate}
          onTaskUpdate={handleTaskUpdate}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Select a channel to get started</p>
        </div>
      )}
    </div>
  );
}

export default App;