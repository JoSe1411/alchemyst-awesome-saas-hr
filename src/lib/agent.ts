import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Tool } from 'langchain/tools';
import { createReactAgent, AgentExecutor } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { BasePromptTemplate } from '@langchain/core/prompts';

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

interface AgentResult {
  output: string;
  intermediateSteps?: Array<{
    action?: {
      tool?: string;
    };
  }>;
}

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
}

/**
 * Clean HR Agent with LLM, conversational memory, and tool support
 * Combines enhanced memory management with LangChain tools
 */
export class HRAgent {
  private llm!: ChatMistralAI;
  private embeddings!: MistralAIEmbeddings;
  private memoryManager!: EnhancedMemoryManager;
  private inputProcessor!: InputProcessor;
  private vectorStore!: MemoryVectorStore;
  private tools!: Tool[];
  private agent: AgentExecutor | null = null;

  constructor(redisConfig?: RedisConfig) {
    this.initializeComponents(redisConfig);
  }

  private initializeComponents(redisConfig?: RedisConfig): void {
    // Initialize LLM with Mistral
    this.llm = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY,
      temperature: 0.7,
    });

    // Initialize embeddings
    this.embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY,
      model: "mistral-embed",
    });

    // Initialize enhanced memory manager
    this.memoryManager = new EnhancedMemoryManager(redisConfig);
    
    // Initialize input processor
    this.inputProcessor = new InputProcessor();
    
    // Initialize vector store
    this.vectorStore = new MemoryVectorStore(this.embeddings);

    // Initialize tools
    this.tools = this.initializeTools();
    
    // Initialize LangChain agent
    this.initializeAgent();
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
      // Pull the ReAct prompt from LangChain Hub
      const prompt = await pull("hwchase17/react") as BasePromptTemplate;
      
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
        verbose: false,
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
      // Handle file uploads first
      if (files && files.length > 0) {
        await this.handleFileUploads(files, userContext.userId);
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

      // Use agent if available, otherwise use basic processing
      let responseMessage: ConversationMessage;
      
      if (this.agent && this.shouldUseAgent(input)) {
        responseMessage = await this.processWithAgent(input, userContext, files, inputType, userMessage);
      } else {
        responseMessage = await this.processWithBasicLLM(input, userContext, inputType, userMessage);
      }

      await this.memoryManager.addMessage(responseMessage, userContext.userId);
      return responseMessage;

    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('Failed to process query');
    }
  }

  /**
   * Process query using LangChain agent with tools
   */
  private async processWithAgent(
    input: string,
    userContext: UserContext,
    files?: FileUpload[],
    inputType: 'text' | 'voice' | 'image' | 'file' = 'text',
    userMessage?: ConversationMessage
  ): Promise<ConversationMessage> {
    try {
      // Get conversation history for context
      const conversationHistory = await this.memoryManager.getConversationHistory(userContext.userId, 5);
      
      // Build context-aware input for the agent
      const contextualInput = this.buildContextualInput(input, userContext, files, conversationHistory);

      // Execute with LangChain agent
      const result = await this.agent!.invoke({
        input: contextualInput,
        chat_history: this.formatChatHistory(conversationHistory)
      }) as AgentResult;

      return {
        id: this.generateMessageId(),
        role: 'assistant',
        content: result.output,
        timestamp: new Date(),
        metadata: {
          inputType,
          toolsUsed: result.intermediateSteps?.map((step) => step.action?.tool).filter((tool): tool is string => Boolean(tool)) || [],
          processingTime: userMessage ? Date.now() - userMessage.timestamp.getTime() : 0,
          agentMode: 'langchain'
        },
      };

    } catch (error) {
      console.error('Agent execution failed:', error);
      
      // Fallback to basic LLM
      const fallbackResponse = await this.processWithBasicLLM(input, userContext, inputType, userMessage);
      fallbackResponse.metadata = {
        ...fallbackResponse.metadata,
        inputType,
        agentMode: 'fallback',
        fallbackReason: 'Agent execution failed'
      };
      
      return fallbackResponse;
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
    const documentContext = relevantDocs
      .map(doc => `Title: ${doc.metadata.title}\nContent: ${doc.pageContent}`)
      .join('\n\n---\n\n');

    // Get conversation context
    const conversationHistory = await this.memoryManager.getConversationHistory(userContext.userId, 8);
    const topicContext = await this.memoryManager.getTopicContext(userContext.userId);
    const sessionContinuity = await this.memoryManager.getSessionContinuity(userContext.userId);

    // Build prompt
    const prompt = this.constructPrompt(
      processedInput.text,
      userContext,
      documentContext,
      conversationHistory,
      topicContext,
      sessionContinuity
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
   * Determine if we should use the agent with tools
   */
  private shouldUseAgent(input: string): boolean {
    const lowerInput = input.toLowerCase();
    const agentTriggers = [
      // Resume analysis
      'analyze resume', 'resume analysis', 'candidate',
      'compare candidates', 'evaluate', 'screening',
      'job requirements', 'hiring', 'recruitment',
      
      // Document processing
      'upload document', 'process document', 'categorize document',
      'search documents', 'document search',
      
      // Policy search
      'policy', 'policies', 'procedure', 'guidelines',
      'remote work', 'vacation', 'benefits', 'code of conduct',
      'performance review', 'compliance'
    ];
    
    return agentTriggers.some(trigger => lowerInput.includes(trigger));
  }

  /**
   * Handle file uploads
   */
  private async handleFileUploads(files: FileUpload[], userId: string): Promise<void> {
    for (const file of files) {
      try {
        // Store file metadata
        await this.memoryManager.storeFileMetadata(file.fileId, {
          fileId: file.fileId,
          originalName: file.originalName,
          size: file.size,
          mimeType: file.mimeType,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        });
        
        console.log(`📎 File uploaded: ${file.originalName} (${file.fileId})`);
      } catch (error) {
        console.error(`Failed to process file ${file.originalName}:`, error);
      }
    }
  }

  /**
   * Build contextual input for agent
   */
  private buildContextualInput(
    input: string, 
    userContext: UserContext, 
    files?: FileUpload[], 
    conversationHistory?: ConversationMessage[]
  ): string {
    let context = `User: ${userContext.role} in ${userContext.department}\n`;
    
    if (files && files.length > 0) {
      context += `Files uploaded: ${files.map(f => f.originalName).join(', ')}\n`;
    }
    
    if (conversationHistory && conversationHistory.length > 0) {
      const recentMessages = conversationHistory.slice(-2);
      context += `Recent conversation:\n${recentMessages.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n')}\n`;
    }
    
    context += `\nQuery: ${input}`;
    return context;
  }

  /**
   * Format chat history for agent
   */
  private formatChatHistory(history: ConversationMessage[]): string {
    return history.map(msg => 
      `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n');
  }

  /**
   * Construct enhanced prompt for basic LLM
   */
  private constructPrompt(
    query: string,
    userContext: UserContext,
    documentContext: string,
    conversationHistory: ConversationMessage[],
    topicContext: string,
    sessionContinuity: { isActiveSession: boolean; currentTopic: string | undefined; relatedQuestionCount: number; sessionDuration: number }
  ): string {
    const roleContext = this.getRoleSpecificContext(userContext.role);
    
    let conversationContextStr = '';
    if (conversationHistory.length > 1) {
      const recentExchanges = conversationHistory.slice(-4);
      conversationContextStr = `\nRecent Conversation:\n${recentExchanges.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n')}\n`;
    }

    let topicContinuityStr = '';
    if (topicContext && sessionContinuity.relatedQuestionCount > 1) {
      topicContinuityStr = `\nContinuing conversation about: ${sessionContinuity.currentTopic}\n${topicContext}\n`;
    }

    return `
You are an intelligent HR assistant helping a ${userContext.role} in the ${userContext.department} department.

User Profile:
- Role: ${userContext.role}
- Department: ${userContext.department}
- Communication Style: ${userContext.preferences.communicationStyle}
- Language: ${userContext.preferences.language}

${roleContext}
${conversationContextStr}
${topicContinuityStr}

Answer based on the following documents and conversation context:
---
${documentContext}
---

Current Query: ${query}

Response Guidelines:
- Be helpful and professional
- Match the user's communication style (${userContext.preferences.communicationStyle})
- Be concise but thorough
- Reference previous discussion when relevant
- If documents don't contain sufficient information, clearly state what's missing

Provide a clear, actionable response.
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
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
   * Get storage stats
   */
  async getStorageStats() {
    return this.memoryManager.getStorageStats();
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.memoryManager.isRedisConnected();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.inputProcessor.cleanup();
    await this.memoryManager.close();
  }
}
