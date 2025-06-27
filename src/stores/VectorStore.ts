import { Embeddings } from '@langchain/core/embeddings';
import type { HRDocument, DocumentChunk } from '../types/index';
import { UserRole } from '../types/index';

interface StoredDocument {
  id: string;
  chunk: DocumentChunk;
  document: HRDocument;
  embedding: number[];
}

export class VectorStore {
  private embeddings: Embeddings;
  private documents: Map<string, StoredDocument> = new Map();

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  /**
   * Add document chunks to the vector store with embeddings
   */
  async addDocument(document: HRDocument): Promise<void> {
    try {
      const chunkTexts = document.chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddings.embedDocuments(chunkTexts);

      // --- Start Enhanced Debug Logging ---
      console.log(`[VectorStore DEBUG] Generated ${embeddings.length} embeddings for ${chunkTexts.length} chunks.`);
      if (embeddings.length > 0) {
        console.log(`[VectorStore DEBUG] First embedding (first 5 values): ${JSON.stringify(embeddings[0].slice(0, 5))}`);
      }
      // --- End Enhanced Debug Logging ---

      document.chunks.forEach((chunk, index) => {
        const storedDoc: StoredDocument = {
          id: chunk.id,
          chunk: { ...chunk, embedding: embeddings[index] },
          document,
          embedding: embeddings[index],
        };
        this.documents.set(chunk.id, storedDoc);
      });

      console.log(`Added ${document.chunks.length} chunks for document: ${document.title}`);
    } catch (error) {
      console.error('Error adding document to vector store:', error);
      throw error;
    }
  }

  /**
   * Perform similarity search to find relevant document chunks
   */
  async similaritySearch(
    query: string,
    topK: number = 5,
    userRole?: UserRole
  ): Promise<HRDocument[]> {
    try {
      // Get query embedding
      const queryEmbedding = await this.embeddings.embedQuery(query);

      // Calculate similarities for all chunks
      const similarities: Array<{ document: HRDocument; chunk: DocumentChunk; score: number }> = [];

      this.documents.forEach((storedDoc) => {
        if (userRole && !this.hasAccess(storedDoc.document, userRole)) {
          return; // Skip to next item
        }

        const similarity = this.cosineSimilarity(queryEmbedding, storedDoc.embedding);
        
        similarities.push({
          document: storedDoc.document,
          chunk: storedDoc.chunk,
          score: similarity,
        });
      });

      // Sort by similarity score to find the most relevant chunks
      similarities.sort((a, b) => b.score - a.score);
      const topChunks = similarities.slice(0, topK);

      // Group the best chunks by their original document
      const relevantDocs = new Map<string, { doc: HRDocument; chunks: DocumentChunk[] }>();
      topChunks.forEach(result => {
        if (!relevantDocs.has(result.document.id)) {
          relevantDocs.set(result.document.id, { doc: result.document, chunks: [] });
        }
        relevantDocs.get(result.document.id)?.chunks.push(result.chunk);
      });

      // Construct final HRDocument array with only the most relevant chunks
      return Array.from(relevantDocs.values()).map(item => ({
        ...item.doc,
        content: item.chunks.map(c => c.content).join('\n\n---\n\n'), // Synthesize content from relevant chunks
        chunks: item.chunks, // Return only the relevant chunks
      }));
    } catch (error) {
      console.error('Error performing similarity search:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Check if user has access to document based on role
   */
  private hasAccess(document: HRDocument, userRole: UserRole): boolean {
    // Basic role-based access control
    switch (userRole) {
      case UserRole.HR_ADMIN:
        return true; // HR admins can see everything
      case UserRole.MANAGER:
        // Managers can see most documents except sensitive compliance ones
        return !document.metadata.tags.includes('confidential');
      case UserRole.EMPLOYEE:
        // Employees can see general policies, benefits, and onboarding
        return !document.metadata.tags.includes('management-only') && 
               !document.metadata.tags.includes('confidential');
      default:
        return false;
    }
  }

  /**
   * Remove document from vector store
   */
  async removeDocument(documentId: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, storedDoc] of this.documents.entries()) {
      if (storedDoc.document.id === documentId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.documents.delete(key));
    console.log(`Removed ${keysToDelete.length} chunks for document: ${documentId}`);
  }

  /**
   * Get total number of stored chunks
   */
  getSize(): number {
    return this.documents.size;
  }

  /**
   * Get all stored documents
   */
  getAllDocuments(): HRDocument[] {
    const uniqueDocuments = new Map<string, HRDocument>();
    
    for (const storedDoc of this.documents.values()) {
      uniqueDocuments.set(storedDoc.document.id, storedDoc.document);
    }

    return Array.from(uniqueDocuments.values());
  }
} 