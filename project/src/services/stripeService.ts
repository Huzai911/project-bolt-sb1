import Stripe from 'stripe';

// Server-side Stripe instance (this would be in your backend)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Client-side types and utilities
export interface BillingPlan {
  id: string;
  name: string;
  priceId: string; // Stripe Price ID
  monthlyPrice: number;
  features: string[];
  tokenAllowance: number; // Monthly token allowance
  overage: number; // Price per token over allowance
}

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceId: 'price_starter_monthly', // Your Stripe Price ID
    monthlyPrice: 29,
    features: ['5,000 WorkspaceTokens/month', 'Basic AI agents', 'Email support'],
    tokenAllowance: 5000,
    overage: 0.001,
  },
  {
    id: 'professional',
    name: 'Professional',
    priceId: 'price_pro_monthly',
    monthlyPrice: 99,
    features: ['25,000 WorkspaceTokens/month', 'Advanced AI agents', 'Priority support', 'Team collaboration'],
    tokenAllowance: 25000,
    overage: 0.0008,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceId: 'price_enterprise_monthly',
    monthlyPrice: 299,
    features: ['100,000 WorkspaceTokens/month', 'Custom AI agents', '24/7 support', 'Advanced analytics'],
    tokenAllowance: 100000,
    overage: 0.0005,
  },
];

export interface UserSubscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  tokensUsed: number;
  tokensAllowance: number;
}

// Client-side service for billing operations
export class BillingService {
  private baseUrl = process.env.VITE_API_BASE_URL || '/api';

  async createCheckoutSession(planId: string): Promise<{ url: string }> {
    const response = await fetch(`${this.baseUrl}/billing/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
      body: JSON.stringify({ planId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return response.json();
  }

  async getSubscription(): Promise<UserSubscription | null> {
    const response = await fetch(`${this.baseUrl}/billing/subscription`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get subscription');
    }

    return response.json();
  }

  async getBillingPortalUrl(): Promise<{ url: string }> {
    const response = await fetch(`${this.baseUrl}/billing/portal`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get billing portal URL');
    }

    return response.json();
  }

  async getUsageStats(): Promise<{
    currentUsage: number;
    allowance: number;
    overage: number;
    estimatedBill: number;
  }> {
    const response = await fetch(`${this.baseUrl}/billing/usage`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get usage stats');
    }

    return response.json();
  }

  private getAuthToken(): string {
    // Replace with your actual auth token retrieval
    return localStorage.getItem('auth_token') || '';
  }
}

export const billingService = new BillingService();