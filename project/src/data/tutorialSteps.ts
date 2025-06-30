export const mainTutorialSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to AI Workspace!',
    content: 'This is your AI-powered business automation platform. Let\'s take a quick tour to get you started!',
    target: '.tutorial-welcome',
    position: 'bottom' as const,
  },
  {
    id: 'budget-overview',
    title: '💰 Budget Dashboard',
    content: 'Here you can see your monthly budget, spending, and allocation across all AI channels. This is your financial command center.',
    target: '[data-tutorial="budget-cards"]',
    position: 'bottom' as const,
  },
  {
    id: 'sidebar-navigation',
    title: '📂 Channel Navigation',
    content: 'Your AI channels are organized by folders. Each channel has a specialized AI agent to handle different aspects of your business.',
    target: '[data-tutorial="sidebar"]',
    position: 'right' as const,
  },
  {
    id: 'channel-selection',
    title: '🤖 AI Agents',
    content: 'Click on any channel to work with its AI agent. Each agent has expertise in their specific domain and can generate tasks.',
    target: '[data-tutorial="channel-list"]',
    position: 'right' as const,
    action: () => {
      // Ensure sidebar is visible
      const sidebar = document.querySelector('[data-tutorial="sidebar"]');
      if (sidebar) {
        sidebar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
  },
  {
    id: 'create-channels',
    title: '✨ AI Channel Creator',
    content: 'Need more help? Use the AI Channel Creator to analyze your needs and suggest new specialized channels.',
    target: '[data-tutorial="channel-creator"]',
    position: 'top' as const,
    waitForElement: true,
  },
  {
    id: 'budget-control',
    title: '🎛️ Budget Control',
    content: 'Adjust your monthly budget here. Use the slider or click the dollar amount to edit directly.',
    target: '[data-tutorial="budget-control"]',
    position: 'top' as const,
    waitForElement: true,
  },
  {
    id: 'tools-manager',
    title: '🔧 Tools Integration',
    content: 'Tell the AI about your current tools (Slack, Google Sheets, etc.) to get better automation suggestions.',
    target: '[data-tutorial="tools-manager"]',
    position: 'top' as const,
    waitForElement: true,
  },
  {
    id: 'account-access',
    title: '👤 Account Management',
    content: 'Access your account settings, usage statistics, and organization management from here.',
    target: '[data-tutorial="account-button"]',
    position: 'right' as const,
  },
  {
    id: 'tutorial-complete',
    title: '🚀 You\'re Ready!',
    content: 'You\'re all set! Start by creating channels or chatting with existing AI agents. You can restart this tutorial anytime from account settings.',
    target: '.tutorial-welcome',
    position: 'bottom' as const,
  },
];

export const channelTutorialSteps = [
  {
    id: 'channel-overview',
    title: '🤖 Meet Your AI Agent',
    content: 'This is your channel\'s AI agent. They specialize in this area and can help generate tasks, provide insights, and manage workflows.',
    target: '[data-tutorial="channel-header"]',
    position: 'bottom' as const,
  },
  {
    id: 'chat-feature',
    title: '💬 Chat with AI',
    content: 'Click here to chat with your AI agent. Ask for tasks, strategy advice, or help with planning.',
    target: '[data-tutorial="chat-button"]',
    position: 'bottom' as const,
  },
  {
    id: 'budget-info',
    title: '💰 Channel Budget',
    content: 'Track your channel\'s budget allocation and spending. Click the amounts to edit them directly.',
    target: '[data-tutorial="channel-budget"]',
    position: 'left' as const,
  },
  {
    id: 'channel-notes',
    title: '📝 Channel Context',
    content: 'Add notes about your workflow, team roles, or special considerations. This helps the AI provide better suggestions.',
    target: '[data-tutorial="channel-notes"]',
    position: 'bottom' as const,
  },
  {
    id: 'proposed-tasks',
    title: '🤖 AI Task Proposals',
    content: 'When AI agents suggest new tasks, they\'ll appear here for your approval. Review and approve the ones you want.',
    target: '[data-tutorial="proposed-tasks"]',
    position: 'top' as const,
    waitForElement: true,
  },
  {
    id: 'open-tasks',
    title: '📋 Task Management',
    content: 'Open tasks are ready for freelancers to claim. Click the sparkle icon on any task for AI automation suggestions.',
    target: '[data-tutorial="open-tasks"]',
    position: 'top' as const,
  },
];

export const chatTutorialSteps = [
  {
    id: 'chat-interface',
    title: '💬 AI Chat Interface',
    content: 'This is where you collaborate with your AI agent. They can understand context and provide specialized help.',
    target: '[data-tutorial="chat-container"]',
    position: 'top' as const,
  },
  {
    id: 'quick-prompts',
    title: '⚡ Quick Prompts',
    content: 'Use these quick prompts to get started, or type your own questions about strategy, tasks, or planning.',
    target: '[data-tutorial="quick-prompts"]',
    position: 'top' as const,
  },
  {
    id: 'message-input',
    title: '✍️ Message Input',
    content: 'Type your questions here. Ask for tasks, advice, or help with planning. The AI understands your business context.',
    target: '[data-tutorial="message-input"]',
    position: 'top' as const,
  },
];