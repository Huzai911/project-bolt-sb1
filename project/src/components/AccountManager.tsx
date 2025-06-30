import React, { useState, useEffect } from 'react';
import { User, DollarSign, Coins, Activity, Download, Trash2, TrendingUp, BarChart3, Calendar, Clock, Slack, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Plus, Users, Building, Crown, Shield, UserPlus, Settings, Mail, Clock3, Edit, Save, X, Share, LogOut, HelpCircle, CalendarDays } from 'lucide-react';
import { tokenTracker, DailyUsage } from '../services/tokenTracker';
import { organizationManager, StoredOrganization } from '../services/organizationManager';
import { authService } from '../services/authService';
import { Organization, OrganizationMember, InvitePendingMember } from '../types';
import OrganizationCalendar from './OrganizationCalendar';
import TaskDetailModal from './TaskDetailModal';
import { Task } from '../types';

interface AccountManagerProps {
  onClose: () => void;
  currentOrganization?: StoredOrganization;
  onOrganizationSwitch?: (organizationId: string) => void;
  onLogout?: () => void;
  onStartTutorial?: () => void;
}

interface UserAccount {
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  isVerified: boolean;
}

interface SlackIntegration {
  connected: boolean;
  workspaceName?: string;
  channels?: Array<{
    id: string;
    name: string;
    memberCount: number;
    lastActivity: Date;
    mapped: boolean;
    aiChannelId?: string;
  }>;
  lastSync?: Date;
}

interface OrganizationData {
  currentOrg: Organization | null;
  ownedOrgs: Organization[];
  memberOrgs: Organization[];
  pendingInvites: InvitePendingMember[];
}

