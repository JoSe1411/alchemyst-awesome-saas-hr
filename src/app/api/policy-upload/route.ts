import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { DocumentProcessor } from '@/lib/DocumentProcessor';
import { PolicyChunkService } from '@/services/PolicyChunkService';
import { DocumentCategory } from '@/types/index';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Policy title is required' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload .txt, .pdf, .doc, or .docx files' 
      }, { status: 400 });
    }

    // Initialize services
    const embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY || '',
      model: "mistral-embed",
    });
    
    const documentProcessor = new DocumentProcessor(embeddings);
    const policyChunkService = new PolicyChunkService(prisma, embeddings);

    // Find or create policy category
    let policyCategory = await prisma.policyCategory.findUnique({
      where: { name: category || 'General Policies' }
    });

    if (!policyCategory) {
      policyCategory = await prisma.policyCategory.create({
        data: {
          name: category || 'General Policies',
          description: `${category || 'General Policies'} category`
        }
      });
    }

    // Process the document
    const hrDocument = await documentProcessor.processDocument(file, category as DocumentCategory);

    // Get manager's company information
    const manager = await prisma.manager.findFirst({
      where: { id: userId },
      select: { company: true }
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Create policy record with company isolation
    const policy = await prisma.policy.create({
      data: {
        title,
        categoryId: policyCategory.id,
        companyId: manager.company, // NEW: Add company association
        managerId: userId, // NEW: Add manager association
        content: hrDocument.content,
        summary: `Summary for ${title}`,
        effectiveDate: new Date(),
        status: 'ACTIVE',
        createdBy: userId,
        version: 1,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          uploadedBy: userId,
          tags: hrDocument.metadata.tags,
        }
      }
    });

    // Create policy chunks with embeddings
    const policyChunks = await policyChunkService.createPolicyChunks(
      policy.id,
      hrDocument.chunks
    );

    return NextResponse.json({
      success: true,
      policy: {
        id: policy.id,
        title: policy.title,
        category: policyCategory.name,
        chunks: policyChunks.length,
        createdAt: policy.createdAt
      }
    });

  } catch (error) {
    console.error('Error uploading policy:', error);
    return NextResponse.json(
      { error: 'Failed to upload policy document' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get manager's company information
    const manager = await prisma.manager.findFirst({
      where: { id: userId },
      select: { company: true }
    });

    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }

    // Get all policies for the manager's company
    const policies = await prisma.policy.findMany({
      where: { 
        companyId: manager.company // NEW: Filter by company
      },
      include: {
        category: true,
        chunks: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      policies: policies.map(policy => ({
        id: policy.id,
        title: policy.title,
        category: policy.category.name,
        status: policy.status,
        version: policy.version,
        chunks: policy.chunks.length,
        createdAt: policy.createdAt,
        effectiveDate: policy.effectiveDate
      }))
    });

  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
} 