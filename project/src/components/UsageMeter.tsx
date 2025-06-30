import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import { usageTracker, UsageLimit } from '../services/usageTracker';
import BillingPlansModal from './BillingPlansModal';

const UsageMeter: React.FC = () => {
  const [usage, setUsage] = useState<UsageLimit | null>(null);
  const [showBilling, setShowBilling] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
    // Refresh usage every 30 seconds
    const interval = setInterval(loadUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUsage = async () => {
    try {
      const currentUsage = await usageTracker.getCurrentUsage();
      setUsage(currentUsage);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = (usage.tokensUsed / usage.tokensAllowance) * 100;
  const isNearLimit = usagePercentage > 80;
  const isOverLimit = usage.overageTokens > 0;

  return (
    <>
      <div className={`bg-white rounded-lg shadow-sm p-4 mb-6 border-l-4 ${
        isOverLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : 'border-green-500'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Zap className={`w-5 h-5 ${
              isOverLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <h3 className="font-semibold text-gray-900">Token Usage</h3>
          </div>
          {(isNearLimit || isOverLimit) && (
            <button
              onClick={() => setShowBilling(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              Upgrade Plan
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Usage Bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Monthly Usage</span>
              <span>{usage.tokensUsed.toLocaleString()} / {usage.tokensAllowance.toLocaleString()} tokens</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-start space-x-2">
            {isOverLimit ? (
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
            ) : isNearLimit ? (
              <TrendingUp className="w-4 h-4 text-yellow-600 mt-0.5" />
            ) : (
              <Zap className="w-4 h-4 text-green-600 mt-0.5" />
            )}
            <div className="text-sm">
              {isOverLimit ? (
                <div>
                  <p className="text-red-800 font-medium">
                    Over limit by {usage.overageTokens.toLocaleString()} tokens
                  </p>
                  <p className="text-red-600">
                    Estimated overage cost: ${usage.estimatedOverageCost.toFixed(2)}
                  </p>
                </div>
              ) : isNearLimit ? (
                <p className="text-yellow-800">
                  You're using {usagePercentage.toFixed(0)}% of your monthly allowance. 
                  Consider upgrading to avoid overage charges.
                </p>
              ) : (
                <p className="text-green-800">
                  You have {usage.tokensRemaining.toLocaleString()} tokens remaining this month.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <BillingPlansModal
        isOpen={showBilling}
        onClose={() => setShowBilling(false)}
      />
    </>
  );
};

export default UsageMeter;