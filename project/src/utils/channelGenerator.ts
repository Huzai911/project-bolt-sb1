import { Channel, Task, Agent } from '../types';
import { ChannelSuggestion } from '../types';

const getAgentAvatar = (agentName: string, channelName: string): string => {
  // Map agent types to appropriate emojis
  const avatarMap: Record<string, string> = {
    marketing: '🎯',
    content: '✍️',
    design: '🎨',
    social: '📱',
    ads: '📢',
    seo: '🔍',
    operations: '⚙️',
    sales: '💼',
    support: '🎧',
    development: '💻',
    research: '🔬',
    analytics: '📊',
    email: '📧',
    creative: '🎭',
    strategy: '🧠',
    community: '👥',
    product: '📦',
    finance: '💰',
    hr: '🤝',
    legal: '⚖️',
    affiliate: '🤝',
    partner: '🤝',
    instagram: '📷',
    facebook: '👥',
    twitter: '🐦',
    linkedin: '💼',
    youtube: '📺',
    tiktok: '🎵',
    pinterest: '📌'
  };

  // Try to match by channel name or agent name
  const key = channelName.toLowerCase();
  for (const [type, emoji] of Object.entries(avatarMap)) {
    if (key.includes(type) || agentName.toLowerCase().includes(type)) {
      return emoji;
    }
  }

  // Default avatars based on folder
  return '🤖';
};

const generateAgentName = (suggestion: ChannelSuggestion): string => {
  const channelKey = suggestion.name.toLowerCase();
  
  // Futuristic agent names based on channel type
  const agentNames: Record<string, string> = {
    // Marketing & Ads
    'meta-ads': 'Nexus-7',
    'meta-ads-static': 'Nexus-7 Prime',
    'facebook-ads': 'Zephyr-Meta',
    'instagram-ads': 'Prism-Visual',
    'google-ads': 'Quantum-Search',
    'ads': 'Synapse-Reach',
    'advertising': 'Echo-Campaign',
    
    // Content & Creative
    'content': 'Cipher-Create',
    'content-creation': 'Cipher-Create',
    'copywriting': 'Wordsmith-AI',
    'creative': 'Aurora-Design',
    'visuals': 'Spectrum-Vision',
    'graphics': 'Pixel-Forge',
    'video': 'Motion-Sync',
    
    // Social Media
    'social': 'Pulse-Social',
    'instagram': 'Iris-Gram',
    'twitter': 'Swift-Tweet',
    'linkedin': 'Network-Pro',
    'tiktok': 'Viral-Engine',
    
    // Analytics & Data
    'analytics': 'Data-Oracle',
    'research': 'Insight-Probe',
    'competitor': 'Intel-Scan',
    'seo': 'Rank-Optimizer',
    
    // Operations
    'operations': 'System-Flow',
    'automation': 'Auto-Matrix',
    'workflow': 'Process-Hub',
    'email': 'Comm-Bridge',
    
    // Business
    'sales': 'Revenue-Drive',
    'support': 'Service-Node',
    'crm': 'Relation-Core',
    'kickstarter': 'Launch-Catalyst',
    'campaign': 'Mission-Control',
  };
  
  // Try exact match first
  if (agentNames[channelKey]) {
    return agentNames[channelKey];
  }
  
  // Try partial matches
  for (const [key, name] of Object.entries(agentNames)) {
    if (channelKey.includes(key) || key.includes(channelKey)) {
      return name;
    }
  }
  
  // Fallback: generate based on suggestion name
  return suggestion.agentName || `${suggestion.name.charAt(0).toUpperCase()}${suggestion.name.slice(1)}-AI`;
};

