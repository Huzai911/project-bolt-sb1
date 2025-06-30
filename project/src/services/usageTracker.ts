import { tokenTracker } from './tokenTracker';

export interface UsageLimit {
  tokensAllowance: number;
  tokensUsed: number;
  tokensRemaining: number;
  overageTokens: number;
  overageRate: number;
  estimatedOverageCost: number;
  canContinue: boolean;
}

class UsageTracker {
  private readonly STORAGE_KEY = 'user_usage_limits';
  
  // Get current usage limits for the user
  async getCurrentUsage(): Promise<UsageLimit> {
    try {
      // In production, this would fetch from your backend
      const response = await fetch('/api/usage/current', {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });
      
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      console.error('Failed to fetch usage from backend:', error);
    }
    
    // Fallback to local calculation for demo
    return this.calculateLocalUsage();
  }
  
  private calculateLocalUsage(): UsageLimit {
    const monthlyTokens = tokenTracker.getTotalTokens(30);
    const defaultAllowance = 5000; // Default starter plan
    
    return {
      tokensAllowance: defaultAllowance,
      tokensUsed: monthlyTokens,
      tokensRemaining: Math.max(0, defaultAllowance - monthlyTokens),
      overageTokens: Math.max(0, monthlyTokens - defaultAllowance),
      overageRate: 0.001,
      estimatedOverageCost: Math.max(0, monthlyTokens - defaultAllowance) * 0.001,
      canContinue: monthlyTokens < defaultAllowance * 2, // Hard limit at 2x allowance
    };
  }
  
  // Check if user can make a request
  async checkUsageLimit(estimatedTokens: number = 10): Promise<boolean> {
    const usage = await this.getCurrentUsage();
    
    if (!usage.canContinue) {
      throw new Error('Usage limit exceeded. Please upgrade your plan or wait for next billing cycle.');
    }
    
    // Warn if approaching limits
    if (usage.tokensRemaining < estimatedTokens * 5) {
      console.warn('Approaching token limit. Consider upgrading your plan.');
    }
    
    return true;
  }
  
  // Track a completed operation
  async trackUsage(tokensUsed: number, operation: string): Promise<void> {
    try {
      // Send usage to backend
      await fetch('/api/usage/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify({
          tokensUsed,
          operation,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track usage on backend:', error);
    }
    
    // Always track locally as backup
    tokenTracker.trackUsage(tokensUsed * 50, 0, 'gpt-4', operation);
  }
  
  private getAuthToken(): string {
    return localStorage.getItem('auth_token') || '';
  }
}

export const usageTracker = new UsageTracker();