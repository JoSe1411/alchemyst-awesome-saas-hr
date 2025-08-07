import { MistralAIEmbeddings } from "@langchain/mistralai";
import { ChatOpenAI } from "@langchain/openai";
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Tool } from 'langchain/tools';
import { createReactAgent, AgentExecutor } from 'langchain/agents';
import { PromptTemplate } from '@langchain/core/prompts';

import { EnhancedMemoryManager } from './EnhancedMemoryManager';
import { InputProcessor } from './InputProcessor';
import { ResumeAnalysisTool } from './tools/ResumeAnalysisTool';
import { DocumentProcessingTool } from './tools/DocumentProcessingTool';
import { PolicySearchTool } from './tools/PolicySearchTool';
import type { 
  ConversationMessage, 
  UserContext, 
  FileUpload
} from '../types/index';
import { UserRole } from '../types/index';

import dotenv from 'dotenv';
dotenv.config();

/**
 * Clean HR Agent with LLM, conversational memory, and tool support
 * Combines enhanced memory management with LangChain tools
 */
export class HRAgent {
  private llm!: ChatOpenAI;
  private embeddings!: MistralAIEmbeddings;
  private memoryManager!: EnhancedMemoryManager;
  private inputProcessor!: InputProcessor;
  private vectorStore!: MemoryVectorStore;
  private tools!: Tool[];
  private agent: AgentExecutor | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initializeComponents();
  }

  private async initializeComponents(): Promise<void> {
    // Initialize LLM with Mistral
    this.llm = new ChatOpenAI({
      model: process.env.MODEL_NAME,
      temperature: 0.7,
      configuration: {
        apiKey: process.env.PROXY_API_KEY,
        baseURL: process.env.PROXY_BASE_URL,
      },
    });

    // Initialize embeddings
    this.embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY,
      model: "mistral-embed",
    });

    // Initialize enhanced memory manager
    this.memoryManager = new EnhancedMemoryManager();
    
    // Initialize input processor
    this.inputProcessor = new InputProcessor();
    
    // Initialize vector store
    this.vectorStore = new MemoryVectorStore(this.embeddings);

    // Auto-ingest policy documents on startup (AWAIT this!)
    await this.autoIngestPolicyDocuments();

    // Initialize tools
    this.tools = this.initializeTools();
    
    // Initialize LangChain agent
    await this.initializeAgent();
    
    this.isInitialized = true;
  }

  /**
   * Ensure agent is initialized before processing queries
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      // If not initialized, wait a bit and check again
      let attempts = 0;
      while (!this.isInitialized && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!this.isInitialized) {
        throw new Error('Agent initialization timeout');
      }
    }
  }

  /**
   * Auto-ingest policy documents on startup
   */
  private async autoIngestPolicyDocuments(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Define policy directory path
      const policyDir = path.join(process.cwd(), 'src', 'policies');
      
      if (!fs.existsSync(policyDir)) {
        console.warn('⚠️ Policy directory not found, skipping auto-ingestion');
        return;
      }

      const files = fs.readdirSync(policyDir);
      const policyFiles = files.filter(file => file.endsWith('.txt') || file.endsWith('.md'));
      
      if (policyFiles.length === 0) {
        console.warn('⚠️ No policy files found, skipping auto-ingestion');
        return;
      }

      console.log(`📚 Auto-ingesting ${policyFiles.length} policy documents...`);
      
      for (const file of policyFiles) {
        try {
          const filePath = path.join(policyDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const metadata = {
            title: path.basename(file, path.extname(file)),
            source: filePath
          };
          
          await this.ingestDocument(content, metadata);
          console.log(`✅ Auto-ingested: ${metadata.title}`);
        } catch (error) {
          console.error(`❌ Failed to auto-ingest ${file}:`, error);
        }
      }
      
      console.log('🎉 Auto-ingestion completed successfully');
    } catch (error) {
      console.error('❌ Auto-ingestion failed:', error);
    }
  }

  /**
   * Initialize available tools
   */
  private initializeTools(): Tool[] {
    const tools: Tool[] = [];

    // Resume Analysis Tool
    const resumeAnalysisTool = new ResumeAnalysisTool(this.memoryManager, this.llm);
    tools.push(resumeAnalysisTool);

    // Document Processing Tool
    const documentProcessingTool = new DocumentProcessingTool(this.memoryManager);
    tools.push(documentProcessingTool);

    // Policy Search Tool
    const policySearchTool = new PolicySearchTool(this.memoryManager);
    tools.push(policySearchTool);

    // TODO: Add more tools as needed
    // - CandidateComparisonTool
    // - InterviewPrepTool
    // - ComplianceCheckTool

    return tools;
  }

  /**
   * Initialize LangChain ReAct agent
   */
  private async initializeAgent(): Promise<void> {
    try {
      // A more robust custom prompt to enforce the ReAct flow
      const promptTemplate = `
Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}`;

      const prompt = new PromptTemplate({
        template: promptTemplate,
        inputVariables: ["tools", "tool_names", "input", "agent_scratchpad"],
      });
      
      // Create the agent
      const agent = await createReactAgent({
        llm: this.llm,
        tools: this.tools,
        prompt: prompt,
      });

      // Create agent executor
      this.agent = new AgentExecutor({
        agent,
        tools: this.tools,
        verbose: true,
        maxIterations: 3,
        returnIntermediateSteps: true,
      });

      console.log('✅ HR Agent initialized with tools and memory');
    } catch (error) {
      console.warn('⚠️ Failed to initialize LangChain agent, using basic mode:', error);
      this.agent = null;
    }
  }

  /**
   * Main query processing method with file upload support
   */
  async processQuery(
    input: string,
    userContext: UserContext,
    files?: FileUpload[],
    inputType: 'text' | 'voice' | 'image' | 'file' = 'text'
  ): Promise<ConversationMessage> {
    try {
      // Ensure agent is fully initialized before processing
      await this.ensureInitialized();

      // Handle file uploads first
      if (files && files.length > 0) {
        console.log(`📎 Processing ${files.length} file(s) for user: ${userContext.userId}`);
        for (const file of files) {
          console.log(`  - ${file.originalName} (${file.fileId})`);
        }
      }

      // Update context in memory
      await this.memoryManager.updateContext(userContext);

      const userMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        metadata: { 
          inputType,
          fileCount: files?.length || 0,
          fileIds: files?.map(f => f.fileId)
        },
      };
      
      await this.memoryManager.addMessage(userMessage, userContext.userId);

      // The ReAct agent logic has been removed in favor of a more reliable direct LLM call.
      const responseMessage = await this.processWithBasicLLM(input, userContext, inputType);

      await this.memoryManager.addMessage(responseMessage, userContext.userId);
      return responseMessage;

    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('Failed to process query');
    }
  }

  /**
   * Process query using basic LLM without tools
   */
  private async processWithBasicLLM(
    input: string,
    userContext: UserContext,
    inputType: 'text' | 'voice' | 'image' | 'file' = 'text'
  ): Promise<ConversationMessage> {
    try {
      // Get conversation history
      const conversationHistory = await this.memoryManager.getConversationHistory(userContext.userId, 10);
    
      // Get relevant documents from vector store
      const relevantDocs = await this.vectorStore.similaritySearch(input, 3);
      const documentContext = relevantDocs.map(doc => doc.pageContent).join('\n\n');

      // NEW: Get relevant company policies for this query
      const policyContext = await this.getRelevantPolicyContext(input, userContext);

      // Construct enhanced prompt with policy context
      const prompt = this.constructEnhancedPrompt(input, userContext, documentContext, policyContext, conversationHistory);

      // Get response from LLM
    const response = await this.llm.invoke(prompt);
      const responseContent = response.content as string;

      const responseMessage: ConversationMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
        content: responseContent,
      timestamp: new Date(),
      metadata: {
        inputType,
          sourceDocuments: relevantDocs.map(doc => doc.metadata.source || 'unknown'),
          toolsUsed: policyContext ? ['policy_search'] : []
        },
      };

      return responseMessage;
    } catch (error) {
      console.error('Error in basic LLM processing:', error);
      throw error;
    }
  }

  /**
   * NEW: Get relevant company policies for the current query
   */
  private async getRelevantPolicyContext(query: string, userContext: UserContext): Promise<string> {
    try {
      // Find the policy search tool
      const policySearchTool = this.tools.find(tool => tool.name === 'policy_search');
      
      if (!policySearchTool) {
        console.warn('Policy search tool not available');
        return '';
      }

      // Get user's company context
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      let companyId: string | undefined;
      
      // Try to get company from manager or employee
      const manager = await prisma.manager.findFirst({
        where: { id: userContext.userId },
        select: { company: true }
      });
      
      if (manager) {
        companyId = manager.company;
      } else {
        const employee = await prisma.employee.findFirst({
          where: { id: userContext.userId },
          select: { company: true }
        });
        
        if (employee) {
          companyId = employee.company;
        }
      }

      if (!companyId) {
        console.warn('No company found for user:', userContext.userId);
        return '';
      }

      // Search for relevant policies with company context
      const searchInput = JSON.stringify({
        action: 'search',
        query: query,
        category: userContext.department, // Use department as category filter
        companyId: companyId // NEW: Add company context
      });

      const policyResults = await policySearchTool.call(searchInput);
      const parsedResults = JSON.parse(policyResults) as {
        success: boolean;
        policies?: Array<{
          title: string;
          category: string;
          summary: string;
          relevanceScore?: number;
        }>;
      };

      if (!parsedResults.success || !parsedResults.policies || parsedResults.policies.length === 0) {
        return '';
      }

      // Format policy context for the prompt
      const policyContext = parsedResults.policies
        .slice(0, 2) // Limit to top 2 most relevant policies
        .map((policy) => 
          `Policy: ${policy.title}\nCategory: ${policy.category}\nSummary: ${policy.summary}\nRelevance: ${policy.relevanceScore?.toFixed(2) || 'N/A'}`
        )
        .join('\n\n');

      return policyContext;
    } catch (error) {
      console.error('Error getting policy context:', error);
      return '';
    }
  }

  /**
   * Enhanced prompt construction with policy context
   */
  private constructEnhancedPrompt(
    query: string,
    userContext: UserContext,
    documentContext: string,
    policyContext: string,
    conversationHistory: ConversationMessage[]
  ): string {
    let conversationContextStr = '';
    if (conversationHistory.length > 1) {
      const recentExchanges = conversationHistory.slice(-4);
      conversationContextStr = `\nRecent Conversation:\n${recentExchanges.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')}\n`;
    }

    // NEW: Enhanced prompt with policy awareness
    const policySection = policyContext ? `
RELEVANT COMPANY POLICIES:
---
${policyContext}
---

IMPORTANT: When responding, consider these company policies and ensure your answer aligns with them. If the policies provide specific guidance, reference them in your response.
` : '';

    return `You are an intelligent HR assistant for a company named TalentWise. Your name is Aura.
You are helping a ${userContext.role} in the ${userContext.department} department.

Response Guidelines:
- Be helpful, professional, and concise.
- Answer based *only* on the documents provided in the "DOCUMENTS" section.
- If the documents don't contain the answer, say "I could not find the answer in the provided documents." Do not use outside knowledge.
- **Do not sign your messages or use placeholders like "[Your Name]".** Just provide the answer.
- Only refer to the "Recent Conversation" if the user's "Current Query" is a direct follow-up question (e.g., "what about for them?"). Otherwise, ignore the conversation history.
- If you use information from a document, cite it by its title (e.g., "According to the benefits-guide...").
- **NEW: Always consider company policies when responding. If relevant policies exist, ensure your response aligns with them and mention them when appropriate.**

DOCUMENTS:
---
${documentContext}
---${policySection}

Recent Conversation:
${conversationContextStr}

Current Query: ${query}
`;
  }

  /**
   * Get role-specific context
   */
  private getRoleSpecificContext(role: UserRole): string {
    switch (role) {
      case UserRole.EMPLOYEE:
        return 'Focus on employee self-service, benefits, policies, and career development.';
      case UserRole.MANAGER:
        return 'Provide management guidance on team policies, performance, and HR procedures.';
      case UserRole.HR_ADMIN:
        return 'Offer comprehensive HR administration support, compliance, and policy guidance.';
      default:
        return 'Provide general HR assistance and guidance.';
    }
  }

  /**
   * Utility methods
   */
  private generateMessageId(): string {
    // Use a more deterministic approach to avoid hydration issues
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `msg_${timestamp}_${randomPart}`;
  }

  /**
   * Document ingestion
   */
  async ingestDocument(content: string, metadata: { title: string; source: string }): Promise<void> {
    const doc = new Document({
      pageContent: content,
      metadata
    });
    
    await this.vectorStore.addDocuments([doc]);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMessage[]> {
    return this.memoryManager.getConversationHistory(userId, limit);
  }

  /**
   * Resume analysis shortcut
   */
  async analyzeResume(
    candidateId: string, 
    resumeContent?: string, 
    fileId?: string,
    jobRequirementsPath?: string
  ) {
    if (!this.tools.length) {
      throw new Error('Resume analysis tool not available');
    }

    const resumeAnalysisTool = this.tools.find(tool => tool.name === 'resume_analyzer') as ResumeAnalysisTool;
    if (!resumeAnalysisTool) {
      throw new Error('Resume analysis tool not found');
    }

    const input = JSON.stringify({
      candidateId,
      resumeContent,
      fileId,
      jobRequirementsPath
    });

    const result = await resumeAnalysisTool._call(input);
    return JSON.parse(result);
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    databaseConnected: boolean;
    inMemoryCache: boolean;
    activeUsers?: number;
  }> {
    return await this.memoryManager.getStorageStats();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.inputProcessor.cleanup();
    await this.memoryManager.cleanup();
  }
}
