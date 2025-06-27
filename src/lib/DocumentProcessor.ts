import { Embeddings } from '@langchain/core/embeddings';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import type { HRDocument, DocumentChunk, DocumentMetadata, DocumentVersion } from '../types/index';
import { DocumentCategory } from '../types/index';

// For production, you'd install these packages:
// npm install pdf-parse mammoth tesseract.js
// For now, we'll create mock implementations

interface FileParsingResult {
  text: string;
  metadata: Partial<DocumentMetadata>;
  pageNumbers?: number[];
}

export class DocumentProcessor {
  private embeddings: Embeddings;
  private chunkSize: number = 1000;
  private chunkOverlap: number = 200;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  /**
   * Main method to process a document file and return a complete HRDocument
   */
  async processDocument(file: File, category?: DocumentCategory): Promise<HRDocument> {
    try {
      console.log(`Processing document: ${file.name}`);

      // Step 1: Extract raw text from file
      const text = await this.readFileAsText(file);

      // Step 2: Auto-assign category if not provided
      const documentCategory = category || await this.autoCategorizDocument(text, file.name);

      // Step 3: Split text into chunks using the new splitter
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      const splitDocs = await splitter.createDocuments([text]);

      let charIndex = 0;
      const chunks: DocumentChunk[] = splitDocs.map((doc, index) => {
        const chunk: DocumentChunk = {
          id: `chunk_${Date.now()}_${index}`,
          content: doc.pageContent,
          startIndex: charIndex,
          endIndex: charIndex + doc.pageContent.length,
          metadata: {
            chunkIndex: index,
            overlapStart: Math.max(0, charIndex - 200),
            overlapEnd: charIndex + doc.pageContent.length + 200,
          },
        };
        charIndex += doc.pageContent.length;
        return chunk;
      });

      // Step 4: Create document metadata
      const metadata: DocumentMetadata = {
        fileName: file.name,
        fileType: file.type || this.getFileExtension(file.name),
        size: file.size,
        uploadedBy: 'system', // In production, get from auth context
        tags: this.extractTags(text, documentCategory),
        version: '1.0',
      };

      // Step 5: Create version history
      const versionHistory: DocumentVersion[] = [{
        version: '1.0',
        changes: 'Initial document upload',
        updatedBy: metadata.uploadedBy,
        updatedAt: new Date(),
      }];

      // Step 6: Create HRDocument
      const document: HRDocument = {
        id: this.generateDocumentId(),
        title: this.extractTitle(text, file.name),
        content: text,
        category: documentCategory,
        metadata,
        chunks,
        relatedDocuments: [], // Will be populated later by relationship analysis
        versionHistory,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(`Document processed successfully: ${document.title}`);
      return document;

    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract raw text from different file types
   */
  private async extractTextFromFile(file: File): Promise<FileParsingResult> {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.pdf')) {
      return await this.parsePDF(file);
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return await this.parseWord(file);
    } else if (fileName.endsWith('.txt')) {
      return await this.parseText(file);
    } else if (this.isImageFile(fileName)) {
      return await this.parseImageWithOCR(file);
    } else {
      throw new Error(`Unsupported file type: ${file.name}`);
    }
  }

  /**
   * Parse PDF files (mock implementation - in production use pdf-parse)
   */
  private async parsePDF(file: File): Promise<FileParsingResult> {
    // Mock implementation - in production, use pdf-parse
    const text = await this.readFileAsText(file);
    return {
      text: text || 'PDF content extraction would happen here using pdf-parse library',
      metadata: {
        fileType: 'application/pdf',
      },
    };
  }

  /**
   * Parse Word documents (mock implementation - in production use mammoth)
   */
  private async parseWord(file: File): Promise<FileParsingResult> {
    // Mock implementation - in production, use mammoth
    const text = await this.readFileAsText(file);
    return {
      text: text || 'Word document content extraction would happen here using mammoth library',
      metadata: {
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    };
  }

  /**
   * Parse text files
   */
  private async parseText(file: File): Promise<FileParsingResult> {
    const text = await this.readFileAsText(file);
    return {
      text,
      metadata: {
        fileType: 'text/plain',
      },
    };
  }

  /**
   * Parse images with OCR (mock implementation - in production use tesseract.js)
   */
  private async parseImageWithOCR(file: File): Promise<FileParsingResult> {
    // Mock implementation - in production, use tesseract.js
    return {
      text: 'OCR text extraction would happen here using tesseract.js library',
      metadata: {
        fileType: file.type,
      },
    };
  }

  /**
   * Auto-categorize document based on content analysis
   */
  private async autoCategorizDocument(text: string, fileName: string): Promise<DocumentCategory> {
    const lowerText = text.toLowerCase();
    const lowerFileName = fileName.toLowerCase();

    // Simple keyword-based categorization
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
        const fileMatches = (lowerFileName.match(new RegExp(keyword, 'g')) || []).length * 2; // Weight filename matches higher
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
   * Extract relevant tags from document content
   */
  private extractTags(text: string, category: DocumentCategory): string[] {
    const lowerText = text.toLowerCase();
    const tags: string[] = [category];

    // Common HR tags
    const tagKeywords = {
      'remote-work': ['remote', 'work from home', 'telecommute'],
      'management-only': ['management', 'supervisor', 'confidential'],
      'compliance': ['legal', 'compliance', 'regulation'],
      'benefits': ['health', 'insurance', 'retirement'],
      'time-off': ['vacation', 'pto', 'sick leave', 'holiday'],
      'payroll': ['salary', 'payroll', 'compensation', 'bonus'],
    };

    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    }

    return tags;
  }

  /**
   * Extract document title from content or filename
   */
  private extractTitle(text: string, fileName: string): string {
    // Try to find title in first few lines
    const lines = text.split('\n').slice(0, 5);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100 && !trimmed.includes('.')) {
        return trimmed;
      }
    }

    // Fallback to filename without extension
    return fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // Helper methods
  private splitIntoSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;
    return text.slice(-overlapSize);
  }

  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    return imageExtensions.some(ext => fileName.endsWith(ext));
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'unknown';
  }

  /**
   * Helper to read file content as text in a Node.js environment
   */
  private async readFileAsText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Attempt to parse different file types
    if (file.type.includes('pdf')) {
      // Lazy load pdf-parse
      const pdf = (await import('pdf-parse')).default;
      const data = await pdf(buffer);
      return data.text;
    } else if (file.type.includes('vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      // Lazy load mammoth
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    // Default to plain text
    return buffer.toString('utf-8');
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectFileType(): 'pdf' | 'docx' | 'txt' | 'png' | 'jpg' {
    // This logic can be enhanced based on file extension or magic numbers
    // For now, it's simplified as the type is derived from the File object
    return 'txt';
  }
} 