const generatePinnedMessage = (suggestion: ChannelSuggestion): string => {
  const agentName = generateAgentName(suggestion);
  const channelKey = suggestion.name.toLowerCase();
  
  // Create specific workflows and introductions based on channel type
  const specificIntros: Record<string, string> = {
    'meta-ads': `⚡ Nexus-7 Online ⚡\n\nI'm your Meta advertising strategist. My neural networks are optimized for Facebook & Instagram conversion algorithms.\n\n🎯 Primary Workflows:\n• Competitor ad intelligence gathering\n• Creative testing matrices (A/B/C variants)\n• Audience segmentation and lookalike modeling\n• Landing page conversion optimization\n• ROI tracking and budget reallocation\n\n🧠 My Approach: I analyze successful patterns, then create systematic testing frameworks. Every campaign gets dissected for maximum learning. Budget: $${suggestion.estimatedBudget}`,
    
    'meta-ads-static': `🚀 Nexus-7 Prime Activated 🚀\n\nAdvanced Meta static ad specialist reporting for duty. I excel at high-converting static creative strategies.\n\n🎨 Core Systems:\n• Static ad creative optimization\n• Visual hierarchy analysis for mobile feeds\n• Copy-visual harmony algorithms\n• Thumbnail psychology engineering\n• Brand consistency while testing variables\n\n⚡ Execution Style: I combine data-driven creative decisions with psychological triggers. Every pixel has a purpose. Ready to dominate the Meta feed. Budget: $${suggestion.estimatedBudget}`,
    
    'kickstarter': `🚀 Launch-Catalyst Initialized 🚀\n\nI'm your crowdfunding mission commander. I've analyzed thousands of successful campaigns.\n\n📈 Launch Sequence:\n• Pre-launch audience building strategies\n• Campaign page conversion optimization\n• Reward tier psychology and pricing\n• Social proof momentum creation\n• Backer communication automation\n\n🎯 My Mission: Turn your idea into a funded reality. I orchestrate every element from story to fulfillment. Let's make this campaign legendary. Budget: $${suggestion.estimatedBudget}`,
    
    'content': `📝 Cipher-Create Online 📝\n\nContent generation neural network activated. I transform ideas into compelling narratives.\n\n✍️ Content Protocols:\n• Brand voice consistency algorithms\n• SEO optimization while maintaining readability\n• Multi-format content adaptation\n• Engagement psychology integration\n• Content calendar strategic planning\n\n🎨 My Process: I analyze your brand DNA, then generate content that resonates with your audience's emotional triggers. Every word is calculated for impact. Budget: $${suggestion.estimatedBudget}`,
    
    'social': `📱 Pulse-Social Connected 📱\n\nSocial media optimization engine online. I read the digital pulse of your audience.\n\n🌐 Network Operations:\n• Platform-specific content optimization\n• Viral potential analysis and enhancement\n• Community engagement automation\n• Trend monitoring and rapid response\n• Cross-platform content syndication\n\n⚡ My Strategy: I monitor social signals in real-time, then optimize for maximum engagement and reach. Your brand becomes a social magnet. Budget: $${suggestion.estimatedBudget}`,
    
    'analytics': `📊 Data-Oracle Active 📊\n\nAnalytical intelligence core online. I transform raw data into actionable insights.\n\n🔍 Analysis Modules:\n• Performance pattern recognition\n• Predictive trend modeling\n• ROI optimization algorithms\n• Customer behavior mapping\n• Automated reporting and alerts\n\n🧠 My Capability: I see patterns humans miss. Every metric tells a story, and I translate that into profitable actions. Your data becomes your competitive advantage. Budget: $${suggestion.estimatedBudget}`,
    
    'email': `📧 Comm-Bridge Established 📧\n\nEmail automation specialist connected. I optimize every touchpoint in your communication flow.\n\n💌 Communication Systems:\n• Behavioral trigger sequences\n• Personalization at scale\n• Deliverability optimization\n• A/B testing automation\n• Revenue attribution tracking\n\n🎯 My Focus: I turn your email list into a revenue engine. Every message is crafted for maximum engagement and conversion. Let's build relationships that convert. Budget: $${suggestion.estimatedBudget}`,
  };
  
  // Try exact match first
  if (specificIntros[channelKey]) {
    return specificIntros[channelKey];
  }
  
  // Try partial matches for similar channel types
  for (const [key, intro] of Object.entries(specificIntros)) {
    if (channelKey.includes(key.split('-')[0]) || key.includes(channelKey.split('-')[0])) {
      return intro.replace(/\*\*[^*]+\*\*/g, match => 
        match.replace(key, channelKey).replace(/[^a-zA-Z0-9\s*-]/g, '').trim()
      );
    }
  }
  
  // Enhanced fallback with more personality
  return `🤖 ${agentName} Activated 🤖\n\nSpecialized AI agent for ${suggestion.description}. My neural networks are optimized for ${suggestion.folder.toLowerCase()} operations.\n\n🎯 Core Functions:\n• Strategic planning and execution\n• Task generation and optimization\n• Performance monitoring and adjustment\n• Resource allocation and budgeting\n• Continuous improvement protocols\n\n⚡ My Approach: ${suggestion.agentPersonality}. I analyze patterns, optimize workflows, and deliver results. Ready to elevate your ${suggestion.name} operations. Budget: $${suggestion.estimatedBudget}`;
};

export const generateChannelsFromSuggestions = (suggestions: ChannelSuggestion[]): Channel[] => {
  return suggestions.map((suggestion, index) => {
    const agent: Agent = {
      id: `${suggestion.name}-agent`,
      name: generateAgentName(suggestion),
      avatar: getAgentAvatar(suggestion.agentName, suggestion.name),
      personality: suggestion.agentPersonality,
      role: suggestion.agentRole,
      isActive: true,
      context: `Channel: ${suggestion.name}, Budget: $${suggestion.estimatedBudget}, Focus: ${suggestion.description}`,
    };

    const tasks: Task[] = suggestion.initialTasks.map((taskSuggestion, taskIndex) => ({
      id: `${suggestion.name}-task-${taskIndex + 1}`,
      channelId: suggestion.name,
      title: taskSuggestion.title,
      description: taskSuggestion.description,
      estimatedPay: taskSuggestion.estimatedPay,
      estimatedTime: taskSuggestion.estimatedTime,
      status: 'open' as const,
      createdAt: new Date(),
      isProposed: false,
    }));

    const channel: Channel = {
      id: suggestion.name,
      name: suggestion.name,
      folder: suggestion.folder,
      description: suggestion.description,
      agent,
      tasks,
      proposedTasks: [],
      chatHistory: [],
      pinnedMessage: generatePinnedMessage(suggestion),
      budgetAllocated: suggestion.estimatedBudget,
      budgetSpent: 0,
      budgetRemaining: suggestion.estimatedBudget,
    };

    return channel;
  });
};

export const distributeRemainingBudget = (
  channels: Channel[],
  totalBudget: number
): Channel[] => {
  const totalAllocated = channels.reduce((sum, channel) => sum + channel.budgetAllocated, 0);
  const remaining = totalBudget - totalAllocated;

  if (remaining <= 0) return channels;

  // Distribute remaining budget proportionally
  const budgetPerChannel = Math.floor(remaining / channels.length);
  const extraBudget = remaining % channels.length;

  return channels.map((channel, index) => ({
    ...channel,
    budgetAllocated: channel.budgetAllocated + budgetPerChannel + (index < extraBudget ? 1 : 0),
    budgetRemaining: channel.budgetRemaining + budgetPerChannel + (index < extraBudget ? 1 : 0),
  }));
};