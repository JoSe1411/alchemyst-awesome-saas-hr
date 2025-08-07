import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createPoliciesSimple() {
  try {
    console.log('🌱 Creating policies in database (simple version)...\n');

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

    // Create simple chunks without embeddings
    const chunkSize = 1000;
    const chunkOverlap = 200;
    const chunks: any[] = [];
    
    for (let i = 0; i < policyContent.length; i += chunkSize - chunkOverlap) {
      const start = i;
      const end = Math.min(i + chunkSize, policyContent.length);
      const content = policyContent.substring(start, end);
      
      const chunk = await prisma.policyChunk.create({
        data: {
          policyId: policy.id,
          chunkIndex: chunks.length,
          content: content,
          startIndex: start,
          endIndex: end,
          metadata: {
            chunkIndex: chunks.length,
            overlapStart: Math.max(0, start - chunkOverlap),
            overlapEnd: Math.min(policyContent.length, end + chunkOverlap),
          }
        }
      });
      
      chunks.push(chunk);
    }

    console.log(`✅ Created ${chunks.length} chunks for policy`);

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

createPoliciesSimple(); 