const AccountManager: React.FC<AccountManagerProps> = ({ 
  onClose, 
  currentOrganization,
  onOrganizationSwitch,
  onLogout,
  onStartTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'calendar' | 'integrations' | 'billing'>('overview');
  const [organizations, setOrganizations] = useState<StoredOrganization[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [account, setAccount] = useState<UserAccount>({
    email: authService.getCurrentUser()?.email || 'user@example.com',
    name: authService.getCurrentUser()?.name || 'Demo User',
    plan: 'free',
    credits: 2500,
    isVerified: true
  });
  
  const [monthlyStats, setMonthlyStats] = useState({
    cost: 0,
    workspaceTokens: 0
  });
  
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalCost: 0,
    totalTokens: 0,
    weeklyTokens: 0,
    weeklyCost: 0
  });

  const [slackIntegration, setSlackIntegration] = useState<SlackIntegration>({
    connected: false,
    workspaceName: undefined,
    channels: [],
    lastSync: undefined
  });
  
  const [showSlackChannels, setShowSlackChannels] = useState(false);
  
  // Organization state
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    currentOrg: null,
    ownedOrgs: [],
    memberOrgs: [],
    pendingInvites: []
  });
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationMember['role']>('member');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  useEffect(() => {
    // Update account info from auth service
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setAccount(prev => ({
        ...prev,
        email: currentUser.email,
        name: currentUser.name
      }));
    }
    
    // Load organizations
    const orgs = organizationManager.getOrganizations();
    setOrganizations(orgs);
    
    // Load usage stats
    const monthlyCost = tokenTracker.getCurrentMonthCost();
    const monthlyTokens = tokenTracker.getTotalTokens(30);
    const weeklyTokens = tokenTracker.getTotalTokens(7);
    const weeklyCost = tokenTracker.getTotalCost(7);
    const totalCost = tokenTracker.getTotalCost(365);
    const totalTokens = tokenTracker.getTotalTokens(365);
    const daily = tokenTracker.getDailyUsage(7);
    
    setMonthlyStats({
      cost: monthlyCost,
      workspaceTokens: monthlyTokens
    });
    
    setDailyUsage(daily);
    
    setTotalStats({
      totalCost,
      totalTokens,
      weeklyTokens,
      weeklyCost
    });
  }, []);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    // Update task in organization
    if (currentOrganization) {
      const updatedChannels = currentOrganization.channels.map(channel => ({
        ...channel,
        tasks: channel.tasks.map(task =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      }));
      
      organizationManager.updateOrganizationChannels(
        currentOrganization.id,
        updatedChannels,
        currentOrganization.totalSpent
      );
      
      // Reload organizations to reflect changes
      const orgs = organizationManager.getOrganizations();
      setOrganizations(orgs);
      
      // Update selected task
      setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleTaskStatusChange = (taskId: string, status: Task['status']) => {
    // In a real app, this would calculate budget changes based on status
    handleTaskUpdate(taskId, { status });
  };

  const handleSwitchOrganization = (orgId: string) => {
    if (onOrganizationSwitch) {
      onOrganizationSwitch(orgId);
    }
  };

  const handleDeleteOrganization = (orgId: string) => {
    if (confirm('Are you sure you want to delete this organization? This cannot be undone.')) {
      organizationManager.deleteOrganization(orgId);
      setOrganizations(organizationManager.getOrganizations());
    }
  };

  // Mock organization data for demo
  useEffect(() => {
    const mockCurrentOrg: Organization = {
      id: 'org-1',
      name: "Nate's AI Workspace",
      description: 'Main workspace for AI-driven business automation',
      createdAt: new Date('2025-01-01'),
      ownerId: 'user-123',
      plan: 'team',
      channels: ['metaads', 'kickstarter', 'advisuals'],
      messageHistory: [],
      settings: {
        allowGuestAccess: true,
        requireApprovalForInvites: false,
        messageRetentionDays: 90,
        allowExternalIntegrations: true,
        defaultChannelPermissions: 'open'
      },
      members: [
        {
          id: 'user-123',
          email: 'nate@company.com',
          name: 'Nate (You)',
          role: 'owner',
          joinedAt: new Date('2025-01-01'),
          lastActive: new Date(),
          permissions: {
            canCreateChannels: true,
            canInviteMembers: true,
            canManageBudget: true,
            canAccessAllChannels: true
          },
          channelAccess: ['metaads', 'kickstarter', 'advisuals']
        },
        {
          id: 'user-124',
          email: 'sarah@company.com',
          name: 'Sarah Martinez',
          role: 'admin',
          joinedAt: new Date('2025-01-05'),
          lastActive: new Date(Date.now() - 3600000),
          permissions: {
            canCreateChannels: true,
            canInviteMembers: true,
            canManageBudget: false,
            canAccessAllChannels: true
          },
          channelAccess: ['metaads', 'kickstarter', 'advisuals']
        },
        {
          id: 'user-125',
          email: 'mike@company.com',
          name: 'Mike Chen',
          role: 'member',
          joinedAt: new Date('2025-01-10'),
          lastActive: new Date(Date.now() - 7200000),
          permissions: {
            canCreateChannels: false,
            canInviteMembers: false,
            canManageBudget: false,
            canAccessAllChannels: false
          },
          channelAccess: ['metaads', 'advisuals']
        }
      ]
    };

    const mockPendingInvites: InvitePendingMember[] = [
      {
        id: 'invite-1',
        email: 'jane@freelancer.com',
        role: 'member',
        invitedBy: 'user-123',
        invitedAt: new Date(Date.now() - 86400000),
        expiresAt: new Date(Date.now() + 6 * 86400000),
        channelAccess: ['kickstarter']
      }
    ];

    setOrganizationData({
      currentOrg: mockCurrentOrg,
      ownedOrgs: [mockCurrentOrg],
      memberOrgs: [],
      pendingInvites: mockPendingInvites
    });
  }, []);

  // Mock Slack data for demo
  const mockSlackChannels = [
    { id: 'C1234', name: 'marketing', memberCount: 12, lastActivity: new Date(), mapped: false },
    { id: 'C1235', name: 'product-updates', memberCount: 8, lastActivity: new Date(), mapped: false },
    { id: 'C1236', name: 'sales-team', memberCount: 15, lastActivity: new Date(), mapped: true, aiChannelId: 'sales-automation' },
    { id: 'C1237', name: 'design-feedback', memberCount: 6, lastActivity: new Date(), mapped: false },
    { id: 'C1238', name: 'content-creation', memberCount: 10, lastActivity: new Date(), mapped: true, aiChannelId: 'content-strategy' },
  ];

  const addTokens = (amount: number) => {
    setAccount(prev => ({
      ...prev,
      credits: prev.credits + amount
    }));
  };

  const tokenPackages = [
    { amount: 1000, price: 1.00, popular: false },
    { amount: 5000, price: 4.50, popular: true },
    { amount: 10000, price: 8.00, popular: false },
    { amount: 25000, price: 18.75, popular: false }
  ];

  const exportData = () => {
    const data = tokenTracker.exportUsageData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workspace-usage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearUsage = () => {
    if (confirm('Are you sure you want to clear all usage data? This cannot be undone.')) {
      tokenTracker.clearUsage();
      window.location.reload();
    }
  };

  const connectSlack = () => {
    // Mock Slack connection for demo
    setSlackIntegration({
      connected: true,
      workspaceName: "Nate's Company",
      channels: mockSlackChannels,
      lastSync: new Date()
    });
  };

  const disconnectSlack = () => {
    setSlackIntegration({
      connected: false,
      workspaceName: undefined,
      channels: [],
      lastSync: undefined
    });
  };

  const syncSlackData = () => {
    // Mock sync action
    setSlackIntegration(prev => ({
      ...prev,
      lastSync: new Date()
    }));
  };

  const mapSlackChannel = (slackChannelId: string, aiChannelName: string) => {
    setSlackIntegration(prev => ({
      ...prev,
      channels: prev.channels?.map(channel =>
        channel.id === slackChannelId
          ? { ...channel, mapped: true, aiChannelId: aiChannelName }
          : channel
      )
    }));
  };

  const createOrganization = () => {
    if (!newOrgName.trim()) return;
    
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      name: newOrgName,
      description: newOrgDescription,
      createdAt: new Date(),
      ownerId: 'user-123',
      plan: 'free',
      channels: [],
      messageHistory: [],
      settings: {
        allowGuestAccess: false,
        requireApprovalForInvites: true,
        messageRetentionDays: 30,
        allowExternalIntegrations: false,
        defaultChannelPermissions: 'restricted'
      },
      members: [{
        id: 'user-123',
        email: account.email,
        name: account.name,
        role: 'owner',
        joinedAt: new Date(),
        lastActive: new Date(),
        permissions: {
          canCreateChannels: true,
          canInviteMembers: true,
          canManageBudget: true,
          canAccessAllChannels: true
        },
        channelAccess: []
      }]
    };

    setOrganizationData(prev => ({
      ...prev,
      ownedOrgs: [...prev.ownedOrgs, newOrg],
      currentOrg: newOrg
    }));

    setNewOrgName('');
    setNewOrgDescription('');
    setShowCreateOrg(false);
  };

  const inviteMember = () => {
    if (!inviteEmail.trim() || !organizationData.currentOrg) return;

    const newInvite: InvitePendingMember = {
      id: `invite-${Date.now()}`,
      email: inviteEmail,
      role: inviteRole,
      invitedBy: 'user-123',
      invitedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      channelAccess: selectedChannels
    };

    setOrganizationData(prev => ({
      ...prev,
      pendingInvites: [...prev.pendingInvites, newInvite]
    }));

    setInviteEmail('');
    setInviteRole('member');
    setSelectedChannels([]);
    setShowInviteModal(false);
  };

  const switchOrganization = (orgId: string) => {
    const org = [...organizationData.ownedOrgs, ...organizationData.memberOrgs].find(o => o.id === orgId);
    if (org) {
      setOrganizationData(prev => ({ ...prev, currentOrg: org }));
    }
  };

  const getRoleIcon = (role: OrganizationMember['role']) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'member': return <User className="w-4 h-4 text-green-600" />;
      case 'guest': return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: OrganizationMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      case 'guest': return 'bg-gray-100 text-gray-800';
    }
  };

  const maxDailyTokens = Math.max(...dailyUsage.map(d => d.totalWorkspaceTokens), 1);

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
                  <p className="text-gray-600">Manage your workspace, team, and billing</p>
                </div>
                {organizationData.currentOrg && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{organizationData.currentOrg.name}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'organizations', label: 'Organizations', icon: Building },
                { id: 'calendar', label: 'Calendar', icon: CalendarDays },
                { id: 'integrations', label: 'Integrations', icon: Share },
                { id: 'billing', label: 'Billing & Usage', icon: DollarSign }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {/* Logout Button */}
        {onLogout && (
          <div className="mb-6 space-y-4">
            {/* Tutorial Section */}
            {onStartTutorial && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Tutorial & Help</h3>
                    <p className="text-gray-600 text-sm">Get familiar with all the features</p>
                  </div>
                  <button
                    onClick={onStartTutorial}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Start Tutorial</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Account Actions</h3>
                  <p className="text-gray-600 text-sm">Manage your account session</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Tokens</p>
                <p className="text-2xl font-bold text-purple-600">{account.credits.toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{monthlyStats.workspaceTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500">${monthlyStats.cost.toFixed(3)}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">{totalStats.weeklyTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500">${totalStats.weeklyCost.toFixed(3)}</p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">All Time</p>
                <p className="text-2xl font-bold text-orange-600">{totalStats.totalTokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500">${totalStats.totalCost.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

            {/* Account Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-6 h-6 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Account Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <p className="font-medium text-gray-900">{account.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium text-gray-900">{account.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Plan</label>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                      {account.plan}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        ✓ Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Usage Summary</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Daily Usage</span>
                    <span className="font-medium text-gray-900">
                      {dailyUsage.length > 0 
                        ? Math.round(dailyUsage.reduce((sum, d) => sum + d.totalWorkspaceTokens, 0) / dailyUsage.length).toLocaleString()
                        : '0'} tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peak Daily Usage</span>
                    <span className="font-medium text-gray-900">{maxDailyTokens.toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Operations</span>
                    <span className="font-medium text-gray-900">
                      {dailyUsage.reduce((sum, d) => sum + d.operations.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Est. Monthly Cost</span>
                    <span className="font-medium text-purple-600">
                      ${(monthlyStats.cost * (30 / new Date().getDate())).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}

          {activeTab === 'calendar' && currentOrganization && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Organization Calendar</h2>
                <p className="text-gray-600">Track progress and deadlines for all claimed jobs across your organization.</p>
              </div>
              
              <OrganizationCalendar
                channels={currentOrganization.channels}
                onTaskClick={handleTaskClick}
              />
            </div>
          )}

          {activeTab === 'organizations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your Organizations</h2>
                    <p className="text-gray-600">Manage and switch between your AI workspaces</p>
                  </div>
                  <button
                    onClick={() => window.location.reload()} // This will trigger the wizard
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + New Workspace
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className={`border-2 rounded-lg p-4 transition-all cursor-pointer ${
                        currentOrganization?.id === org.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                      }`}
                      onClick={() => handleSwitchOrganization(org.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{org.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{org.description}</p>
                        </div>
                        {currentOrganization?.id === org.id && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Channels</p>
                          <p className="font-medium">{org.channels.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Budget</p>
                          <p className="font-medium">${org.monthlyBudget}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Spent</p>
                          <p className="font-medium text-red-600">${org.totalSpent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining</p>
                          <p className="font-medium text-green-600">${org.totalRemaining}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-500">
                          Last accessed: {new Date(org.lastAccessed).toLocaleDateString()}
                        </span>
                        {currentOrganization?.id !== org.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrganization(org.id);
                            }}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {organizations.length === 0 && (
                  <div className="text-center py-8">
                    <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No organizations found</p>
                    <p className="text-sm text-gray-400">Create your first AI workspace to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">External Integrations</h2>
                
                {/* Slack Integration */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold">#</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Slack</h3>
                        <p className="text-sm text-gray-600">Sync channels and messages with your Slack workspace</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                {/* Discord Integration */}
                <div className="border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">D</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Discord</h3>
                        <p className="text-sm text-gray-600">Import Discord server structure and message history</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>

                {/* Microsoft Teams Integration */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">T</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Microsoft Teams</h3>
                        <p className="text-sm text-gray-600">Sync with Teams channels and conversations</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <>
        {/* Usage Graph */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Daily Token Usage (Last 7 Days)</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={exportData}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={clearUsage}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>
          
          <div className="h-64">
            {dailyUsage.length > 0 ? (
              <div className="flex items-end justify-between h-full space-x-2">
                {dailyUsage.reverse().map((day, index) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-lg min-h-[4px] transition-all hover:from-blue-600 hover:to-blue-400"
                      style={{ 
                        height: `${Math.max(4, (day.totalWorkspaceTokens / maxDailyTokens) * 240)}px` 
                      }}
                      title={`${day.totalWorkspaceTokens} tokens - $${day.totalCost.toFixed(3)}`}
                    />
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="font-medium">{day.totalWorkspaceTokens}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No usage data available</p>
                  <p className="text-sm">Start using AI agents to see your usage here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Usage Breakdown */}
        {dailyUsage.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Usage Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Date</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Operations</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Tokens Used</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyUsage.slice(0, 7).map((day) => (
                    <tr key={day.date} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-3">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {day.operations.slice(0, 3).map((op, i) => (
                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {op.operation}
                            </span>
                          ))}
                          {day.operations.length > 3 && (
                            <span className="text-xs text-gray-500">+{day.operations.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium">{day.totalWorkspaceTokens.toLocaleString()}</td>
                      <td className="py-3 px-3 font-medium text-green-600">${day.totalCost.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Token Packages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Purchase WorkspaceTokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {tokenPackages.map((pkg, index) => (
              <div 
                key={index} 
                className={`relative border-2 rounded-lg p-6 text-center transition-all hover:shadow-md ${
                  pkg.popular 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-4">
                  <Coins className={`w-8 h-8 mx-auto mb-2 ${pkg.popular ? 'text-purple-600' : 'text-gray-400'}`} />
                  <h3 className="text-xl font-bold text-gray-900">{pkg.amount.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">tokens</p>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-gray-900">${pkg.price}</span>
                  <p className="text-xs text-gray-500">${(pkg.price/pkg.amount*1000).toFixed(2)}/1k tokens</p>
                </div>
                <button 
                  onClick={() => addTokens(pkg.amount)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    pkg.popular 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Purchase
                </button>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">How WorkspaceTokens Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coins className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Simple Pricing</h4>
                <p className="text-sm text-gray-600">Each WorkspaceToken costs $0.001. Use tokens for AI agent interactions, task generation, and business analysis.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Pay As You Go</h4>
                <p className="text-sm text-gray-600">Only use tokens when you actively engage with AI agents. No subscription fees or hidden costs.</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Transparent Billing</h4>
                <p className="text-sm text-gray-600">See exactly how many tokens each interaction uses. Track your spending in real-time with detailed usage reports.</p>
              </div>
            </div>
          </div>
        </div>
            </>
          )}
        </div>
      </div>
      
      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onTaskUpdate={handleTaskUpdate}
        onStatusChange={handleTaskStatusChange}
        channelName={
          selectedTask && currentOrganization
            ? currentOrganization.channels.find(c => c.id === selectedTask.channelId)?.name
            : undefined
        }
      />
    </div>
  );
};

export default AccountManager;