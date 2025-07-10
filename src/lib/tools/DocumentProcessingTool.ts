import { Tool } from 'langchain/tools';
import { EnhancedMemoryManager } from '../EnhancedMemoryManager';
import { DocumentCategory } from '../../types/index';

interface ToolInput {
  action: 'upload' | 'search' | 'categorize';
  fileId?: string;
  content?: string;
  fileName?: string;
  category?: DocumentCategory;
  searchQuery?: string;
}

/**
 * LangChain Tool for document processing and search
 */
export class DocumentProcessingTool extends Tool {
  name = 'document_processor';
  description = `Processes documents, categorizes them, and searches through document content.
  
  Input should be a JSON string with:
  - action: 'upload' | 'search' | 'categorize'
  - fileId: File identifier (for upload action)
  - content: Document text content (for upload action)  
  - fileName: Name of the file (for upload action)
  - category: Document category (optional for upload)
  - searchQuery: Search terms (for search action)
  
  Returns processed document information or search results.`;

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
        case 'upload':
          return await this.processDocumentUpload(parsedInput);
        case 'search':
          return await this.searchDocuments(parsedInput);
        case 'categorize':
          return await this.categorizeDocument(parsedInput);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }

    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Failed to process document operation'
      });
    }
  }

  /**
   * Process document upload and categorization
   */
  private async processDocumentUpload(input: ToolInput): Promise<string> {
    const { fileId, content, fileName, category } = input;

    if (!fileId || !content || !fileName) {
      throw new Error('fileId, content, and fileName are required for upload action');
    }

    // Auto-categorize if not provided
    const documentCategory = category || this.autoCategorizDocument(content, fileName);

    // Extract metadata
    const metadata = {
      fileType: this.getFileExtension(fileName),
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      tags: this.extractTags(content, documentCategory),
      title: this.extractTitle(content, fileName)
    };

    // Store document information
    const documentInfo = {
      fileId,
      fileName,
      category: documentCategory,
      content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''), // Store preview
      metadata,
      processedAt: new Date().toISOString()
    };

    // In a real implementation, you would store this in a database
    // For now, we'll use memory storage (metadata logging only)
    console.log(`📄 Document processed: ${fileName}`);
    console.log(`  - Category: ${documentCategory}`);
    console.log(`  - Size: ${content.length} characters`);
    console.log(`  - Type: ${this.getMimeType(fileName)}`);

    return JSON.stringify({
      success: true,
      data: documentInfo,
      message: `Document processed and categorized as ${documentCategory}`
    });
  }

  /**
   * Search through documents
   */
  private async searchDocuments(input: ToolInput): Promise<string> {
    const { searchQuery } = input;

    if (!searchQuery) {
      throw new Error('searchQuery is required for search action');
    }

    // In a real implementation, you would search through a vector database
    // For now, we'll simulate search results
    const mockResults = [
      {
        fileName: 'HR Policy Manual.pdf',
        category: DocumentCategory.POLICY,
        relevanceScore: 0.95,
        snippet: `Found relevant content about ${searchQuery}...`
      },
      {
        fileName: 'Employee Benefits Guide.docx',
        category: DocumentCategory.BENEFITS,
        relevanceScore: 0.87,
        snippet: `Additional information regarding ${searchQuery}...`
      }
    ];

    return JSON.stringify({
      success: true,
      data: {
        query: searchQuery,
        results: mockResults,
        totalResults: mockResults.length
      },
      message: `Found ${mockResults.length} relevant documents`
    });
  }

  /**
   * Categorize document content
   */
  private async categorizeDocument(input: ToolInput): Promise<string> {
    const { content, fileName } = input;

    if (!content) {
      throw new Error('content is required for categorize action');
    }

    const category = this.autoCategorizDocument(content, fileName || 'document');
    const confidence = this.calculateCategoryConfidence(content, category);
    const tags = this.extractTags(content, category);

    return JSON.stringify({
      success: true,
      data: {
        category,
        confidence,
        tags,
        reasoning: `Categorized based on keyword analysis and content structure`
      },
      message: `Document categorized as ${category} with ${Math.round(confidence * 100)}% confidence`
    });
  }

  /**
   * Auto-categorize document based on content analysis
   */
  private autoCategorizDocument(text: string, fileName: string): DocumentCategory {
    const lowerText = text.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    const categories = {
      [DocumentCategory.POLICY]: ['policy', 'policies', 'guidelines', 'rules', 'code of conduct'],
      [DocumentCategory.PROCEDURE]: ['procedure', 'process', 'workflow', 'steps', 'how to'],
      [DocumentCategory.BENEFITS]: ['benefits', 'health', 'insurance', 'retirement', '401k', 'vacation'],
      [DocumentCategory.ONBOARDING]: ['onboarding', 'orientation', 'new hire', 'welcome', 'getting started'],
      [DocumentCategory.TRAINING]: ['training', 'education', 'course', 'learning', 'development'],
      [DocumentCategory.COMPLIANCE]: ['compliance', 'legal', 'regulation', 'audit', 'requirement'],
    };

    let bestMatch = DocumentCategory.POLICY;
    let highestScore = 0;

    for (const [category, keywords] of Object.entries(categories)) {
      const score = keywords.reduce((count, keyword) => {
        const textMatches = (lowerText.match(new RegExp(keyword, 'g')) || []).length;
        const fileMatches = (lowerFileName.match(new RegExp(keyword, 'g')) || []).length * 2;
        return count + textMatches + fileMatches;
      }, 0);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = category as DocumentCategory;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate confidence for categorization
   */
  private calculateCategoryConfidence(text: string, category: DocumentCategory): number {
    // Simple confidence calculation based on keyword density
    const wordCount = text.split(/\s+/).length;
    const relevantKeywords = this.getCategoryKeywords(category);
    const keywordMatches = relevantKeywords.reduce((count, keyword) => {
      return count + (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
    }, 0);

    const density = keywordMatches / wordCount;
    return Math.min(0.5 + density * 10, 0.99); // Scale to 0.5-0.99 range
  }

  /**
   * Extract tags from document content
   */
  private extractTags(text: string, category: DocumentCategory): string[] {
    const tags: string[] = [category];
    
    // Add common HR tags based on content
    const tagPatterns = {
      'remote-work': /remote|work from home|wfh|telecommute/i,
      'vacation': /vacation|pto|time off|leave/i,
      'benefits': /benefits|insurance|health|dental/i,
      'performance': /performance|review|evaluation|feedback/i,
      'training': /training|education|learning|development/i,
      'compliance': /compliance|legal|regulation|gdpr|hipaa/i,
    };

    for (const [tag, pattern] of Object.entries(tagPatterns)) {
      if (pattern.test(text)) {
        tags.push(tag);
      }
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Extract title from content or filename
   */
  private extractTitle(text: string, fileName: string): string {
    // Try to find a title in the first few lines
    const lines = text.split('\n').slice(0, 5);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 100 && !trimmed.includes('.')) {
        return trimmed;
      }
    }
    
    // Fallback to filename without extension
    return fileName.replace(/\.[^/.]+$/, '');
  }

  /**
   * Get category keywords
   */
  private getCategoryKeywords(category: DocumentCategory): string[] {
    const keywordMap = {
      [DocumentCategory.POLICY]: ['policy', 'guideline', 'rule', 'code', 'conduct'],
      [DocumentCategory.PROCEDURE]: ['procedure', 'process', 'step', 'workflow'],
      [DocumentCategory.BENEFITS]: ['benefit', 'insurance', 'health', 'retirement'],
      [DocumentCategory.ONBOARDING]: ['onboarding', 'orientation', 'new hire'],
      [DocumentCategory.TRAINING]: ['training', 'education', 'learning'],
      [DocumentCategory.COMPLIANCE]: ['compliance', 'legal', 'regulation'],
    };

    return keywordMap[category] || [];
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Get MIME type from filename
   */
  private getMimeType(fileName: string): string {
    const ext = this.getFileExtension(fileName);
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
} 