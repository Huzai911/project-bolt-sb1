import React, { useState } from 'react';
import { ArrowRight, Loader2, Sparkles, DollarSign, Target, Building } from 'lucide-react';
import { analyzeBusinessAndCreateWorkspace, checkApiKey, type BusinessAnalysis } from '../services/openai';
import { organizationManager } from '../services/organizationManager';

interface BusinessWizardProps {
  onComplete: (organizationId: string) => void;
}

const BusinessWizard: React.FC<BusinessWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [businessDescription, setBusinessDescription] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [organizationName, setOrganizationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);

  React.useEffect(() => {
    // Check API key on component mount
    checkApiKey().then(setApiKeyValid);
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!businessDescription.trim() || selectedGoals.length === 0 || !organizationName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const analysis = await analyzeBusinessAndCreateWorkspace(
        businessDescription,
        monthlyBudget
      );
      
      // Create organization from the analysis
      const organization = organizationManager.createOrganizationFromWorkspace(
        organizationName,
        businessDescription,
        analysis.suggestedChannels,
        analysis.recommendedBudget
      );
      
      onComplete(organization.id);
    } catch (err) {
      setError('Failed to generate workspace. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const businessGoalOptions = [
    { id: 'sales', label: 'Boost Sales & Revenue', icon: '💰', description: 'Increase income and close more deals' },
    { id: 'marketing', label: 'Marketing & Branding', icon: '🎯', description: 'Build brand awareness and reach more customers' },
    { id: 'competitors', label: 'Research Competitors', icon: '🔍', description: 'Analyze competition and market positioning' },
    { id: 'content', label: 'Content Creation', icon: '✍️', description: 'Create engaging content and materials' },
    { id: 'customers', label: 'Customer Acquisition', icon: '👥', description: 'Find and convert new customers' },
    { id: 'product', label: 'Product Development', icon: '🚀', description: 'Improve and develop new products/services' },
    { id: 'operations', label: 'Operations & Efficiency', icon: '⚙️', description: 'Streamline processes and reduce costs' },
    { id: 'social', label: 'Social Media Presence', icon: '📱', description: 'Build and manage social media channels' },
    { id: 'advertising', label: 'Paid Advertising', icon: '📢', description: 'Run effective ad campaigns' },
    { id: 'analytics', label: 'Data & Analytics', icon: '📊', description: 'Track performance and make data-driven decisions' },
    { id: 'partnerships', label: 'Partnerships & Networking', icon: '🤝', description: 'Build strategic relationships' },
    { id: 'automation', label: 'Process Automation', icon: '🤖', description: 'Automate repetitive tasks and workflows' },
  ];

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  if (apiKeyValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">OpenAI API Key Required</h2>
          <p className="text-gray-600 mb-6">
            To use the AI workspace wizard, you need to add your OpenAI API key to the environment variables.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI Platform</a></li>
              <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root</li>
              <li>Add: <code className="bg-gray-200 px-1 rounded">VITE_OPENAI_API_KEY=your_key_here</code></li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (apiKeyValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Checking API connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Workspace Setup</h1>
          <p className="text-gray-600">Let's create the perfect workspace for your business</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step > i ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Building className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Create Your Workspace</h2>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="e.g., Acme Marketing Team, Sarah's SaaS Startup, etc."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description *
                </label>
              <textarea
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="Describe your business, what you do, your industry, and your main products or services..."
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-2">
                Example: "We're a B2B SaaS company that helps small businesses manage their inventory. We're launching our first product and need help with marketing, content creation, and customer acquisition."
              </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">What are your main business goals?</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Select all the areas you want to focus on (choose multiple):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {businessGoalOptions.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedGoals.includes(goal.id)
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <h4 className={`font-medium ${
                          selectedGoals.includes(goal.id) ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {goal.label}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          selectedGoals.includes(goal.id) ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {goal.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedGoals.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    Selected {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Set your monthly budget</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">$</span>
                    <input
                      type="number"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  This budget will be distributed across AI agents to manage freelancer tasks and projects.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={step === 1}
            className={`px-6 py-2 rounded-lg transition-colors ${
              step === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && (!businessDescription.trim() || !organizationName.trim())) || 
                (step === 2 && selectedGoals.length === 0)
              }
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                (step === 1 && (!businessDescription.trim() || !organizationName.trim())) || 
                (step === 2 && selectedGoals.length === 0)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={loading || !businessDescription.trim() || selectedGoals.length === 0 || !organizationName.trim()}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${
                loading || !businessDescription.trim() || selectedGoals.length === 0 || !organizationName.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessWizard;