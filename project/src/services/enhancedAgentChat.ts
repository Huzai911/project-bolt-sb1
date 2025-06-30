import OpenAI from 'openai';
import { Channel, ChatMessage, Task, ChannelSuggestion } from '../types';
import { tokenTracker } from './tokenTracker';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AgentResponse {
  message: string;
  proposedTasks?: Task[];
  suggestedChannels?: ChannelSuggestion[];
  actionType: 'chat' | 'task-proposals' | 'channel-suggestions' | 'both';
  tokensCost?: number;
}

export async function chatWithAgent(
  channel: Channel,
  userMessage: string,
  chatHistory: ChatMessage[],
  allChannels: Channel[],
  remainingBudget: number
): Promise<AgentResponse> {
  try {
    const recentHistory = chatHistory.slice(-10);
    
    const systemPrompt = `
You are ${channel.agent.name}, an AI agent managing the ${channel.name} channel.

AGENT PROFILE:
- Name: ${channel.agent.name}
- Role: ${channel.agent.role}
- Personality: ${channel.agent.personality}
- Channel: #${channel.name} (${channel.description})
- Budget: $${channel.budgetRemaining} remaining of $${channel.budgetAllocated} allocated

CURRENT CONTEXT:
- Open tasks: ${channel.tasks.filter(t => t.status === 'open').length}
- Active tasks: ${channel.tasks.filter(t => ['claimed', 'in-progress', 'submitted'].includes(t.status)).length}
- Workspace budget remaining: $${remainingBudget}

EXISTING CHANNELS:
${allChannels.map(c => `- #${c.name} (${c.folder}): ${c.description}`).join('\n')}

ABILITIES:
1. Chat conversationally about your domain
2. Propose new tasks (1-10 tasks at once)
3. Suggest new channels when you identify gaps
4. Analyze current situation and recommend actions

TASK PROPOSAL RULES:
- Tasks should be $5-50 range
- Be specific and actionable
- Consider current budget constraints
- Include realistic time estimates

CHANNEL SUGGESTION RULES:
- Only suggest channels that fill genuine gaps
- Consider existing channels to avoid overlap
- Provide clear reasoning for why the channel is needed
- Suggest appropriate budget allocation

RESPONSE FORMAT:
Respond as JSON with this structure:
{
  "message": "Your conversational response to the user",
  "actionType": "chat|task-proposals|channel-suggestions|both",
  "proposedTasks": [
    {
      "title": "Task name",
      "description": "Detailed description",
      "estimatedPay": 25,
      "estimatedTime": "2-3 hours"
    }
  ],
  "suggestedChannels": [
    {
      "name": "channel-name",
      "folder": "Department",
      "description": "What this channel handles",
      "agentName": "AgentName",
      "agentPersonality": "Brief personality",
      "agentRole": "Role description",
      "estimatedBudget": 200,
      "reasoning": "Why this channel is needed",
      "initialTasks": [...]
    }
  ]
}

CONVERSATION STYLE:
- Be helpful and proactive
- Match your personality
- Suggest concrete actions
- Ask clarifying questions when needed
- Be budget-conscious
- Reference your domain expertise

Remember: You're here to help the user succeed in your domain while being mindful of budget and resources.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: "user", content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500
    });

    // Track token usage
    const usage = completion.usage;
    let tokensCost = 0;
    
    if (usage) {
      tokensCost = tokenTracker.trackUsage(
        usage.prompt_tokens,
        usage.completion_tokens,
        "gpt-4.1-mini-2025-04-14",
        `chat-${channel.name}`
      );
    }

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from agent');
    }

    const agentResponse: AgentResponse = JSON.parse(response);

    console.log('EnhancedAgentChat: Raw AI response type:', agentResponse.actionType);
    console.log('EnhancedAgentChat: Proposed tasks count:', agentResponse.proposedTasks?.length || 0);
    console.log('EnhancedAgentChat: Suggested channels count:', agentResponse.suggestedChannels?.length || 0);

    // Add token cost to response
    agentResponse.tokensCost = tokensCost;

    // Add IDs to proposed tasks
    if (agentResponse.proposedTasks) {
      agentResponse.proposedTasks = agentResponse.proposedTasks.map((task, index) => ({
        ...task,
        id: `${channel.id}-proposed-${Date.now()}-${index}`,
        channelId: channel.id,
        status: 'proposed' as const,
        createdAt: new Date(),
        isProposed: true
      }));
      
      console.log('EnhancedAgentChat: Processed proposed tasks:', agentResponse.proposedTasks.length);
    }

    return agentResponse;
  } catch (error) {
    console.error('Error chatting with agent:', error);
    
    return {
      message: "I'm having trouble processing your request right now. Could you try rephrasing that?",
      actionType: 'chat',
      tokensCost: 0
    };
  }
}

function cleanJsonResponse(response: string): string {
  // Remove markdown code block delimiters if present
  const trimmed = response.trim();
  
  // Check if response is wrapped in ```json...```
  if (trimmed.startsWith('```json') && trimmed.endsWith('```')) {
    // Extract content between the delimiters
    const startIndex = trimmed.indexOf('\n') + 1; // Skip the ```json line
    const endIndex = trimmed.lastIndexOf('\n```');
    return trimmed.substring(startIndex, endIndex).trim();
  }
  
  // Check if response is wrapped in ```...```
  if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
    // Extract content between the delimiters
    const startIndex = trimmed.indexOf('\n') + 1; // Skip the ``` line
    const endIndex = trimmed.lastIndexOf('\n```');
    return trimmed.substring(startIndex, endIndex).trim();
  }
  
  return response;
}

export async function suggestChannelsForNeed(
  need: string,
  existingChannels: Channel[],
  remainingBudget: number
): Promise<ChannelSuggestion[]> {
  try {
    const systemPrompt = `
You are an AI business consultant. The user has expressed a need for "${need}".

EXISTING CHANNELS:
${existingChannels.map(c => `- #${c.name} (${c.folder}): ${c.description}`).join('\n')}

REMAINING BUDGET: $${remainingBudget}

Analyze the need and existing channels, then suggest 1-3 new channels that would address this need without duplicating existing functionality.

Return JSON array of channel suggestions:
[
  {
    "name": "channel-name",
    "folder": "Department",
    "description": "What this channel handles",
    "agentName": "AgentName", 
    "agentPersonality": "Brief personality",
    "agentRole": "Role description",
    "estimatedBudget": 200,
    "reasoning": "Why this channel is needed and how it addresses the user's need",
    "initialTasks": [
      {
        "title": "Task name",
        "description": "What needs to be done",
        "estimatedPay": 15,
        "estimatedTime": "2-3 hours"
      }
    ]
  }
]

Guidelines:
- Channel names should be lowercase, no spaces
- Budget should be reasonable portion of remaining budget
- Tasks should be actionable and specific
- Provide clear reasoning for each suggestion
- Don't duplicate existing channels
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need: ${need}` }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Track token usage
    const usage = completion.usage;
    if (usage) {
      tokenTracker.trackUsage(
        usage.prompt_tokens,
        usage.completion_tokens,
        "gpt-4.1-mini-2025-04-14",
        "channel-suggestions"
      );
    }

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const cleanedResponse = cleanJsonResponse(response);
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Error suggesting channels:', error);
    return [];
  }
}