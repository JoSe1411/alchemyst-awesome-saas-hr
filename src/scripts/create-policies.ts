import { PrismaClient } from '@prisma/client';
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { PolicyChunkService } from '../services/PolicyChunkService';

import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createPolicies() {
  try {
    console.log('🌱 Creating policies in database...\n');

    // Initialize embeddings
    const embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: "mistral-embed",
    });

    const policyChunkService = new PolicyChunkService(prisma, embeddings);

    // First, ensure we have the Benefits category
    const benefitsCategory = await prisma.policyCategory.upsert({
      where: { name: 'Benefits' },
      update: {},
      create: {
        name: 'Benefits',
        description: 'Employee benefits and compensation'
      }
    });

    console.log(`✅ Category ready: ${benefitsCategory.name}`);

    // Read the benefits guide
    const policyPath = path.join(process.cwd(), 'src', 'policies', 'benefits-guide.txt');
    const policyContent = fs.readFileSync(policyPath, 'utf-8');

    // Create the policy record
    const policy = await prisma.policy.create({
      data: {
        title: 'Employee Benefits Guide',
        categoryId: benefitsCategory.id,
        version: 1,
        content: policyContent,
        summary: 'Comprehensive guide to employee benefits including health, financial, time off, and professional development benefits.',
        effectiveDate: new Date('2024-07-01'),
        status: 'ACTIVE',
        createdBy: 'system',
        metadata: {
          source: policyPath,
          fileType: 'txt',
          size: policyContent.length
        }
      }
    });

    console.log(`✅ Created policy: ${policy.title}`);

    // Process the document into chunks using the content directly
    const splitter = new (await import('langchain/text_splitter')).RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const splitDocs = await splitter.createDocuments([policyContent]);
    
    let charIndex = 0;
    const documentChunks = splitDocs.map((doc, index) => {
      const chunk = {
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

    // Create policy chunks with embeddings
    const policyChunks = await policyChunkService.createPolicyChunks(policy.id, documentChunks);

    console.log(`✅ Created ${policyChunks.length} chunks for policy`);

    // Verify the chunks were created
    const createdChunks = await prisma.policyChunk.findMany({
      where: { policyId: policy.id },
      include: { policy: true }
    });

    console.log(`\n📊 Policy Summary:`);
    console.log(`  - Policy: ${policy.title}`);
    console.log(`  - Category: ${benefitsCategory.name}`);
    console.log(`  - Status: ${policy.status}`);
    console.log(`  - Version: ${policy.version}`);
    console.log(`  - Chunks: ${createdChunks.length}`);
    console.log(`  - Content Length: ${policyContent.length} characters`);

    console.log(`\n🧩 Chunk Preview:`);
    createdChunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`  Chunk ${index + 1}: ${chunk.content.substring(0, 100)}...`);
    });

    if (createdChunks.length > 3) {
      console.log(`  ... and ${createdChunks.length - 3} more chunks`);
    }

    console.log('\n🎉 Policy creation completed successfully!');

  } catch (error) {
    console.error('❌ Error creating policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createPolicies(); 