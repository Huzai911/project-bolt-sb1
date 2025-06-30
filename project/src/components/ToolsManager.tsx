import React, { useState, useEffect } from 'react';
import { Plus, X, Search, Globe, Database, MessageSquare, FileSpreadsheet, Zap, Mail, Camera, BarChart3, Users, Shield, CheckCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  integrationLevel: 'high' | 'medium' | 'low';
  automationPotential: string[];
}

interface ToolsManagerProps {
  onClose: () => void;
}

const popularTools: Tool[] = [
  // Communication & Collaboration
  { id: 'slack', name: 'Slack', category: 'Communication', description: 'Team messaging and collaboration', icon: '💬', integrationLevel: 'high', automationPotential: ['message-automation', 'workflow-triggers', 'data-posting'] },
  { id: 'discord', name: 'Discord', category: 'Communication', description: 'Voice, video and text communication', icon: '🎮', integrationLevel: 'medium', automationPotential: ['bot-automation', 'announcement-posting'] },
  { id: 'teams', name: 'Microsoft Teams', category: 'Communication', description: 'Microsoft collaboration platform', icon: '👥', integrationLevel: 'high', automationPotential: ['meeting-automation', 'file-sharing', 'workflow-integration'] },
  { id: 'zoom', name: 'Zoom', category: 'Communication', description: 'Video conferencing platform', icon: '📹', integrationLevel: 'medium', automationPotential: ['meeting-scheduling', 'recording-processing'] },

  // Productivity & Documents
  { id: 'google-sheets', name: 'Google Sheets', category: 'Productivity', description: 'Cloud-based spreadsheet application', icon: '📊', integrationLevel: 'high', automationPotential: ['data-processing', 'reporting', 'form-automation', 'calculations'] },
  { id: 'excel', name: 'Microsoft Excel', category: 'Productivity', description: 'Spreadsheet and data analysis tool', icon: '📈', integrationLevel: 'high', automationPotential: ['data-analysis', 'reporting', 'macro-automation'] },
  { id: 'google-docs', name: 'Google Docs', category: 'Productivity', description: 'Collaborative document editing', icon: '📝', integrationLevel: 'high', automationPotential: ['document-generation', 'content-automation'] },
  { id: 'notion', name: 'Notion', category: 'Productivity', description: 'All-in-one workspace', icon: '📋', integrationLevel: 'high', automationPotential: ['database-automation', 'template-generation', 'workflow-management'] },
  { id: 'airtable', name: 'Airtable', category: 'Productivity', description: 'Database and spreadsheet hybrid', icon: '🗃️', integrationLevel: 'high', automationPotential: ['database-automation', 'form-processing', 'data-sync'] },

  // Development & Automation
  { id: 'app-scripts', name: 'Google Apps Script', category: 'Automation', description: 'JavaScript platform for Google Workspace', icon: '⚙️', integrationLevel: 'high', automationPotential: ['google-automation', 'data-processing', 'email-automation', 'sheet-automation'] },
  { id: 'zapier', name: 'Zapier', category: 'Automation', description: 'App integration and automation platform', icon: '🔗', integrationLevel: 'high', automationPotential: ['workflow-automation', 'data-sync', 'trigger-actions'] },
  { id: 'power-automate', name: 'Power Automate', category: 'Automation', description: 'Microsoft workflow automation', icon: '🌊', integrationLevel: 'high', automationPotential: ['microsoft-automation', 'approval-workflows', 'data-processing'] },

  // Email & Marketing
  { id: 'gmail', name: 'Gmail', category: 'Email', description: 'Google email service', icon: '✉️', integrationLevel: 'high', automationPotential: ['email-automation', 'template-generation', 'response-automation'] },
  { id: 'outlook', name: 'Outlook', category: 'Email', description: 'Microsoft email and calendar', icon: '📧', integrationLevel: 'high', automationPotential: ['email-automation', 'calendar-management', 'contact-management'] },
  { id: 'mailchimp', name: 'Mailchimp', category: 'Marketing', description: 'Email marketing platform', icon: '🐵', integrationLevel: 'high', automationPotential: ['email-campaigns', 'audience-segmentation', 'analytics-reporting'] },

  // Social Media & Content
  { id: 'facebook', name: 'Facebook', category: 'Social Media', description: 'Social networking platform', icon: '📘', integrationLevel: 'medium', automationPotential: ['content-posting', 'ad-management', 'analytics-tracking'] },
  { id: 'instagram', name: 'Instagram', category: 'Social Media', description: 'Photo and video sharing', icon: '📷', integrationLevel: 'medium', automationPotential: ['content-scheduling', 'hashtag-research', 'engagement-tracking'] },
  { id: 'linkedin', name: 'LinkedIn', category: 'Social Media', description: 'Professional networking', icon: '💼', integrationLevel: 'medium', automationPotential: ['content-posting', 'lead-generation', 'analytics-tracking'] },

  // Analytics & Data
  { id: 'google-analytics', name: 'Google Analytics', category: 'Analytics', description: 'Web analytics service', icon: '📊', integrationLevel: 'high', automationPotential: ['data-extraction', 'report-generation', 'performance-monitoring'] },
  { id: 'hubspot', name: 'HubSpot', category: 'CRM', description: 'Customer relationship management', icon: '🎯', integrationLevel: 'high', automationPotential: ['lead-management', 'contact-automation', 'reporting'] },
  { id: 'salesforce', name: 'Salesforce', category: 'CRM', description: 'Customer relationship management', icon: '☁️', integrationLevel: 'high', automationPotential: ['lead-processing', 'data-entry', 'report-generation'] },

  // Design & Creative
  { id: 'figma', name: 'Figma', category: 'Design', description: 'Collaborative design tool', icon: '🎨', integrationLevel: 'medium', automationPotential: ['design-handoff', 'asset-export', 'version-management'] },
  { id: 'canva', name: 'Canva', category: 'Design', description: 'Graphic design platform', icon: '🖌️', integrationLevel: 'medium', automationPotential: ['template-generation', 'brand-consistency', 'bulk-creation'] },
];

