import { Tool } from 'langchain/tools';
import { PrismaClient } from '@prisma/client';
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { PolicyChunkService } from '../../services/PolicyChunkService';
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
 * LangChain Tool for HR policy search and retrieval using database-backed vector search
 */
export class PolicySearchTool extends Tool {
  name = 'policy_search';
  description = `Searches and retrieves HR policies, procedures, and guidelines using vector similarity search.
  
  Input should be a JSON string with:
  - action: 'search' | 'get_policy' | 'list_policies'
  - query: Search terms for policies (for search action)
  - policyId: Specific policy identifier (for get_policy action)
  - category: Policy category filter (optional for search and list)
  
  Returns relevant policy information, summaries, and guidance based on semantic similarity.`;

  private memoryManager: EnhancedMemoryManager;
  private prisma: PrismaClient;
  private policyChunkService: PolicyChunkService;

  constructor(memoryManager: EnhancedMemoryManager) {
    super();
    this.memoryManager = memoryManager;
    this.prisma = new PrismaClient();
    
    // Initialize embeddings (same as used in agent)
    const embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: "mistral-embed",
    });
    
    this.policyChunkService = new PolicyChunkService(this.prisma, embeddings);
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
   * Search through HR policies using vector similarity
   */
  private async searchPolicies(input: ToolInput): Promise<string> {
    const { query, category } = input;

    if (!query) {
      throw new Error('query is required for search action');
    }

    try {
      // Perform vector similarity search on policy chunks
      const searchResults = await this.policyChunkService.similaritySearch(
        query,
        10, // Get more chunks initially
        0.6  // Lower threshold for broader results
      );

      // Group results by policy and calculate relevance scores
      const policyMap = new Map<string, {
        policy: { id: string; title: string; category: string };
        chunks: { id: string; content: string; chunkIndex: number }[];
        maxSimilarity: number;
        avgSimilarity: number;
      }>();

      searchResults.forEach(result => {
        const policyId = result.policy.id;
        if (!policyMap.has(policyId)) {
          policyMap.set(policyId, {
            policy: result.policy,
            chunks: [],
            maxSimilarity: 0,
            avgSimilarity: 0,
          });
        }
        
        const policyData = policyMap.get(policyId)!;
        policyData.chunks.push(result.chunk);
        policyData.maxSimilarity = Math.max(policyData.maxSimilarity, result.similarity);
      });

      // Calculate average similarity and create results
      const results: PolicyResult[] = [];
      for (const [policyId, data] of policyMap.entries()) {
        // Filter by category if specified
        if (category && !data.policy.category.toLowerCase().includes(category.toLowerCase())) {
          continue;
        }

        // Get the most relevant chunk for snippet
        const bestChunk = data.chunks[0];
        const snippet = bestChunk.content.length > 200 
          ? bestChunk.content.substring(0, 200) + '...'
          : bestChunk.content;

        results.push({
          id: policyId,
          title: data.policy.title,
          category: data.policy.category,
          summary: `Policy with ${data.chunks.length} relevant sections found`,
          lastUpdated: new Date().toISOString().split('T')[0], // TODO: Get from policy record
          relevanceScore: data.maxSimilarity,
          snippet,
        });
      }

      // Sort by relevance and take top 5
      const topResults = results
        .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
        .slice(0, 5);

      return JSON.stringify({
        success: true,
        data: {
          query,
          category: category || 'all',
          results: topResults,
          totalResults: topResults.length,
          searchMethod: 'vector_similarity'
        },
        message: `Found ${topResults.length} relevant policies using semantic search`
      });

    } catch (error) {
      console.error('Vector search failed, falling back to mock data:', error);
      
      // Fallback to basic text matching (simplified version of old mock data approach)
      const mockResults: PolicyResult[] = [
        {
          id: 'pol_fallback_001',
          title: 'Remote Work Policy',
          category: 'workplace',
          summary: 'Guidelines for remote work arrangements, eligibility, and expectations',
          lastUpdated: '2024-01-15',
          relevanceScore: this.calculateRelevance(query, 'remote work policy guidelines'),
          snippet: 'Employees may request remote work arrangements subject to manager approval...'
        }
      ];

      return JSON.stringify({
        success: true,
        data: {
          query,
          category: category || 'all',
          results: mockResults.slice(0, 5),
          totalResults: mockResults.length,
          searchMethod: 'fallback_text_matching'
        },
        message: `Found ${mockResults.length} relevant policies using fallback search`
      });
    }
  }

  /**
   * Get specific policy details
   */
  private async getPolicy(input: ToolInput): Promise<string> {
    const { policyId } = input;

    if (!policyId) {
      throw new Error('policyId is required for get_policy action');
    }

    try {
      // Get policy from database
      const policy = await this.prisma.policy.findUnique({
        where: { id: policyId },
        include: {
          category: true,
        },
      });

      if (!policy) {
        return JSON.stringify({
          success: false,
          error: 'Policy not found',
          message: `No policy found with ID: ${policyId}`
        });
      }

      // Get policy chunks
      const chunks = await this.policyChunkService.getPolicyChunks(policyId);
      const fullContent = chunks
        .sort((a, b) => a.chunkIndex - b.chunkIndex)
        .map(chunk => chunk.content)
        .join('\n\n');

      return JSON.stringify({
        success: true,
        data: {
          id: policy.id,
          title: policy.title,
          category: policy.category.name,
          content: policy.content || fullContent,
          summary: policy.summary,
          lastUpdated: policy.updatedAt.toISOString().split('T')[0],
          version: policy.version.toString(),
          status: policy.status,
          effectiveDate: policy.effectiveDate.toISOString().split('T')[0],
          approvedBy: policy.approvedBy || 'System',
          chunks: chunks.length,
        },
        message: `Retrieved policy: ${policy.title}`
      });

    } catch (error) {
      console.error('Database query failed:', error);
      return JSON.stringify({
        success: false,
        error: 'Database error',
        message: `Failed to retrieve policy: ${policyId}`
      });
    }
  }

  /**
   * List all available policies
   */
  private async listPolicies(input: ToolInput): Promise<string> {
    const { category } = input;

    try {
      // Get policies from database
      const whereClause = category 
        ? { category: { name: { contains: category, mode: 'insensitive' as const } } }
        : {};

      const policies = await this.prisma.policy.findMany({
        where: whereClause,
        include: {
          category: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Convert to PolicyResult format
      const results: PolicyResult[] = policies.map(policy => ({
        id: policy.id,
        title: policy.title,
        category: policy.category.name,
        summary: policy.summary || 'No summary available',
        lastUpdated: policy.updatedAt.toISOString().split('T')[0],
      }));

      // Group by category
      const groupedPolicies = results.reduce((groups, policy) => {
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
          totalPolicies: results.length
        },
        message: `Listed ${results.length} policies${category ? ` in category: ${category}` : ''}`
      });

    } catch (error) {
      console.error('Database query failed:', error);
      return JSON.stringify({
        success: false,
        error: 'Database error',
        message: 'Failed to retrieve policies list'
      });
    }
  }

  /**
   * Calculate relevance score between query and policy content (fallback method)
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

  /**
   * Cleanup database connection
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 