import { PrismaClient, Prisma } from '@prisma/client';
import { Embeddings } from '@langchain/core/embeddings';
import type { DocumentChunk, ChunkMetadata } from '../types/index';

export interface PolicyChunkWithEmbedding {
  id: string;
  policyId: string;
  chunkIndex: number;
  content: string;
  startIndex: number;
  endIndex: number;
  metadata: ChunkMetadata;
  createdAt: Date;
  embedding?: number[];
}

export interface SimilaritySearchResult {
  chunk: PolicyChunkWithEmbedding;
  similarity: number;
  policy: {
    id: string;
    title: string;
    category: string;
  };
}

export class PolicyChunkService {
  private prisma: PrismaClient;
  private embeddings: Embeddings;

  constructor(prisma: PrismaClient, embeddings: Embeddings) {
    this.prisma = prisma;
    this.embeddings = embeddings;
  }

  /**
   * Convert JsonValue back to ChunkMetadata
   */
  private jsonToChunkMetadata(json: Prisma.JsonValue): ChunkMetadata {
    const obj = json as Record<string, unknown>;
    return {
      chunkIndex: obj.chunkIndex as number,
      overlapStart: obj.overlapStart as number,
      overlapEnd: obj.overlapEnd as number,
      pageNumber: obj.pageNumber as number | undefined,
      section: obj.section as string | undefined,
    };
  }

  /**
   * Create policy chunks with embeddings in the database
   */
  async createPolicyChunks(
    policyId: string,
    chunks: DocumentChunk[]
  ): Promise<PolicyChunkWithEmbedding[]> {
    try {
      // Generate embeddings for all chunks
      const chunkTexts = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddings.embedDocuments(chunkTexts);

      // Create chunks in database using raw SQL to handle vector column
      const createdChunks: PolicyChunkWithEmbedding[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        // First create the basic chunk record with Prisma
        const basicChunk = await this.prisma.policyChunk.create({
          data: {
            policyId,
            chunkIndex: chunk.metadata.chunkIndex,
            content: chunk.content,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            metadata: chunk.metadata as unknown as Prisma.InputJsonValue,
          },
        });

        // Then update with embedding using raw SQL
        await this.prisma.$executeRaw`
          UPDATE policy_chunks 
          SET embedding = ${JSON.stringify(embedding)}::vector
          WHERE id = ${basicChunk.id}::uuid
        `;

        createdChunks.push({
          id: basicChunk.id,
          policyId: basicChunk.policyId,
          chunkIndex: basicChunk.chunkIndex,
          content: basicChunk.content,
          startIndex: basicChunk.startIndex,
          endIndex: basicChunk.endIndex,
          metadata: chunk.metadata,
          createdAt: basicChunk.createdAt,
          embedding,
        });
      }

      console.log(`Created ${createdChunks.length} policy chunks for policy ${policyId}`);
      return createdChunks;
    } catch (error) {
      console.error('Error creating policy chunks:', error);
      throw error;
    }
  }

  /**
   * Perform vector similarity search on policy chunks
   */
  async similaritySearch(
    query: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
    companyId?: string // NEW: Add company filtering
  ): Promise<SimilaritySearchResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Perform vector similarity search using raw SQL
      const results = await this.prisma.$queryRaw<Array<{
        id: string;
        policy_id: string;
        chunk_index: number;
        content: string;
        start_index: number;
        end_index: number;
        metadata: Prisma.JsonValue;
        created_at: Date;
        similarity: number;
        policy_title: string;
        policy_category: string;
      }>>`
        SELECT 
          pc.id,
          pc.policy_id,
          pc.chunk_index,
          pc.content,
          pc.start_index,
          pc.end_index,
          pc.metadata,
          pc.created_at,
          1 - (pc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
          p.title as policy_title,
          cat.name as policy_category
        FROM policy_chunks pc
        JOIN policies p ON pc.policy_id = p.id
        JOIN policy_categories cat ON p.category_id = cat.id
        WHERE 1 - (pc.embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${similarityThreshold}
        ${companyId ? `AND p.company_id = ${companyId}` : ''}
        ORDER BY similarity DESC
        LIMIT ${limit}
      `;

      return results.map(row => ({
        chunk: {
          id: row.id,
          policyId: row.policy_id,
          chunkIndex: row.chunk_index,
          content: row.content,
          startIndex: row.start_index,
          endIndex: row.end_index,
          metadata: this.jsonToChunkMetadata(row.metadata),
          createdAt: row.created_at,
        },
        similarity: row.similarity,
        policy: {
          id: row.policy_id,
          title: row.policy_title,
          category: row.policy_category,
        },
      }));
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw error;
    }
  }

  /**
   * Get all chunks for a specific policy
   */
  async getPolicyChunks(policyId: string): Promise<PolicyChunkWithEmbedding[]> {
    try {
      const chunks = await this.prisma.policyChunk.findMany({
        where: { policyId },
        orderBy: { chunkIndex: 'asc' },
      });

      // Get embeddings using raw SQL
      const chunksWithEmbeddings: PolicyChunkWithEmbedding[] = [];
      
      for (const chunk of chunks) {
        const result = await this.prisma.$queryRaw<Array<{ embedding: number[] }>>`
          SELECT embedding FROM policy_chunks WHERE id = ${chunk.id}::uuid
        `;
        
        chunksWithEmbeddings.push({
          id: chunk.id,
          policyId: chunk.policyId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          metadata: this.jsonToChunkMetadata(chunk.metadata),
          createdAt: chunk.createdAt,
          embedding: result[0]?.embedding,
        });
      }

      return chunksWithEmbeddings;
    } catch (error) {
      console.error('Error getting policy chunks:', error);
      throw error;
    }
  }

  /**
   * Delete all chunks for a policy
   */
  async deletePolicyChunks(policyId: string): Promise<void> {
    try {
      await this.prisma.policyChunk.deleteMany({
        where: { policyId },
      });
      console.log(`Deleted chunks for policy ${policyId}`);
    } catch (error) {
      console.error('Error deleting policy chunks:', error);
      throw error;
    }
  }

  /**
   * Update chunks when policy content changes
   */
  async updatePolicyChunks(
    policyId: string,
    newChunks: DocumentChunk[]
  ): Promise<PolicyChunkWithEmbedding[]> {
    try {
      // Delete existing chunks
      await this.deletePolicyChunks(policyId);
      
      // Create new chunks
      return await this.createPolicyChunks(policyId, newChunks);
    } catch (error) {
      console.error('Error updating policy chunks:', error);
      throw error;
    }
  }

  /**
   * Get chunk statistics
   */
  async getChunkStatistics(): Promise<{
    totalChunks: number;
    chunksByPolicy: Array<{ policyId: string; policyTitle: string; chunkCount: number }>;
  }> {
    try {
      const totalChunks = await this.prisma.policyChunk.count();
      
      const chunksByPolicy = await this.prisma.policyChunk.groupBy({
        by: ['policyId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
      });

      // Get policy titles
      const policyIds = chunksByPolicy.map(item => item.policyId);
      const policies = await this.prisma.policy.findMany({
        where: { id: { in: policyIds } },
        select: { id: true, title: true },
      });

      const policyTitleMap = new Map(policies.map(p => [p.id, p.title]));

      return {
        totalChunks,
        chunksByPolicy: chunksByPolicy.map(item => ({
          policyId: item.policyId,
          policyTitle: policyTitleMap.get(item.policyId) || 'Unknown',
          chunkCount: item._count.id,
        })),
      };
    } catch (error) {
      console.error('Error getting chunk statistics:', error);
      throw error;
    }
  }
} 