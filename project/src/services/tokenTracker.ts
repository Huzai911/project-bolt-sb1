interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  workspaceTokens: number;
  timestamp: Date;
  model: string;
  operation: string;
}

interface DailyUsage {
  date: string;
  totalTokens: number;
  totalWorkspaceTokens: number;
  totalCost: number;
  operations: TokenUsage[];
}

class TokenTracker {
  private usage: TokenUsage[] = [];

  // WorkspaceTokens: 1 WorkspaceToken = 50 OpenAI tokens
  // Price: $0.001 per WorkspaceToken
  private readonly WORKSPACE_TOKEN_RATIO = 50;
  private readonly WORKSPACE_TOKEN_PRICE = 0.001;

  private convertToWorkspaceTokens(openAiTokens: number): number {
    return Math.ceil(openAiTokens / this.WORKSPACE_TOKEN_RATIO);
  }

  trackUsage(
    promptTokens: number,
    completionTokens: number,
    model: string,
    operation: string
  ): number {
    const totalTokens = promptTokens + completionTokens;
    const workspaceTokens = this.convertToWorkspaceTokens(totalTokens);
    const cost = workspaceTokens * this.WORKSPACE_TOKEN_PRICE;

    const usage: TokenUsage = {
      promptTokens,
      completionTokens,
      totalTokens,
      workspaceTokens,
      cost,
      timestamp: new Date(),
      model,
      operation
    };

    this.usage.push(usage);
    this.saveToStorage();
    
    return cost;
  }

  getTotalCost(days: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.usage
      .filter(u => u.timestamp >= cutoff)
      .reduce((total, u) => total + u.cost, 0);
  }

  getTotalTokens(days: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.usage
      .filter(u => u.timestamp >= cutoff)
      .reduce((total, u) => total + u.workspaceTokens, 0);
  }

  getDailyUsage(days: number = 7): DailyUsage[] {
    const dailyMap = new Map<string, DailyUsage>();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    this.usage
      .filter(u => u.timestamp >= cutoff)
      .forEach(usage => {
        const dateKey = usage.timestamp.toISOString().split('T')[0];
        
        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            date: dateKey,
            totalTokens: 0,
            totalWorkspaceTokens: 0,
            totalCost: 0,
            operations: []
          });
        }

        const daily = dailyMap.get(dateKey)!;
        daily.totalTokens += usage.totalTokens;
        daily.totalWorkspaceTokens += usage.workspaceTokens;
        daily.totalCost += usage.cost;
        daily.operations.push(usage);
      });

    return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  getCurrentMonthCost(): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return this.usage
      .filter(u => u.timestamp >= startOfMonth)
      .reduce((total, u) => total + u.cost, 0);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('tokenUsage', JSON.stringify(this.usage));
    } catch (error) {
      console.warn('Failed to save token usage to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('tokenUsage');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.usage = parsed.map((u: any) => ({
          ...u,
          timestamp: new Date(u.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load token usage from storage:', error);
      this.usage = [];
    }
  }

  constructor() {
    this.loadFromStorage();
  }

  // Export data for account management
  exportUsageData(): string {
    return JSON.stringify({
      usage: this.usage,
      totalCost: this.getTotalCost(),
      totalTokens: this.getTotalTokens(),
      exportDate: new Date()
    }, null, 2);
  }

  clearUsage(): void {
    this.usage = [];
    this.saveToStorage();
  }
}

export const tokenTracker = new TokenTracker();
export type { TokenUsage, DailyUsage };