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
      const responseMessage = await this.processWithBasicLLM(input, userContext, inputType, userMessage);

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
    inputType: 'text' | 'voice' | 'image' | 'file' = 'text',
    userMessage?: ConversationMessage
  ): Promise<ConversationMessage> {
    // Process input
    const processedInput = await this.inputProcessor.process(input, inputType);
    
    // Retrieve relevant documents
    const relevantDocs = await this.vectorStore.similaritySearch(processedInput.text, 5);
    
    // Debug logging
    console.log(`🔍 Query: "${processedInput.text}"`);
    console.log(`📚 Found ${relevantDocs.length} relevant documents:`);
    relevantDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. Title: ${doc.metadata.title || 'Unknown'}`);
      console.log(`     Source: ${doc.metadata.source || 'Unknown'}`);
      console.log(`     Content preview: ${doc.pageContent.substring(0, 100)}...`);
    });
    
    const documentContext = relevantDocs
      .map(doc => `Title: ${doc.metadata.title}\nContent: ${doc.pageContent}`)
      .join('\n\n---\n\n');

    // Debug document context
    console.log(`📄 Document context length: ${documentContext.length} characters`);
    if (documentContext.length === 0) {
      console.warn('⚠️ No document context found - LLM will rely on general knowledge');
    }

    // Get conversation context
    const conversationHistory = await this.memoryManager.getConversationHistory(userContext.userId, 8);

    // Build prompt
    const prompt = this.constructPrompt(
      processedInput.text,
      userContext,
      documentContext,
      conversationHistory
    );

    // Get LLM response
    const response = await this.llm.invoke(prompt);

    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response.content as string,
      timestamp: new Date(),
      metadata: {
        inputType,
        sourceDocuments: relevantDocs.map((doc) => doc.metadata.source),
        processingTime: userMessage ? Date.now() - userMessage.timestamp.getTime() : 0,
        agentMode: 'basic',
        confidence: processedInput.confidence,
        wordCount: processedInput.metadata.wordCount,
        language: processedInput.metadata.language
      },
    };
  }

  /**
   * Construct enhanced prompt for basic LLM
   */
  private constructPrompt(
    query: string,
    userContext: UserContext,
    documentContext: string,
    conversationHistory: ConversationMessage[]
  ): string {
    let conversationContextStr = '';
    if (conversationHistory.length > 1) {
      const recentExchanges = conversationHistory.slice(-4);
      conversationContextStr = `\nRecent Conversation:\n${recentExchanges.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')}\n`;
    }

    return `You are an intelligent HR assistant for a company named Alchemyst. Your name is Aura.
You are helping a ${userContext.role} in the ${userContext.department} department.

Response Guidelines:
- Be helpful, professional, and concise.
- Answer based *only* on the documents provided in the "DOCUMENTS" section.
- If the documents don't contain the answer, say "I could not find the answer in the provided documents." Do not use outside knowledge.
- **Do not sign your messages or use placeholders like "[Your Name]".** Just provide the answer.
- Only refer to the "Recent Conversation" if the user's "Current Query" is a direct follow-up question (e.g., "what about for them?"). Otherwise, ignore the conversation history.
- If you use information from a document, cite it by its title (e.g., "According to the benefits-guide...").

DOCUMENTS:
---
${documentContext}
---

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
