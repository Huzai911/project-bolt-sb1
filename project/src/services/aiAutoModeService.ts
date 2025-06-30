import OpenAI from 'openai';
import { Channel } from '../types';
import { tokenTracker } from './tokenTracker';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface AIPromptOption {
  id: string;
  title: string;
  prompt: string;
  description: string;
  focusArea: string;
  expectedOutcomes: string[];
}

export interface AIAutoModeResponse {
  promptOptions: AIPromptOption[];
  recommendedChannels: string[];
  reasoning: string;
}

class AIAutoModeService {
  private readonly AUTO_MODE_COST = 0.99;

  async generatePromptOptions(
    currentChannel: Channel,
    allChannels: Channel[]
  ): Promise<AIAutoModeResponse> {
    try {
      const channelProfiles = this.createChannelProfiles(allChannels.filter(c => c.id !== currentChannel.id));
      const currentChannelProfile = this.createChannelProfile(currentChannel);

      const systemPrompt = `
You are an AI collaboration strategist creating optimal prompts for ${currentChannelProfile.agent.name} to reach out to other departments.

CURRENT CHANNEL PROFILE:
Name: ${currentChannelProfile.name}
Agent: ${currentChannelProfile.agent.name} (${currentChannelProfile.agent.role})
Personality: ${currentChannelProfile.agent.personality}
Description: ${currentChannelProfile.description}
Recent work: ${currentChannelProfile.recentWork || 'Setting up workflows'}
Budget: $${currentChannelProfile.budget.remaining} remaining
Context: ${currentChannelProfile.context.substring(0, 200)}

AVAILABLE CHANNELS:
${channelProfiles.map(profile => `
${profile.name}: ${profile.agent.name} - ${profile.agent.role}
  Focus: ${profile.description}
  Recent: ${profile.recentWork || 'Getting started'}
  Personality: ${profile.agent.personality.split(',')[0]}
`).join('\n')}

TASK: Generate 2 strategic prompt options that ${currentChannelProfile.agent.name} could use to start valuable conversations.

PROMPT REQUIREMENTS:
1. Each prompt should be 60-80 words
2. Include specific context from ${currentChannelProfile.name}'s recent work
3. Ask strategic questions that reveal insights
4. Mention collaboration opportunities
5. Be conversational and professional

FOCUS AREAS:
- Marketing intelligence and competitive insights
- Process optimization and efficiency gains  
- Cross-departmental collaboration opportunities
- Resource sharing and best practices
- Strategic planning and market opportunities

Return JSON:
{
  "promptOptions": [
    {
      "id": "option1",
      "title": "Strategic Intelligence Gathering",
      "prompt": "Your 60-80 word prompt here...",
      "description": "Brief description of what this approach achieves",
      "focusArea": "intelligence/optimization/collaboration/etc",
      "expectedOutcomes": ["outcome1", "outcome2", "outcome3"]
    },
    {
      "id": "option2", 
      "title": "Collaborative Process Enhancement",
      "prompt": "Your 60-80 word prompt here...",
      "description": "Brief description of what this approach achieves", 
      "focusArea": "intelligence/optimization/collaboration/etc",
      "expectedOutcomes": ["outcome1", "outcome2", "outcome3"]
    }
  ],
  "recommendedChannels": ["channel-id-1", "channel-id-2", "channel-id-3"],
  "reasoning": "Brief explanation of why these channels and prompts work well together"
}

Make prompts specific to ${currentChannelProfile.name}'s domain while being valuable to other departments.
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate 2 strategic prompt options for ${currentChannel.agent.name} to gather insights and build collaboration with other departments.` }
        ],
        temperature: 0.8,
        max_tokens: 800
      });

      const usage = completion.usage;
      if (usage) {
        tokenTracker.trackUsage(
          usage.prompt_tokens,
          usage.completion_tokens,
          "gpt-4o-mini",
          "ai-auto-mode-prompts"
        );
      }

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from AI');
      }

      const cleanedResponse = this.cleanJsonResponse(response);
      return JSON.parse(cleanedResponse);

    } catch (error) {
      console.error('Error generating AI prompt options:', error);
      
      // Fallback options
      return this.generateFallbackOptions(currentChannel);
    }
  }

  private createChannelProfile(channel: Channel) {
    const recentTasks = channel.tasks.slice(0, 2).map(t => t.title);
    return {
      id: channel.id,
      name: channel.name,
      description: channel.description,
      agent: {
        name: channel.agent.name,
        role: channel.agent.role,
        personality: channel.agent.personality,
      },
      context: channel.userNotes || 'No specific context provided',
      budget: {
        allocated: channel.budgetAllocated,
        remaining: channel.budgetRemaining,
        spent: channel.budgetSpent
      },
      recentWork: recentTasks.join(', ')
    };
  }

  private createChannelProfiles(channels: Channel[]) {
    return channels.map(this.createChannelProfile);
  }

  private cleanJsonResponse(response: string): string {
    return response
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private generateFallbackOptions(currentChannel: Channel): AIAutoModeResponse {
    return {
      promptOptions: [
        {
          id: "option1",
          title: "Cross-Department Intelligence",
          prompt: `Hi! I'm ${currentChannel.agent.name} from ${currentChannel.name}. We've been working on ${currentChannel.description.toLowerCase()} and have uncovered some interesting patterns. I'd love to hear what your department has been focusing on lately and see if there are areas where we might share insights or collaborate on upcoming projects.`,
          description: "Focuses on sharing insights and discovering collaboration opportunities",
          focusArea: "intelligence",
          expectedOutcomes: ["Learn about other department priorities", "Identify collaboration opportunities", "Share valuable insights"]
        },
        {
          id: "option2",
          title: "Process Optimization Exchange",
          prompt: `Hello from ${currentChannel.name}! I've been optimizing our ${currentChannel.description.toLowerCase()} processes and would value your perspective. What tools or strategies has your team found most effective recently? I'm particularly interested in hearing about any challenges you've overcome that might relate to our work.`,
          description: "Emphasizes process improvement and tool sharing",
          focusArea: "optimization", 
          expectedOutcomes: ["Discover new tools and methods", "Share process improvements", "Build strategic partnerships"]
        }
      ],
      recommendedChannels: [],
      reasoning: "These prompts focus on mutual benefit and knowledge sharing across departments."
    };
  }

  getAutoModeCost(): number {
    return this.AUTO_MODE_COST;
  }
}

export const aiAutoModeService = new AIAutoModeService();