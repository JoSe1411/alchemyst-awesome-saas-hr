import { HRAgent } from '../lib/agent';
import { DocumentCategory, UserRole } from '../types/index';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Demo script showing the document processing capabilities
 * This demonstrates the complete workflow from document ingestion to querying
 */
export class DocumentProcessingDemo {
  private agent: HRAgent;

  constructor() {
    this.agent = new HRAgent();
  }

  /**
   * Run the complete document processing demo
   */
  async runDemo(): Promise<void> {
    console.log('🚀 Starting HR Agent Document Processing Demo');
    console.log('=' .repeat(50));

    try {
      // Demo 1: Ingest a sample policy document
      await this.demonstrateDocumentIngestion();
      
      // Demo 2: Show similarity search
      await this.demonstrateSimilaritySearch();
      
      // Demo 3: Show query processing with different user roles
      await this.demonstrateRoleBasedAccess();
      
      console.log('\n✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Demonstrate document ingestion process
   */
  private async demonstrateDocumentIngestion(): Promise<void> {
    console.log('\n📄 Document Ingestion Demo');
    console.log('-'.repeat(30));

    // Load the benefits guide from disk
    const benefitsPath = path.resolve(__dirname, 'documents', 'benefits-guide.txt');
    const benefitsContent = fs.readFileSync(benefitsPath, 'utf-8');

    const benefitsFile = this.createMockFile('benefits-guide.txt', benefitsContent);

    console.log(`Ingesting document: ${benefitsFile.name}`);
    console.log(`File size: ${benefitsFile.size} bytes`);

    // Process the document
    const document = await this.agent.ingestDocument(benefitsFile, DocumentCategory.BENEFITS);
    
    console.log(`✅ Document processed successfully!`);
    console.log(`- Document ID: ${document.id}`);
    console.log(`- Title: ${document.title}`);
    console.log(`- Category: ${document.category}`);
    console.log(`- Chunks created: ${document.chunks.length}`);
    console.log(`- Tags: ${document.metadata.tags.join(', ')}`);
    
    // (Chunk details omitted)
  }

  /**
   * Demonstrate similarity search functionality
   */
  private async demonstrateSimilaritySearch(): Promise<void> {
    console.log('\n🔍 Similarity Search Demo');
    console.log('-'.repeat(30));

    const queries = [
      'What are the requirements for remote work?',
      'How often do I need to communicate with my supervisor?',
      'What equipment do I need for working from home?'
    ];

    for (const query of queries) {
      console.log(`\nQuery: "${query}"`);
      // Omit detailed similarity output
    }
  }

  /**
   * Demonstrate role-based access control
   */
  private async demonstrateRoleBasedAccess(): Promise<void> {
    console.log('\n🔐 Role-Based Access Demo');
    console.log('-'.repeat(30));

    // Create mock user contexts
    const users = [
      {
        userId: 'emp001',
        role: UserRole.EMPLOYEE,
        department: 'Engineering',
        preferences: {
          communicationStyle: 'casual' as const,
          language: 'en',
          frequentTopics: ['benefits', 'time-off']
        },
        sessionHistory: []
      },
      {
        userId: 'mgr001',
        role: UserRole.MANAGER,
        department: 'Engineering',
        preferences: {
          communicationStyle: 'formal' as const,
          language: 'en',
          frequentTopics: ['policies', 'team-management']
        },
        sessionHistory: []
      },
      {
        userId: 'hr001',
        role: UserRole.HR_ADMIN,
        department: 'Human Resources',
        preferences: {
          communicationStyle: 'detailed' as const,
          language: 'en',
          frequentTopics: ['compliance', 'policies', 'benefits']
        },
        sessionHistory: []
      }
    ];

    const query = 'What is our remote work policy?';

    for (const user of users) {
      console.log(`\n👤 User: ${user.role} (${user.userId})`);
      
      try {
        const response = await this.agent.processQuery(query, user);
        console.log(`Response:\n${response.content}\n`);
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Create a mock File object for demonstration
   */
  private createMockFile(name: string, content: string): File {
    const blob = new Blob([content], { type: 'text/plain' });
    
    // Create a File-like object
    return Object.assign(blob, {
      name,
      lastModified: Date.now(),
      webkitRelativePath: ''
    }) as File;
  }

  /**
   * Show analytics and insights
   */
  async showAnalytics(): Promise<void> {
    console.log('\n📊 Analytics Demo');
    console.log('-'.repeat(30));

    // Get insights
    const insights = await this.agent.getQueryInsights();
    
    console.log(`Generated ${insights.length} insights:`);
    insights.forEach((insight, index) => {
      console.log(`${index + 1}. Topic: ${insight.topic}`);
      console.log(`   Frequency: ${insight.frequency}`);
      console.log(`   Trend: ${insight.trend}`);
      console.log(`   Last asked: ${insight.lastAsked.toLocaleString()}`);
      if (insight.relatedQuestions.length > 0) {
        console.log(`   Related: ${insight.relatedQuestions[0]}`);
      }
      console.log();
    });
  }
}

// Export function to run the demo
export async function runDocumentProcessingDemo(): Promise<void> {
  const demo = new DocumentProcessingDemo();
  await demo.runDemo();
  await demo.showAnalytics();
}

// If running directly
if (require.main === module) {
  runDocumentProcessingDemo().catch(console.error);
} 