export interface Channel {
  id: string;
  name: string;
  folder: string;
  description: string;
  userNotes?: string; // User's custom context and notes
  agent: Agent;
  tasks: Task[];
  proposedTasks: Task[];
  chatHistory: ChatMessage[];
  pinnedMessage: string;
  budgetAllocated: number;
  budgetSpent: number;
  budgetRemaining: number;
}

export interface Agent {
  id: string;
  name: string;
  avatar: string;
  personality: string;
  role: string;
  isActive: boolean;
  context?: string;
}

export interface Task {
  id: string;
  channelId: string;
  title: string;
  description: string;
  userNotes?: string; // User's custom notes and context
  deadline?: Date; // Optional deadline for task completion
  estimatedPay: number;
  estimatedTime: string;
  status: 'open' | 'claimed' | 'in-progress' | 'submitted' | 'completed' | 'proposed';
  claimedBy?: string;
  files?: File[];
  createdAt: Date;
  completedAt?: Date;
  isProposed?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'agent';
  attachments?: {
    type: 'task-proposals' | 'channel-suggestions';
    data: any;
  };
}

export interface BudgetAllocation {
  channelId: string;
  channelName: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface WorkspaceData {
  monthlyBudget: number;
  channels: Channel[];
  totalSpent: number;
  totalRemaining: number;
}

export interface ChannelSuggestion {
  name: string;
  folder: string;
  description: string;
  agentName: string;
  agentPersonality: string;
  agentRole: string;
  estimatedBudget: number;
  reasoning: string;
  initialTasks: Array<{
    title: string;
    description: string;
    estimatedPay: number;
    estimatedTime: string;
  }>;
  reasoning?: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  ownerId: string;
  members: OrganizationMember[];
  settings: OrganizationSettings;
  plan: 'free' | 'team' | 'enterprise';
  channels: string[]; // Channel IDs that belong to this org
  messageHistory: ChatMessage[]; // All messages across org channels
}

export interface OrganizationMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'guest';
  joinedAt: Date;
  lastActive: Date;
  permissions: {
    canCreateChannels: boolean;
    canInviteMembers: boolean;
    canManageBudget: boolean;
    canAccessAllChannels: boolean;
  };
  channelAccess: string[]; // Specific channel IDs they have access to
}

export interface OrganizationSettings {
  allowGuestAccess: boolean;
  requireApprovalForInvites: boolean;
  messageRetentionDays: number;
  allowExternalIntegrations: boolean;
  defaultChannelPermissions: 'open' | 'restricted';
}

export interface InvitePendingMember {
  id: string;
  email: string;
  role: OrganizationMember['role'];
  invitedBy: string;
  invitedAt: Date;
  expiresAt: Date;
  channelAccess: string[];
}

export interface AgentMessage {
  id: string;
  fromChannelId: string;
  toChannelId: string;
  content: string;
  timestamp: Date;
  type: 'question' | 'response' | 'insight';
  boostId?: string;
  generatedTasks?: Task[];
}