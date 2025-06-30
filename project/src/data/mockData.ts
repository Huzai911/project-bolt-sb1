import { Channel, Task, WorkspaceData } from '../types';

export const mockTasks: Task[] = [
  {
    id: '1',
    channelId: 'metaads',
    title: 'Research Competitive Games',
    description: 'Find 3 competitors, summarize reviews, generate 1-page brief for Meta ads strategy.',
    estimatedPay: 15,
    estimatedTime: '2-3 hours',
    status: 'open',
    createdAt: new Date('2025-01-15T10:00:00'),
  },
  {
    id: '2',
    channelId: 'metaads',
    title: 'Meta Ad Strategy Plan',
    description: 'Write comprehensive ad plan based on brand strategy. Consult with Nate for approval.',
    estimatedPay: 25,
    estimatedTime: '1-2 hours',
    status: 'claimed',
    claimedBy: 'Sarah M.',
    createdAt: new Date('2025-01-15T11:30:00'),
  },
  {
    id: '3',
    channelId: 'metaads',
    title: 'Thumbnail Test Batch',
    description: 'Design 3 thumbnail options based on brand direction. Include A/B test variations.',
    estimatedPay: 20,
    estimatedTime: '3-4 hours',
    status: 'completed',
    claimedBy: 'Design Pro',
    createdAt: new Date('2025-01-14T09:00:00'),
    completedAt: new Date('2025-01-15T14:30:00'),
  },
  {
    id: '4',
    channelId: 'kickstarter',
    title: 'Campaign Video Script',
    description: 'Write engaging 90-second script for Kickstarter campaign video. Include call-to-action.',
    estimatedPay: 30,
    estimatedTime: '2-3 hours',
    status: 'in-progress',
    claimedBy: 'Content Writer',
    createdAt: new Date('2025-01-15T08:00:00'),
  },
  {
    id: '5',
    channelId: 'kickstarter',
    title: 'Reward Tier Analysis',
    description: 'Research successful gaming Kickstarters and recommend optimal reward structure.',
    estimatedPay: 18,
    estimatedTime: '2 hours',
    status: 'open',
    createdAt: new Date('2025-01-15T12:00:00'),
  },
];

export const mockChannels: Channel[] = [
  {
    id: 'metaads',
    name: 'Meta Ads',
    folder: 'Marketing',
    description: 'Facebook and Instagram advertising strategy and execution',
    agent: {
      id: 'metaads-bot',
      name: 'Nexus-7 Prime',
      avatar: '🎯',
      personality: 'Advanced Meta advertising specialist with neural networks optimized for conversion algorithms',
      role: 'Meta Advertising Specialist',
      isActive: true,
    },
    tasks: mockTasks.filter(task => task.channelId === 'metaads'),
    pinnedMessage: `🚀 Nexus-7 Prime Activated 🚀

Advanced Meta static ad specialist reporting for duty. I excel at high-converting static creative strategies.

🎨 Core Systems:
• Static ad creative optimization
• Visual hierarchy analysis for mobile feeds  
• Copy-visual harmony algorithms
• Thumbnail psychology engineering
• Brand consistency while testing variables

⚡ Execution Style: I combine data-driven creative decisions with psychological triggers. Every pixel has a purpose. Ready to dominate the Meta feed. Budget: $300`,
    budgetAllocated: 300,
    budgetSpent: 45,
    budgetRemaining: 255,
  },
  {
    id: 'kickstarter',
    name: 'Kickstarter Campaign',
    folder: 'Marketing',
    description: 'Crowdfunding campaign strategy and content creation',
    agent: {
      id: 'kickstarter-bot',
      name: 'Launch-Catalyst',
      avatar: '🚀',
      personality: 'Crowdfunding mission commander with deep analysis of successful campaign patterns',
      role: 'Campaign Strategy Manager',
      isActive: true,
    },
    tasks: mockTasks.filter(task => task.channelId === 'kickstarter'),
    pinnedMessage: `🚀 Launch-Catalyst Initialized 🚀

I'm your crowdfunding mission commander. I've analyzed thousands of successful campaigns.

📈 Launch Sequence:
• Pre-launch audience building strategies
• Campaign page conversion optimization  
• Reward tier psychology and pricing
• Social proof momentum creation
• Backer communication automation

🎯 My Mission: Turn your idea into a funded reality. I orchestrate every element from story to fulfillment. Let's make this campaign legendary. Budget: $400`,
    budgetAllocated: 400,
    budgetSpent: 30,
    budgetRemaining: 370,
  },
  {
    id: 'advisuals',
    name: 'Ad Visuals',
    folder: 'Design',
    description: 'Creative assets and visual content for advertising',
    agent: {
      id: 'design-bot',
      name: 'Spectrum-Vision',
      avatar: '🎨',
      personality: 'Advanced visual AI with expertise in brand consistency and creative optimization',
      role: 'Creative Director',
      isActive: true,
    },
    tasks: [],
    pinnedMessage: `🎨 Spectrum-Vision Online 🎨

Creative optimization engine activated. I transform concepts into compelling visual narratives.

🖼️ Visual Systems:
• Brand consistency algorithms
• Visual hierarchy optimization
• Color psychology integration  
• Cross-platform creative adaptation
• Performance-driven design decisions

⚡ My Process: I analyze visual performance data to create assets that convert. Every design element serves a strategic purpose. Ready to elevate your visual game. Budget: $250`,
    budgetAllocated: 250,
    budgetSpent: 85,
    budgetRemaining: 165,
  },
];

export const initialWorkspaceData: WorkspaceData = {
  monthlyBudget: 1000,
  channels: mockChannels,
  totalSpent: 160,
  totalRemaining: 840,
};