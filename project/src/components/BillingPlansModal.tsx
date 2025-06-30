import React, { useState } from 'react';
import { X, Check, CreditCard, Loader2 } from 'lucide-react';
import { BILLING_PLANS, billingService } from '../services/stripeService';

interface BillingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string;
}

const BillingPlansModal: React.FC<BillingPlansModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (planId: string) => {
    try {
      setLoading(planId);
      const { url } = await billingService.createCheckoutSession(planId);
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
              <p className="text-gray-600">Select the perfect plan for your AI workspace needs</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BILLING_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative border-2 rounded-xl p-6 transition-all ${
                  plan.id === 'professional'
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : currentPlanId === plan.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {plan.id === 'professional' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {currentPlanId === plan.id && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <Check className="w-4 h-4" />
                      <span>Current</span>
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    ${plan.monthlyPrice}
                    <span className="text-lg font-normal text-gray-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id || currentPlanId === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                    currentPlanId === plan.id
                      ? 'bg-green-100 text-green-800 cursor-not-allowed'
                      : plan.id === 'professional'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : currentPlanId === plan.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Current Plan</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Select Plan</span>
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Overage: ${plan.overage.toFixed(4)} per extra token
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">What are WorkspaceTokens?</h4>
            <p className="text-sm text-gray-600 mb-2">
              WorkspaceTokens are used when your AI agents process requests, generate tasks, or analyze data.
              Each WorkspaceToken equals approximately 50 OpenAI tokens.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-500">
              <div>• Simple chat: ~2-5 tokens</div>
              <div>• Task generation: ~10-20 tokens</div>
              <div>• Complex analysis: ~20-50 tokens</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPlansModal;