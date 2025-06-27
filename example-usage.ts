#!/usr/bin/env node

/**
 * Example usage of the HR Agent Document Processing feature
 * 
 * This script demonstrates how to:
 * 1. Initialize the HR Agent
 * 2. Ingest documents
 * 3. Process user queries
 * 4. Get analytics insights
 */

import { HRAgent } from './src/lib/agent';
import { QueryInsight, UserRole } from './src/types/index';
import * as path from 'path';
import * as fs from 'fs';

// Helper function to create a mock File object for ingestion
function createFileObject(filePath: string): File {
    const buffer = fs.readFileSync(filePath);
    const blob = new Blob([buffer]);
    const file = new File([blob], path.basename(filePath));
    // Add path property for Node.js environment
    Object.defineProperty(file, 'path', { value: filePath, writable: true });
    return file;
}

async function main() {
  console.log('🤖 HR Agent Document Processing Example');
  console.log('=====================================\n');

  // Initialize the HR Agent
  const agent = new HRAgent();

  try {
    // Example 1: Ingest a sample document from the filesystem
    console.log('📄 Ingesting sample document...');

    try {
        // Define the path to the static benefits guide
        const benefitsGuidePath = path.resolve(__dirname, 'src', 'demo', 'documents', 'benefits-guide.txt');

        const docFile = createFileObject(benefitsGuidePath);
        const ingestedDoc = await agent.ingestDocument(docFile);

        console.log(`✅ Document "${ingestedDoc.title}" ingested successfully.`);
        console.log(`   - Chunks created: ${ingestedDoc.chunks.length}`);
        console.log(`   - Category: ${ingestedDoc.category}\n`);

    } catch (error) {
        console.error('Error ingesting document:', error);
        process.exit(1);
    }

    // Example 2: Create a user context
    const employeeContext = {
      userId: 'john.doe',
      role: UserRole.EMPLOYEE,
      department: 'Marketing',
      preferences: {
        communicationStyle: 'casual' as const,
        language: 'en',
        frequentTopics: ['benefits', 'time-off']
      },
      sessionHistory: []
    };

    // Example 3: Process some queries
    const queries = [
       'Is there a minimum work duration to qualify for benefits?',
    ];

    console.log('🔍 Processing user queries...\n');
    
    for (const query of queries) {
      console.log(`❓ Question: "${query}"`);
      
      try {
        const response = await agent.processQuery(query, employeeContext);
        console.log(`💬 Response: ${response.content}`);
        console.log(`📚 Source docs: ${response.metadata?.sourceDocuments?.length || 0}\n`);
      } catch (error) {
        console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }

    // Example 4: Get analytics insights
    console.log('📊 Generating insights...');
    const insights = await agent.getQueryInsights();
    
    if (insights.length > 0) {
      console.log(`📈 Found ${insights.length} insights:`);
      insights.slice(0, 3).forEach((insight: QueryInsight, index: number) => {
        console.log(`   ${index + 1}. ${insight.topic}: ${insight.frequency} queries (${insight.trend})`);
      });
    } else {
      console.log('   No insights available yet. Process more queries to generate analytics.');
    }

  } catch (error) {
    console.error('❌ Error during processing:', error);
    process.exit(1);
  }

  console.log('\n✅ Example completed successfully!');
  console.log('\n💡 Next steps:');
  console.log('   - Add more documents using agent.ingestDocument()');
  console.log('   - Try different user roles (MANAGER, HR_ADMIN)');
  console.log('   - Experiment with various query types');
  console.log('   - Set up environment variables for OpenAI API');
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main as runExample }; 