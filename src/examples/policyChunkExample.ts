import { PrismaClient } from '@prisma/client';
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { PolicyChunkService } from '../services/PolicyChunkService';
import { DocumentProcessor } from '../lib/DocumentProcessor';
import type { DocumentChunk } from '../types/index';

/**
 * Example: How to use PolicyChunkService for processing and searching policies
 */
export class PolicyChunkExample {
  private prisma: PrismaClient;
  private embeddings: MistralAIEmbeddings;
  private policyChunkService: PolicyChunkService;
  private documentProcessor: DocumentProcessor;

  constructor() {
    this.prisma = new PrismaClient();
    this.embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: "mistral-embed",
    });
    this.policyChunkService = new PolicyChunkService(this.prisma, this.embeddings);
    this.documentProcessor = new DocumentProcessor(this.embeddings);
  }

  /**
   * Example 1: Process a policy document and store chunks
   */
  async processAndStorePolicyDocument(
    policyTitle: string,
    policyContent: string,
    categoryName: string = 'HR Policies'
  ): Promise<void> {
    try {
      console.log(`🔄 Processing policy: ${policyTitle}`);

      // 1. Find or create policy category
      let category = await this.prisma.policyCategory.findUnique({
        where: { name: categoryName }
      });

      if (!category) {
        category = await this.prisma.policyCategory.create({
          data: { name: categoryName, description: `${categoryName} category` }
        });
      }

      // 2. Create the policy record
      const policy = await this.prisma.policy.create({
        data: {
          title: policyTitle,
          categoryId: category.id,
          content: policyContent,
          summary: `Summary for ${policyTitle}`,
          effectiveDate: new Date(),
          status: 'ACTIVE',
          createdBy: 'system',
          version: 1,
        },
      });

      // 3. Process content into chunks
      const chunks = await this.createDocumentChunks(policyContent);

      // 4. Store chunks with embeddings
      const storedChunks = await this.policyChunkService.createPolicyChunks(
        policy.id,
        chunks
      );

      console.log(`✅ Successfully processed ${policyTitle}:`);
      console.log(`   - Policy ID: ${policy.id}`);
      console.log(`   - Chunks created: ${storedChunks.length}`);
      console.log(`   - Category: ${category.name}`);

    } catch (error) {
      console.error(`❌ Error processing policy ${policyTitle}:`, error);
      throw error;
    }
  }

  /**
   * Example 2: Search for relevant policy chunks
   */
  async searchPolicyChunks(query: string): Promise<void> {
    try {
      console.log(`🔍 Searching for: "${query}"`);

      const results = await this.policyChunkService.similaritySearch(
        query,
        5,    // top 5 results
        0.7   // 70% similarity threshold
      );

      if (results.length === 0) {
        console.log('❌ No relevant policies found');
        return;
      }

      console.log(`✅ Found ${results.length} relevant policy chunks:`);
      
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.policy.title} (${result.policy.category})`);
        console.log(`   Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Chunk ${result.chunk.chunkIndex + 1}: ${result.chunk.content.substring(0, 100)}...`);
      });

    } catch (error) {
      console.error('❌ Error searching policies:', error);
      throw error;
    }
  }

  /**
   * Example 3: Get statistics about stored chunks
   */
  async showChunkStatistics(): Promise<void> {
    try {
      const stats = await this.policyChunkService.getChunkStatistics();
      
      console.log('\n📊 Policy Chunk Statistics:');
      console.log(`Total chunks: ${stats.totalChunks}`);
      console.log('\nChunks by policy:');
      
      stats.chunksByPolicy.forEach(item => {
        console.log(`  ${item.policyTitle}: ${item.chunkCount} chunks`);
      });

    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Example 4: Update policy content and re-chunk
   */
  async updatePolicyContent(
    policyId: string,
    newContent: string
  ): Promise<void> {
    try {
      console.log(`🔄 Updating policy ${policyId} with new content`);

      // 1. Update policy record
      await this.prisma.policy.update({
        where: { id: policyId },
        data: { 
          content: newContent,
          version: { increment: 1 },
          updatedAt: new Date()
        }
      });

      // 2. Create new chunks from updated content
      const chunks = await this.createDocumentChunks(newContent);

      // 3. Update chunks (this deletes old ones and creates new ones)
      const updatedChunks = await this.policyChunkService.updatePolicyChunks(
        policyId,
        chunks
      );

      console.log(`✅ Policy updated successfully:`);
      console.log(`   - New chunks created: ${updatedChunks.length}`);

    } catch (error) {
      console.error(`❌ Error updating policy ${policyId}:`, error);
      throw error;
    }
  }

  /**
   * Helper method to create document chunks
   */
  private async createDocumentChunks(content: string): Promise<DocumentChunk[]> {
    // Split content into chunks (simple implementation)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: DocumentChunk[] = [];
    
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + chunkSize, content.length);
      const chunkContent = content.slice(startIndex, endIndex);

      chunks.push({
        id: `chunk_${Date.now()}_${chunkIndex}`,
        content: chunkContent,
        startIndex,
        endIndex,
        metadata: {
          chunkIndex,
          overlapStart: Math.max(0, startIndex - overlap),
          overlapEnd: Math.min(content.length, endIndex + overlap),
        },
      });

      startIndex = endIndex - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Cleanup database connection
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * Run example usage
 */
async function runExample() {
  const example = new PolicyChunkExample();

  try {
    // Example policy content
    const remoteworkPolicy = `
# Remote Work Policy

## Purpose
This policy outlines the guidelines and expectations for employees working remotely.

## Eligibility
Employees may request remote work arrangements if:
- Their role is suitable for remote work
- They have been with the company for at least 6 months
- Their performance meets or exceeds expectations

## Application Process
1. Submit a written request to your direct manager
2. Complete the remote work agreement form
3. Attend IT security training
4. Set up a home office that meets company requirements
5. Complete a 30-day trial period

## Expectations
- Maintain regular business hours (9 AM - 5 PM local time)
- Attend all scheduled meetings and be available during core hours
- Ensure reliable internet connection and quiet workspace
- Communicate regularly with team members
- Report any technical issues immediately

## Equipment and Technology
- Company will provide laptop, monitor, and necessary software
- Employee is responsible for internet connection
- All equipment must be returned upon employment termination

## Performance Monitoring
- Regular check-ins with manager (weekly minimum)
- Quarterly performance reviews
- Productivity metrics tracking
- Goal setting and achievement monitoring
    `;

    // 1. Process and store the policy
    await example.processAndStorePolicyDocument(
      'Remote Work Policy',
      remoteworkPolicy,
      'Workplace Policies'
    );

    // 2. Search for relevant chunks
    await example.searchPolicyChunks('home office setup requirements');
    await example.searchPolicyChunks('performance review remote work');
    await example.searchPolicyChunks('equipment laptop technology');

    // 3. Show statistics
    await example.showChunkStatistics();

    console.log('\n🎉 Example completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
  } finally {
    await example.cleanup();
  }
}

// Uncomment to run the example
// runExample().catch(console.error);

export { runExample }; 