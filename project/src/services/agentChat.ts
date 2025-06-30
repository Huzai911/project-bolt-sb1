import OpenAI from 'openai';
import { Channel, ChatMessage, Task, ChannelSuggestion } from '../types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AgentResponse {
  message: string;
  proposedTasks?: Task[];
  suggestedChannels?: ChannelSuggestion[];
  actionType: 'chat' | 'task-proposals' | 'channel-suggestions' | 'both';
}

export async function chatWithAgent(
  channel: Channel,
  userMessage: string,
  chatHistory: ChatMessage[],
  allChannels: Channel[],
  remainingBudget: number
): Promise<AgentResponse> {
  try {
    const recentHistory = chatHistory.slice(-10); // Last 10 messages for context
    
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
      model: "gpt-4",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from agent');
    }

    const agentResponse: AgentResponse = JSON.parse(response);

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
    }

    return agentResponse;
  } catch (error) {
    console.error('Error chatting with agent:', error);
    
    // Fallback response
    return {
      message: "I'm having trouble processing your request right now. Could you try rephrasing that?",
      actionType: 'chat'
    };
  }
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
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need: ${need}` }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    return JSON.parse(response);
  } catch (error) {
    console.error('Error suggesting channels:', error);
    return [];
  }
}