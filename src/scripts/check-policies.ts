import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPolicies() {
  try {
    console.log('🔍 Checking policy database...\n');

    // Check policy categories
    const categories = await prisma.policyCategory.findMany();
    console.log(`📂 Policy Categories (${categories.length}):`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name}: ${cat.description}`);
    });

    // Check policies
    const policies = await prisma.policy.findMany({
      include: {
        category: true,
        chunks: true
      }
    });

    console.log(`\n📄 Policies (${policies.length}):`);
    policies.forEach(policy => {
      console.log(`  - ${policy.title} (${policy.category.name})`);
      console.log(`    Status: ${policy.status}`);
      console.log(`    Version: ${policy.version}`);
      console.log(`    Chunks: ${policy.chunks.length}`);
      console.log(`    Created: ${policy.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Check policy chunks
    const chunks = await prisma.policyChunk.findMany({
      include: {
        policy: {
          include: {
            category: true
          }
        }
      }
    });

    console.log(`\n🧩 Policy Chunks (${chunks.length}):`);
    const chunksByPolicy = chunks.reduce((acc, chunk) => {
      const policyTitle = chunk.policy.title;
      if (!acc[policyTitle]) {
        acc[policyTitle] = [];
      }
      acc[policyTitle].push(chunk);
      return acc;
    }, {} as Record<string, typeof chunks>);

    Object.entries(chunksByPolicy).forEach(([policyTitle, policyChunks]) => {
      console.log(`  📄 ${policyTitle}:`);
      policyChunks.forEach(chunk => {
        console.log(`    Chunk ${chunk.chunkIndex}: ${chunk.content.substring(0, 100)}...`);
      });
      console.log('');
    });

    // Check vector store (if available)
    console.log('🔍 Vector Store Status:');
    try {
      const vectorChunks = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM policy_chunks WHERE embedding IS NOT NULL
      `;
      console.log(`  - Chunks with embeddings: ${(vectorChunks as Array<{count: number}>)[0]?.count || 0}`);
    } catch {
      console.log('  - Vector store not available or not configured');
    }

  } catch (error) {
    console.error('❌ Error checking policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPolicies(); 