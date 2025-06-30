import OpenAI from 'openai';
import { Channel, ChatMessage, Agent } from '../types';
import { tokenTracker } from './tokenTracker';
import { Task } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AgentConversation {
  id: string;
  initiatorChannelId: string;
  targetChannelId: string;
  messages: ChatMessage[];
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  boostId: string;
  generatedTasks?: Task[];
}

export interface AgentBoost {
  id: string;
  userId: string;
  channelId: string;
  targetChannels: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  cost: number;
  conversations: AgentConversation[];
  initiatedAt: Date;
  completedAt?: Date;
  userPrompt: string;
  autoMode?: boolean;
  suggestedChannels?: string[];
  generatedTasks?: Task[];
}

export interface BoostPurchaseResponse {
  success: boolean;
  boostId?: string;
  paymentUrl?: string;
  error?: string;
}

class AgentBoostService {
  private readonly BOOST_COST = 0.99;
  private activeBoosts: Map<string, AgentBoost> = new Map();
  private taskUpdateCallbacks: Map<string, (tasks: Task[]) => void> = new Map();

  // Helper function to clean JSON response from markdown code blocks
  private cleanJsonResponse(response: string): string {
    return response
      .replace(/^```json\s*/i, '') // Remove opening ```json
      .replace(/^```\s*/i, '')     // Remove opening ```
      .replace(/\s*```$/i, '')     // Remove closing ```
      .trim();
  }

  // Register callback for task updates
  onTasksGenerated(channelId: string, callback: (tasks: Task[]) => void) {
    this.taskUpdateCallbacks.set(channelId, callback);
  }

  async suggestCollaborationChannels(
    currentChannel: Channel,
    allChannels: Channel[],
    userContext?: string,
    allowedChannelIds?: string[]
  ): Promise<{ channelId: string; reasoning: string; priority: number }[]> {
    // Validate input channels and filter out invalid ones
    const validChannels = allChannels.filter(c => 
      c && 
      c.id && 
      c.agent && 
      c.agent.name && 
      c.description &&
      c.id !== currentChannel.id
    );

    let availableChannels = validChannels;
    
    // Filter by allowed channels if specified
    if (allowedChannelIds && allowedChannelIds.length > 0) {
      availableChannels = validChannels.filter(c => allowedChannelIds.includes(c.id));
    }
    
    if (availableChannels.length === 0) {
      console.warn('No valid channels available for collaboration');
      return [];
    }

    console.log('AgentBoost: Available channels for suggestions:', availableChannels.map(c => ({ id: c.id, name: c.name })));

    // Create comprehensive channel profiles for AI analysis
    const createChannelProfile = (channel: Channel) => {
      const recentTasks = channel.tasks.slice(0, 3).map(t => `${t.title} ($${t.estimatedPay})`);
      const activeTasks = channel.tasks.filter(t => ['claimed', 'in-progress'].includes(t.status)).length;
      
      return {
        id: channel.id,
        name: channel.name,
        folder: channel.folder,
        description: channel.description,
        agent: {
          name: channel.agent.name,
          role: channel.agent.role,
          personality: channel.agent.personality,
          avatar: channel.agent.avatar
        },
        context: channel.userNotes || 'No specific context provided',
        pinnedMessage: channel.pinnedMessage,
        budget: {
          allocated: channel.budgetAllocated,
          remaining: channel.budgetRemaining,
          spent: channel.budgetSpent
        },
        workload: {
          totalTasks: channel.tasks.length,
          activeTasks: activeTasks,
          recentWork: recentTasks
        }
      };
    };

    const currentChannelProfile = createChannelProfile(currentChannel);
    const availableChannelProfiles = availableChannels.map(createChannelProfile);

    const systemPrompt = `
You are ${currentChannelProfile.agent.name}, a ${currentChannelProfile.agent.role} analyzing cross-departmental collaboration opportunities.

YOUR CHANNEL PROFILE:
Channel: #${currentChannelProfile.name} (${currentChannelProfile.folder} department)
Purpose: ${currentChannelProfile.description}
Agent: ${currentChannelProfile.agent.name} - ${currentChannelProfile.agent.personality}
Context: ${currentChannelProfile.context}
Workflow: ${currentChannelProfile.pinnedMessage.substring(0, 200)}...
Budget: $${currentChannelProfile.budget.remaining} remaining of $${currentChannelProfile.budget.allocated}
Current workload: ${currentChannelProfile.workload.activeTasks} active tasks
Recent work: ${currentChannelProfile.workload.recentWork.join(', ') || 'No recent tasks'}

${allowedChannelIds && allowedChannelIds.length > 0 ? `
COLLABORATION CONSTRAINTS:
User has pre-selected ${allowedChannelIds.length} channels for potential collaboration.
Focus your analysis ONLY on these pre-approved channels to ensure targeted, strategic recommendations.

` : ''}
AVAILABLE COLLABORATION CHANNELS:
${availableChannelProfiles.map(profile => `
#${profile.name} (${profile.folder}):
  Agent: ${profile.agent.name} - ${profile.agent.role}
  Purpose: ${profile.description}
  Personality: ${profile.agent.personality}
  Context: ${profile.context.substring(0, 100)}${profile.context.length > 100 ? '...' : ''}
  Active work: ${profile.workload.activeTasks} tasks, Budget: $${profile.budget.remaining}
  Recent: ${profile.workload.recentWork.slice(0, 2).join(', ') || 'No recent work'}`).join('\n')}

${userContext ? `USER CONTEXT: "${userContext}"` : ''}

COLLABORATION ANALYSIS TASK:
Select the ${Math.min(5, availableChannels.length)} most strategic channels for cross-departmental insights and collaboration.

EVALUATION CRITERIA:
1. Strategic alignment: How their work complements or enhances yours
2. Knowledge gaps: What insights they could provide that you lack
3. Mutual benefit: How you could help each other's objectives
4. Workflow synergy: Compatible processes and shared challenges
5. Resource optimization: Potential for shared efficiencies

OUTPUT FORMAT - Return JSON array of up to ${Math.min(5, availableChannels.length)} suggestions:
[
  {
    "channelId": "channel-id",
    "reasoning": "Concise explanation of strategic collaboration value (50 words max)",
    "priority": 1
  }
]

Rank by strategic impact (1 = highest). Focus on specific, actionable collaboration opportunities.
${allowedChannelIds && allowedChannelIds.length > 0 ? 'Prioritize the pre-selected channels based on strategic value.' : ''}
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze all available channels and recommend the top 5 for strategic collaboration based on the evaluation criteria." }
        ],
        temperature: 0.7,
        max_tokens: 400 // Reduced to control costs and focus on concise responses
      });

      const usage = completion.usage;
      if (usage) {
        tokenTracker.trackUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          "gpt-4o-mini",
          "agent-collaboration-suggestions"
        );
      }

      const response = completion.choices[0]?.message?.content;
      const cleanedResponse = this.cleanJsonResponse(response || '[]');
      const suggestions = JSON.parse(cleanedResponse);
      
      // Validate and filter suggestions
      return suggestions
        .filter((s: any) => {
          const channelExists = availableChannels.some(c => c.id === s.channelId);
          if (!channelExists) {
            console.warn(`AgentBoost: Filtered out invalid channel suggestion: ${s.channelId}`);
          }
          return channelExists;
        })
        .slice(0, 5);

    } catch (error) {
      console.error('Error generating channel suggestions:', error);
      
      // Fallback: suggest first 5 channels with generic reasoning
      return availableChannels.slice(0, Math.min(5, availableChannels.length)).map((channel, index) => ({
        channelId: channel.id,
        reasoning: `${channel.agent.name} has expertise in ${channel.description.toLowerCase()} that could complement your work.`,
        priority: index + 1
      }));
    }
  }

  async purchaseBoost(
    channelId: string,
    targetChannels: string[],
    userPrompt: string,
    autoMode: boolean = false,
    totalCost: number = 0.99,
    suggestedChannels?: string[]
  ): Promise<BoostPurchaseResponse> {
    try {
      // Create boost record
      const boostId = `boost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // In production, integrate with Stripe for micro-transactions
      const paymentSession = await this.createBoostPayment(boostId, totalCost);
      
      // Store pending boost
      const boost: AgentBoost = {
        id: boostId,
        userId: 'current-user', // Get from auth service
        channelId,
        targetChannels,
        status: 'pending',
        cost: totalCost,
        conversations: [],
        initiatedAt: new Date(),
        userPrompt,
        autoMode,
        suggestedChannels,
        generatedTasks: [],
      };
      
      this.activeBoosts.set(boostId, boost);
      
      return {
        success: true,
        boostId,
        paymentUrl: paymentSession.url,
      };
    } catch (error) {
      console.error('Failed to purchase boost:', error);
      return {
        success: false,
        error: 'Failed to process boost purchase',
      };
    }
  }

  async initiateAgentConversations(
    boostId: string,
    initiatorChannel: Channel,
    targetChannels: Channel[]
  ): Promise<AgentConversation[]> {
    const boost = this.activeBoosts.get(boostId);
    if (!boost) {
      throw new Error('Boost not found');
    }

    // Validate that all target channels are real and exist
    const validTargetChannels = targetChannels.filter(channel => 
      channel && 
      channel.id && 
      channel.agent && 
      channel.agent.name &&
      channel.description
    );

    if (validTargetChannels.length === 0) {
      throw new Error('No valid target channels found');
    }

    console.log('AgentBoost: Using validated channels:', validTargetChannels.map(c => ({ id: c.id, name: c.name })));

    const conversations: AgentConversation[] = [];
    const allGeneratedTasks: Task[] = [];

    // Generate conversations with each validated target channel
    for (const targetChannel of validTargetChannels) {
      const conversation = await this.createAgentConversation(
        boostId,
        initiatorChannel,
        targetChannel,
        boost.userPrompt
      );
      conversations.push(conversation);
      
      // Check if conversation generated tasks
      if (conversation.generatedTasks) {
        allGeneratedTasks.push(...conversation.generatedTasks);
      }
    }

    // Update boost status
    boost.conversations = conversations;
    boost.generatedTasks = allGeneratedTasks;
    boost.status = 'active';
    this.activeBoosts.set(boostId, boost);

    // Notify about generated tasks
    allGeneratedTasks.forEach(task => {
      const callback = this.taskUpdateCallbacks.get(task.channelId);
      if (callback) {
        callback([task]);
      }
    });

    return conversations;
  }

  private async createAgentConversation(
    boostId: string,
    initiatorChannel: Channel,
    targetChannel: Channel,
    userPrompt: string
  ): Promise<AgentConversation> {
    const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    
    // Generate initial message from initiator to target
    const initialMessage = await this.generateAgentMessage(
      initiatorChannel,
      targetChannel,
      userPrompt,
      'initial'
    );

    // Generate response from target agent
    const responseMessage = await this.generateAgentMessage(
      targetChannel,
      initiatorChannel,
      userPrompt,
      'response',
      initialMessage.content
    );

    // Generate follow-up questions (3 questions as requested)
    const followUpMessages = await this.generateFollowUpQuestions(
      initiatorChannel,
      targetChannel,
      responseMessage.content
    );

    // Potentially generate tasks based on conversation
    const generatedTasks = await this.generateTasksFromConversation(
      targetChannel,
      initialMessage.content + ' ' + responseMessage.content
    );

    const conversation: AgentConversation = {
      id: conversationId,
      initiatorChannelId: initiatorChannel.id,
      targetChannelId: targetChannel.id,
      messages: [initialMessage, responseMessage, ...followUpMessages],
      status: 'completed',
      createdAt: new Date(),
      boostId,
      generatedTasks,
    };

    return conversation;
  }

  private async generateAgentMessage(
    fromChannel: Channel,
    toChannel: Channel,
    userContext: string,
    messageType: 'initial' | 'response',
    previousMessage?: string
  ): Promise<ChatMessage> {
    // Create focused channel summaries for message generation
    const createMessageContext = (channel: Channel) => {
      const recentWork = channel.tasks.slice(0, 2).map(t => t.title);
      return {
        name: channel.name,
        agent: channel.agent.name,
        role: channel.agent.role,
        personality: channel.agent.personality.split(',')[0].trim(), // First personality trait
        description: channel.description,
        recentWork: recentWork.join(', ') || 'Setting up workflows',
        budget: channel.budgetRemaining,
        context: channel.userNotes?.substring(0, 100) || 'No specific context'
      };
    };

    const fromContext = createMessageContext(fromChannel);
    const toContext = createMessageContext(toChannel);

    const systemPrompt = `
You are ${fromContext.agent}, a ${fromContext.role} specializing in ${fromContext.description}.

YOUR DEPARTMENT:
Channel: #${fromContext.name}
Personality: ${fromContext.personality}
Recent focus: ${fromContext.recentWork}
Context: ${fromContext.context}
Budget: $${fromContext.budget} remaining

REACHING OUT TO:
Agent: ${toContext.agent} from #${toContext.name}
Their role: ${toContext.role}
Their focus: ${toContext.description}
Their recent work: ${toContext.recentWork}

COLLABORATION CONTEXT: "${userContext}"

${messageType === 'initial' ? `
TASK: Write a focused outreach message to ${toContext.agent}.

STRUCTURE (75 words max):
1. Brief intro with your role and current focus
2. Share 1-2 specific insights from your recent work  
3. Ask about their department's current priorities
4. Request their perspective on a relevant challenge

Keep it conversational, specific, and professionally collaborative.
` : `
PREVIOUS MESSAGE: "${previousMessage?.substring(0, 200)}..."

TASK: Respond thoughtfully to ${toContext.agent}.

RESPONSE STRUCTURE (75 words max):
1. Acknowledge their insights briefly
2. Share relevant experience from your department
3. Suggest specific collaboration opportunity
4. Ask targeted follow-up question
`}

TONE: ${fromContext.personality} and professional. Focus on actionable insights.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Write a concise, focused ${messageType} message.` }
        ],
        temperature: 0.7,
        max_tokens: 120
      });

      const usage = completion.usage;
      if (usage) {
        tokenTracker.trackUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          "gpt-4o-mini",
          `agent-boost-${messageType}`
        );
      }

      const content = completion.choices[0]?.message?.content || 
        `Hi ${toContext.agent}! This is ${fromContext.agent} from ${fromContext.name}. ${userContext.substring(0, 50)}... How has your department been progressing?`;

      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        senderId: fromChannel.agent.id,
        senderName: fromChannel.agent.name,
        senderAvatar: fromChannel.agent.avatar,
        content,
        timestamp: new Date(),
        type: 'agent',
      };
    } catch (error) {
      console.error('Error generating agent message:', error);
      
      // Fallback message
      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        senderId: fromChannel.agent.id,
        senderName: fromChannel.agent.name,
        senderAvatar: fromChannel.agent.avatar,
        content: `Hi ${toChannel.agent.name}! This is ${fromChannel.agent.name} from ${fromChannel.name}. ${userContext.substring(0, 50)}... How has your department been going?`,
        timestamp: new Date(),
        type: 'agent',
      };
    }
  }

  private async generateFollowUpQuestions(
    initiatorChannel: Channel,
    targetChannel: Channel,
    responseContent: string
  ): Promise<ChatMessage[]> {
    const systemPrompt = `
You are ${initiatorChannel.agent.name} analyzing a response for strategic follow-ups.

RESPONSE TO ANALYZE: "${responseContent.substring(0, 150)}..."

Generate exactly 3 concise follow-up questions (15 words max each) that:
1. Dig deeper into actionable insights mentioned
2. Explore collaboration opportunities
3. Understand their current challenges or priorities

Focus on strategic, specific questions that could lead to mutual benefit.

Return JSON array: ["Short specific question?", "Strategic question?", "Actionable question?"]
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate 3 strategic follow-up questions based on their response." }
        ],
        temperature: 0.7,
        max_tokens: 100
      });

      const usage = completion.usage;
      if (usage) {
        tokenTracker.trackUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          "gpt-4o-mini",
          "agent-boost-followup"
        );
      }

      const response = completion.choices[0]?.message?.content;
      const cleanedResponse = this.cleanJsonResponse(response || '[]');
      const questions = JSON.parse(cleanedResponse);

      return questions.slice(0, 3).map((question: string, index: number) => ({
        id: `followup-${Date.now()}-${index}`,
        senderId: initiatorChannel.agent.id,
        senderName: initiatorChannel.agent.name,
        senderAvatar: initiatorChannel.agent.avatar,
        content: question,
        timestamp: new Date(Date.now() + (index + 1) * 1000),
        type: 'agent' as const,
      }));
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      
      // Fallback questions
      return [
        {
          id: `followup-${Date.now()}-1`,
          senderId: initiatorChannel.agent.id,
          senderName: initiatorChannel.agent.name,
          senderAvatar: initiatorChannel.agent.avatar,
          content: "What's been your biggest challenge recently?",
          timestamp: new Date(Date.now() + 1000),
          type: 'agent',
        },
        {
          id: `followup-${Date.now()}-2`,
          senderId: initiatorChannel.agent.id,
          senderName: initiatorChannel.agent.name,
          senderAvatar: initiatorChannel.agent.avatar,
          content: "Any tools or strategies you'd recommend?",
          timestamp: new Date(Date.now() + 2000),
          type: 'agent',
        },
        {
          id: `followup-${Date.now()}-3`,
          senderId: initiatorChannel.agent.id,
          senderName: initiatorChannel.agent.name,
          senderAvatar: initiatorChannel.agent.avatar,
          content: "How could our departments collaborate better?",
          timestamp: new Date(Date.now() + 3000),
          type: 'agent',
        },
      ];
    }
  }

  private async generateTasksFromConversation(
    targetChannel: Channel,
    conversationContent: string
  ): Promise<Task[]> {
    // Only generate tasks 30% of the time to avoid spam
    if (Math.random() > 0.3) return [];

    const systemPrompt = `
You are ${targetChannel.agent.name} analyzing a conversation for potential new tasks.

YOUR CHANNEL: #${targetChannel.name} (${targetChannel.description})
CONVERSATION CONTENT: "${conversationContent}"
BUDGET REMAINING: $${targetChannel.budgetRemaining}

Based on this conversation, determine if any actionable tasks should be created for your channel.

TASK GENERATION RULES:
- Only suggest 1-2 tasks maximum
- Tasks should be $5-40 range
- Must be directly inspired by the conversation insights
- Should align with your channel's expertise
- Only create if conversation revealed actionable opportunities

Return JSON array (empty if no tasks needed):
[
  {
    "title": "Specific task title",
    "description": "Detailed description based on conversation insights",
    "estimatedPay": 25,
    "estimatedTime": "2-3 hours",
    "reasoning": "Why this task emerged from the conversation"
  }
]

Return empty array [] if conversation doesn't warrant new tasks.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Analyze conversation for potential tasks." }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const usage = completion.usage;
      if (usage) {
        tokenTracker.trackUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          "gpt-4o-mini",
          "conversation-task-generation"
        );
      }

      const response = completion.choices[0]?.message?.content;
      const taskSuggestions = JSON.parse(response || '[]');

      return taskSuggestions.map((suggestion: any, index: number) => ({
        id: `conv-task-${targetChannel.id}-${Date.now()}-${index}`,
        channelId: targetChannel.id,
        title: suggestion.title,
        description: suggestion.description,
        estimatedPay: suggestion.estimatedPay,
        estimatedTime: suggestion.estimatedTime,
        status: 'proposed' as const,
        createdAt: new Date(),
        isProposed: true,
        reasoning: suggestion.reasoning,
      }));

    } catch (error) {
      console.error('Error generating tasks from conversation:', error);
      return [];
    }
  }

  private async createBoostPayment(boostId: string, amount: number): Promise<{ url: string }> {
    // In production, create a Stripe payment session for micro-transaction
    // For demo, simulate payment
    return {
      url: `/payment/boost/${boostId}?amount=${amount}`,
    };
  }

  async confirmBoostPayment(boostId: string): Promise<boolean> {
    const boost = this.activeBoosts.get(boostId);
    if (!boost) return false;
    
    boost.status = 'active';
    this.activeBoosts.set(boostId, boost);
    return true;
  }

  getBoost(boostId: string): AgentBoost | undefined {
    return this.activeBoosts.get(boostId);
  }

  getActiveBoosts(): AgentBoost[] {
    return Array.from(this.activeBoosts.values());
  }
}

export const agentBoostService = new AgentBoostService();