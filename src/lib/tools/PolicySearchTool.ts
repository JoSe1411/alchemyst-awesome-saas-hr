import { Tool } from 'langchain/tools';
import { EnhancedMemoryManager } from '../EnhancedMemoryManager';

interface ToolInput {
  action: 'search' | 'get_policy' | 'list_policies';
  query?: string;
  policyId?: string;
  category?: string;
}

interface PolicyResult {
  id: string;
  title: string;
  category: string;
  summary: string;
  lastUpdated: string;
  relevanceScore?: number;
  snippet?: string;
}

/**
 * LangChain Tool for HR policy search and retrieval
 */
export class PolicySearchTool extends Tool {
  name = 'policy_search';
  description = `Searches and retrieves HR policies, procedures, and guidelines.
  
  Input should be a JSON string with:
  - action: 'search' | 'get_policy' | 'list_policies'
  - query: Search terms for policies (for search action)
  - policyId: Specific policy identifier (for get_policy action)
  - category: Policy category filter (optional for search and list)
  
  Returns relevant policy information, summaries, and guidance.`;

  private memoryManager: EnhancedMemoryManager;

  constructor(memoryManager: EnhancedMemoryManager) {
    super();
    this.memoryManager = memoryManager;
  }

  async _call(input: string): Promise<string> {
    try {
      const parsedInput: ToolInput = JSON.parse(input);
      const { action } = parsedInput;

      switch (action) {
        case 'search':
          return await this.searchPolicies(parsedInput);
        case 'get_policy':
          return await this.getPolicy(parsedInput);
        case 'list_policies':
          return await this.listPolicies(parsedInput);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to process policy search operation'
      });
    }
  }

  /**
   * Search through HR policies
   */
  private async searchPolicies(input: ToolInput): Promise<string> {
    const { query, category } = input;

    if (!query) {
      throw new Error('query is required for search action');
    }

    // Mock policy database - in production this would query a real database
    const mockPolicies: PolicyResult[] = [
      {
        id: 'pol_001',
        title: 'Remote Work Policy',
        category: 'workplace',
        summary: 'Guidelines for remote work arrangements, eligibility, and expectations',
        lastUpdated: '2024-01-15',
        relevanceScore: this.calculateRelevance(query, 'remote work policy guidelines'),
        snippet: 'Employees may request remote work arrangements subject to manager approval...'
      },
      {
        id: 'pol_002',
        title: 'Time Off and Vacation Policy',
        category: 'benefits',
        summary: 'Vacation accrual, sick leave, and time-off request procedures',
        lastUpdated: '2024-02-01',
        relevanceScore: this.calculateRelevance(query, 'vacation time off sick leave policy'),
        snippet: 'Employees accrue vacation time based on length of service...'
      },
      {
        id: 'pol_003',
        title: 'Code of Conduct',
        category: 'compliance',
        summary: 'Professional behavior expectations and ethical guidelines',
        lastUpdated: '2024-01-10',
        relevanceScore: this.calculateRelevance(query, 'code conduct ethics professional behavior'),
        snippet: 'All employees are expected to maintain the highest standards of professional conduct...'
      },
      {
        id: 'pol_004',
        title: 'Performance Review Process',
        category: 'performance',
        summary: 'Annual and quarterly performance evaluation procedures',
        lastUpdated: '2024-03-01',
        relevanceScore: this.calculateRelevance(query, 'performance review evaluation process'),
        snippet: 'Performance reviews are conducted annually with quarterly check-ins...'
      },
      {
        id: 'pol_005',
        title: 'Employee Benefits Overview',
        category: 'benefits',
        summary: 'Comprehensive guide to health, dental, retirement, and other benefits',
        lastUpdated: '2024-01-20',
        relevanceScore: this.calculateRelevance(query, 'employee benefits health insurance retirement'),
        snippet: 'We offer comprehensive benefits including health, dental, vision, and 401k...'
      }
    ];

    // Filter by category if specified
    let filteredPolicies = mockPolicies;
    if (category) {
      filteredPolicies = mockPolicies.filter(policy => 
        policy.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort by relevance and take top results
    const results = filteredPolicies
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 5);

    return JSON.stringify({
      success: true,
      data: {
        query,
        category: category || 'all',
        results,
        totalResults: results.length
      },
      message: `Found ${results.length} relevant policies`
    });
  }

  /**
   * Get specific policy details
   */
  private async getPolicy(input: ToolInput): Promise<string> {
    const { policyId } = input;

    if (!policyId) {
      throw new Error('policyId is required for get_policy action');
    }

    // Mock policy content - in production this would fetch from database
    const policyContent = {
      pol_001: {
        id: 'pol_001',
        title: 'Remote Work Policy',
        category: 'workplace',
        content: `# Remote Work Policy

## Eligibility
Employees may request remote work arrangements if their role is suitable for remote work and they have been with the company for at least 6 months.

## Application Process
1. Submit request to direct manager
2. Complete remote work agreement
3. IT setup and security training
4. Trial period of 30 days

## Expectations
- Maintain regular business hours
- Attend all scheduled meetings
- Ensure secure home office setup
- Regular communication with team

## Equipment
Company will provide necessary equipment including laptop, monitor, and office supplies.`,
        lastUpdated: '2024-01-15',
        version: '2.1',
        approvedBy: 'HR Committee'
      }
    };

    const policy = policyContent[policyId as keyof typeof policyContent];

    if (!policy) {
      return JSON.stringify({
        success: false,
        error: 'Policy not found',
        message: `No policy found with ID: ${policyId}`
      });
    }

    return JSON.stringify({
      success: true,
      data: policy,
      message: `Retrieved policy: ${policy.title}`
    });
  }

  /**
   * List all available policies
   */
  private async listPolicies(input: ToolInput): Promise<string> {
    const { category } = input;

    // Mock policy list
    const allPolicies: PolicyResult[] = [
      {
        id: 'pol_001',
        title: 'Remote Work Policy',
        category: 'workplace',
        summary: 'Guidelines for remote work arrangements',
        lastUpdated: '2024-01-15'
      },
      {
        id: 'pol_002',
        title: 'Time Off and Vacation Policy',
        category: 'benefits',
        summary: 'Vacation accrual and time-off procedures',
        lastUpdated: '2024-02-01'
      },
      {
        id: 'pol_003',
        title: 'Code of Conduct',
        category: 'compliance',
        summary: 'Professional behavior expectations',
        lastUpdated: '2024-01-10'
      },
      {
        id: 'pol_004',
        title: 'Performance Review Process',
        category: 'performance',
        summary: 'Performance evaluation procedures',
        lastUpdated: '2024-03-01'
      },
      {
        id: 'pol_005',
        title: 'Employee Benefits Overview',
        category: 'benefits',
        summary: 'Comprehensive benefits guide',
        lastUpdated: '2024-01-20'
      }
    ];

    // Filter by category if specified
    let filteredPolicies = allPolicies;
    if (category) {
      filteredPolicies = allPolicies.filter(policy => 
        policy.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Group by category
    const groupedPolicies = filteredPolicies.reduce((groups, policy) => {
      const cat = policy.category;
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(policy);
      return groups;
    }, {} as Record<string, PolicyResult[]>);

    return JSON.stringify({
      success: true,
      data: {
        categories: Object.keys(groupedPolicies),
        policies: groupedPolicies,
        totalPolicies: filteredPolicies.length
      },
      message: `Listed ${filteredPolicies.length} policies${category ? ` in category: ${category}` : ''}`
    });
  }

  /**
   * Calculate relevance score between query and policy content
   */
  private calculateRelevance(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const queryWord of queryWords) {
      if (contentWords.some(contentWord => 
        contentWord.includes(queryWord) || queryWord.includes(contentWord)
      )) {
        matches++;
      }
    }

    return Math.min(matches / queryWords.length, 1.0);
  }
} 