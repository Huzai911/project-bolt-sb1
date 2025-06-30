import { generateChannelsFromSuggestions } from '../utils/channelGenerator';

interface StoredOrganization {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  ownerId: string;
  channels: any[];
  monthlyBudget: number;
  totalSpent: number;
  totalRemaining: number;
  lastAccessed: string;
}

class OrganizationManager {
  private readonly STORAGE_KEY = 'workspace_organizations';
  private readonly CURRENT_ORG_KEY = 'current_organization_id';

  saveOrganization(organization: StoredOrganization): void {
    try {
      const organizations = this.getOrganizations();
      const existingIndex = organizations.findIndex(org => org.id === organization.id);
      
      if (existingIndex >= 0) {
        organizations[existingIndex] = organization;
      } else {
        organizations.push(organization);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(organizations));
      localStorage.setItem(this.CURRENT_ORG_KEY, organization.id);
    } catch (error) {
      console.error('Failed to save organization:', error);
    }
  }

  getOrganizations(): StoredOrganization[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load organizations:', error);
      return [];
    }
  }

  getOrganization(id: string): StoredOrganization | null {
    const organizations = this.getOrganizations();
    return organizations.find(org => org.id === id) || null;
  }

  getCurrentOrganizationId(): string | null {
    return localStorage.getItem(this.CURRENT_ORG_KEY);
  }

  setCurrentOrganization(id: string): void {
    localStorage.setItem(this.CURRENT_ORG_KEY, id);
    
    // Update last accessed time
    const organizations = this.getOrganizations();
    const orgIndex = organizations.findIndex(org => org.id === id);
    if (orgIndex >= 0) {
      organizations[orgIndex].lastAccessed = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(organizations));
    }
  }

  deleteOrganization(id: string): void {
    try {
      const organizations = this.getOrganizations();
      const filtered = organizations.filter(org => org.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      
      // If we deleted the current org, clear the current org ID
      if (this.getCurrentOrganizationId() === id) {
        localStorage.removeItem(this.CURRENT_ORG_KEY);
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
    }
  }

  createOrganizationFromWorkspace(
    name: string,
    description: string,
    suggestedChannels: any[],
    monthlyBudget: number,
    totalSpent: number = 0
  ): StoredOrganization {
    // Use the generateChannelsFromSuggestions utility to properly create channels with all required properties
    const generatedChannels = generateChannelsFromSuggestions(suggestedChannels);
    
    // Enhance generated channels with budget allocation and additional properties
    const channels = generatedChannels.map(channel => ({
      ...channel,
      budgetAllocated: channel.budgetAllocated || Math.floor(monthlyBudget / suggestedChannels.length),
      budgetSpent: 0,
      budgetRemaining: channel.budgetAllocated || Math.floor(monthlyBudget / suggestedChannels.length),
      proposedTasks: [],
      chatHistory: [],
      tasks: channel.tasks || [],
    }));

    const organization: StoredOrganization = {
      id: `org-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      ownerId: 'current-user', // In a real app, this would be the actual user ID
      channels,
      monthlyBudget,
      totalSpent,
      totalRemaining: monthlyBudget - totalSpent,
    };

    this.saveOrganization(organization);
    return organization;
  }

  updateOrganizationChannels(id: string, channels: any[], totalSpent: number): void {
    console.log('OrganizationManager: Updating channels for org:', id);
    console.log('OrganizationManager: Channels to save:', channels.length);
    
    // Log proposed tasks for debugging
    channels.forEach(channel => {
      if (channel.proposedTasks && channel.proposedTasks.length > 0) {
        console.log(`OrganizationManager: Channel ${channel.name} has ${channel.proposedTasks.length} proposed tasks`);
      }
    });
    
    const organization = this.getOrganization(id);
    if (organization) {
      // Ensure all channel data is properly preserved
      const updatedChannels = channels.map(channel => ({
        ...channel,
        // Ensure all arrays exist
        tasks: channel.tasks || [],
        proposedTasks: channel.proposedTasks || [],
        chatHistory: channel.chatHistory || [],
        // Ensure budget fields are numbers
        budgetAllocated: typeof channel.budgetAllocated === 'number' ? channel.budgetAllocated : 0,
        budgetSpent: typeof channel.budgetSpent === 'number' ? channel.budgetSpent : 0,
        budgetRemaining: typeof channel.budgetRemaining === 'number' ? channel.budgetRemaining : 
          (typeof channel.budgetAllocated === 'number' ? channel.budgetAllocated : 0) - 
          (typeof channel.budgetSpent === 'number' ? channel.budgetSpent : 0)
      }));
      
      organization.channels = updatedChannels;
      organization.totalSpent = totalSpent;
      organization.totalRemaining = organization.monthlyBudget - totalSpent;
      organization.lastAccessed = new Date().toISOString();
      this.saveOrganization(organization);
      console.log('OrganizationManager: Organization updated successfully');
      
      // Verify the save worked
      const savedOrg = this.getOrganization(id);
      if (savedOrg) {
        const totalProposedTasks = savedOrg.channels.reduce((total, ch) => total + (ch.proposedTasks?.length || 0), 0);
        console.log('OrganizationManager: Verification - Total proposed tasks saved:', totalProposedTasks);
      }
    }
  }

  updateOrganizationBudget(id: string, newBudget: number): void {
    const organization = this.getOrganization(id);
    if (organization) {
      organization.monthlyBudget = newBudget;
      organization.totalRemaining = newBudget - organization.totalSpent;
      organization.lastAccessed = new Date().toISOString();
      this.saveOrganization(organization);
    }
  }
}

export const organizationManager = new OrganizationManager();
export type { StoredOrganization };