const ToolsManager: React.FC<ToolsManagerProps> = ({ onClose }) => {
  const [selectedTools, setSelectedTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customTool, setCustomTool] = useState('');

  // Load saved tools from localStorage
  useEffect(() => {
    const savedTools = localStorage.getItem('user_tools');
    if (savedTools) {
      try {
        const parsed = JSON.parse(savedTools);
        setSelectedTools(parsed);
      } catch (error) {
        console.error('Failed to load saved tools:', error);
      }
    }
  }, []);

  // Save tools to localStorage
  const saveTools = (tools: Tool[]) => {
    localStorage.setItem('user_tools', JSON.stringify(tools));
    setSelectedTools(tools);
  };

  const addTool = (tool: Tool) => {
    if (!selectedTools.find(t => t.id === tool.id)) {
      const newTools = [...selectedTools, tool];
      saveTools(newTools);
    }
  };

  const removeTool = (toolId: string) => {
    const newTools = selectedTools.filter(t => t.id !== toolId);
    saveTools(newTools);
  };

  const addCustomTool = () => {
    if (customTool.trim() && !selectedTools.find(t => t.name.toLowerCase() === customTool.trim().toLowerCase())) {
      const newTool: Tool = {
        id: `custom-${Date.now()}`,
        name: customTool.trim(),
        category: 'Custom',
        description: 'Custom tool added by user',
        icon: '🔧',
        integrationLevel: 'low',
        automationPotential: ['custom-integration']
      };
      const newTools = [...selectedTools, newTool];
      saveTools(newTools);
      setCustomTool('');
    }
  };

  const categories = ['All', ...Array.from(new Set(popularTools.map(tool => tool.category)))];
  
  const filteredTools = popularTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Communication': return <MessageSquare className="w-4 h-4" />;
      case 'Productivity': return <FileSpreadsheet className="w-4 h-4" />;
      case 'Automation': return <Zap className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Marketing': return <BarChart3 className="w-4 h-4" />;
      case 'Social Media': return <Camera className="w-4 h-4" />;
      case 'Analytics': return <BarChart3 className="w-4 h-4" />;
      case 'CRM': return <Users className="w-4 h-4" />;
      case 'Design': return <Camera className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  const getIntegrationBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">High Integration</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Medium Integration</span>;
      case 'low':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Basic Integration</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Manage Your Tools</h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Selected Tools */}
      {selectedTools.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Your Current Tools ({selectedTools.length})</h4>
          <div className="flex flex-wrap gap-2">
            {selectedTools.map(tool => (
              <div
                key={tool.id}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-lg border border-blue-200"
              >
                <span>{tool.icon}</span>
                <span className="text-sm font-medium">{tool.name}</span>
                <button
                  onClick={() => removeTool(tool.id)}
                  className="p-1 hover:bg-blue-200 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category !== 'All' && getCategoryIcon(category)}
              <span>{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Tool Input */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-medium text-gray-900 mb-2">Add Custom Tool</h4>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Tool name (e.g., Custom CRM, Internal System)"
            value={customTool}
            onChange={(e) => setCustomTool(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addCustomTool()}
          />
          <button
            onClick={addCustomTool}
            disabled={!customTool.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Available Tools */}
      <div className="max-h-96 overflow-y-auto">
        <h4 className="font-medium text-gray-900 mb-3">Popular Tools</h4>
        <div className="grid grid-cols-1 gap-3">
          {filteredTools.map(tool => {
            const isSelected = selectedTools.find(t => t.id === tool.id);
            return (
              <div
                key={tool.id}
                className={`border rounded-lg p-3 transition-all ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{tool.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{tool.name}</h5>
                        {getIntegrationBadge(tool.integrationLevel)}
                      </div>
                      <p className="text-sm text-gray-600">{tool.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tool.automationPotential.slice(0, 3).map((potential, index) => (
                          <span key={index} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {potential}
                          </span>
                        ))}
                        {tool.automationPotential.length > 3 && (
                          <span className="text-xs text-gray-500">+{tool.automationPotential.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => isSelected ? removeTool(tool.id) : addTool(tool)}
                    className={`p-2 rounded-full transition-colors ${
                      isSelected
                        ? 'text-green-600 bg-green-100 hover:bg-green-200'
                        : 'text-gray-400 hover:text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    {isSelected ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h5 className="font-medium text-blue-900">How This Helps</h5>
              <p className="text-sm text-blue-800">
                AI automation suggestions will be tailored to work with your existing tools, focusing on ChatGPT integrations 
                and simple automations rather than complex development.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsManager;