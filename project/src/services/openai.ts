import OpenAI from 'openai';

// Helper function to clean JSON response from markdown code blocks
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();
  
  // Remove various forms of markdown code block delimiters
  cleaned = cleaned.replace(/^```(?:json|javascript|js)?\s*\n?/i, '');
  cleaned = cleaned.replace(/\n?\s*```\s*$/i, '');
  
  // Remove any leading/trailing text that's not part of JSON
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  }
  
  return cleaned.trim();
}

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChannelSuggestion {
  name: string;
  folder: string;
  description: string;
  agentName: string;
  agentPersonality: string;
  agentRole: string;
  estimatedBudget: number;
  initialTasks: Array<{
    title: string;
    description: string;
    estimatedPay: number;
    estimatedTime: string;
  }>;
}

export interface BusinessAnalysis {
  businessType: string;
  keyAreas: string[];
  suggestedChannels: ChannelSuggestion[];
  recommendedBudget: number;
}

export async function analyzeBusinessAndCreateWorkspace(
  businessDescription: string,
  monthlyBudget: number
): Promise<BusinessAnalysis> {
  try {
    const prompt = `You are a world-class business strategist creating the ultimate AI workspace. You MUST create exactly 12 channels distributed across 3 folders.

BUSINESS: ${businessDescription}
MONTHLY BUDGET: $${monthlyBudget}

CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE EXACTLY:
1. Create EXACTLY 3 folders that best serve this business
2. Each folder MUST have exactly 4 specialized channels (total 12 channels)
3. Channel names must be specific like "meta-ads-static", "competitor-research", "email-sequences"
4. Budget should be distributed evenly across the 3 folders (33% each)

FOLDER STRUCTURE should be the 3 most important areas for this specific business based on their description and goals.

FOR EACH CHANNEL, CREATE:
- Specific agent with relevant personality
- EXACTLY 2 initial tasks mixing research, creation, and implementation
- Budget allocation based on revenue impact
- Mix of AI-suitable and freelancer tasks

RESPONSE FORMAT - RETURN EXACTLY THIS JSON STRUCTURE:
{
  "businessType": "Brief classification",
  "keyAreas": ["folder1", "folder2", "folder3"],
  "recommendedBudget": ${monthlyBudget},
  "suggestedChannels": [
    {
      "name": "meta-ads-static",
      "folder": "Folder1",
      "description": "Meta static ad creation and optimization with AI copywriting and freelancer design",
      "agentName": "MetaAdsBot",
      "agentPersonality": "Strategic and data-driven, focused on conversion optimization",
      "agentRole": "Meta Advertising Specialist",
      "estimatedBudget": 83,
      "initialTasks": [
        {
          "title": "Competitor Ad Analysis Report",
          "description": "Research top 10 competitors' Meta ads, create comprehensive analysis PDF with winning patterns",
          "estimatedPay": 30,
          "estimatedTime": "3-4 hours"
        },
        {
          "title": "Landing Page Optimization Plan",
          "description": "Audit current landing pages and create detailed optimization recommendations",
          "estimatedPay": 20,
          "estimatedTime": "2 hours"
        }
      ]
    }
    // CONTINUE THIS PATTERN FOR ALL 12 CHANNELS
  ]
}

YOU MUST CREATE ALL 12 CHANNELS. DO NOT STOP EARLY. ENSURE EVERY FOLDER HAS EXACTLY 4 CHANNELS.

Budget Distribution:
- Folder 1 (4 channels): $${Math.floor(monthlyBudget * 0.33)} total
- Folder 2 (4 channels): $${Math.floor(monthlyBudget * 0.33)} total  
- Folder 3 (4 channels): $${Math.floor(monthlyBudget * 0.34)} total

Each task should be $10-50, with most being $15-35. Focus on actionable deliverables that create real business value.

CRITICAL: You must return a complete JSON response with all 12 channels. Do not truncate or stop early.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a world-class business strategist. You MUST create exactly 12 specialized channels distributed across 3 folders as specified. Return ONLY valid JSON with all channels included. Do not truncate your response."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6, // Reduced for more consistent output
      max_tokens: 6000 // Sufficient for 12 channels
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to remove markdown code block delimiters
    const cleanedResponse = cleanJsonResponse(response);

    // Parse the JSON response
    let analysis: BusinessAnalysis;
    try {
      analysis = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', response);
      console.error('Cleaned Response:', cleanedResponse);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate the response structure
    if (!analysis.suggestedChannels || !Array.isArray(analysis.suggestedChannels)) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Validate we have enough channels
    if (analysis.suggestedChannels.length < 10) {
      console.warn(`Only generated ${analysis.suggestedChannels.length} channels, expected at least 10`);
      throw new Error('AI did not generate enough channels. Please try again.');
    }

    // Validate folder distribution
    const folderCounts = analysis.suggestedChannels.reduce((acc, channel) => {
      acc[channel.folder] = (acc[channel.folder] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Channel distribution by folder:', folderCounts);

    // Check if any folder has too few channels
    const minChannelsPerFolder = 2;
    const foldersWithTooFew = Object.entries(folderCounts).filter(([_, count]) => count < minChannelsPerFolder);
    
    if (foldersWithTooFew.length > 0) {
      console.warn('Some folders have too few channels:', foldersWithTooFew);
      // Don't throw error, just warn - the user can regenerate if needed
    }

    return analysis;

  } catch (error) {
    console.error('Error analyzing business:', error);
    
    // Enhanced error message
    if (error instanceof Error) {
      throw new Error(`Failed to generate comprehensive workspace: ${error.message}. Please check your API key and try again.`);
    }
    
    throw new Error('Failed to generate comprehensive workspace with AI. Please check your API key and try again.');
  }
}

export async function checkApiKey(): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.error('API key validation failed: No API key found or using placeholder value');
      return false;
    }

    console.log('Testing OpenAI API key...');
    
    // Test the API key with a simple request
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 5
    });

    console.log('API key validation successful');
    return true;
  } catch (error) {
    console.error('API key validation failed:', error);
    
    // Provide more specific error information
    try {
      // Safely extract error information
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = errorMessage.toLowerCase();
      
      if (errorString.includes('401') || errorString.includes('unauthorized')) {
        console.error('API key is invalid or expired. Please check your OpenAI API key.');
      } else if (errorString.includes('429') || errorString.includes('rate limit')) {
        console.error('Rate limit exceeded. Please try again later.');
      } else if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('connection')) {
        console.error('Network error. Please check your internet connection.');
      } else if (errorString.includes('cors')) {
        console.error('CORS error. API calls may be blocked by browser security policies.');
      } else {
        console.error('API connection failed:', errorMessage);
      }
    } catch (errorHandlingError) {
      // Fallback if even error handling fails
      console.error('Failed to process error details:', errorHandlingError);
      console.error('Original error:', error);
    }
    
    return false;
  }
}