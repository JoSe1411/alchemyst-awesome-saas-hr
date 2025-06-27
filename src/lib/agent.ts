import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { Document } from 'langchain/document';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

import { DocumentProcessor } from './DocumentProcessor';
import { MemoryManager } from './MemoryManager';
import { InputProcessor } from './InputProcessor';
import type { HRDocument, ConversationMessage, UserContext, QueryInsight } from '../types/index';
import { UserRole, DocumentCategory } from '../types/index';

import dotenv from 'dotenv';
dotenv.config();

export class HRAgent {
  private llm!: ChatMistralAI;
  private embeddings!: MistralAIEmbeddings;
  private documentProcessor!: DocumentProcessor;
  private memoryManager!: MemoryManager;
  private inputProcessor!: InputProcessor;
  private vectorStore!: MemoryVectorStore;

  constructor() {
    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Initialize LLM - Use Mistral's official API
    this.llm = new ChatMistralAI({
      model: "mistral-large-latest",
      apiKey: process.env.MISTRAL_API_KEY,
      temperature: 0.7,
    });

    // Initialize embeddings - Use Mistral's official API
    this.embeddings = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY,
      model: "mistral-embed",
    });

    // Initialize components
    this.documentProcessor = new DocumentProcessor(this.embeddings);
    this.memoryManager = new MemoryManager();
    this.inputProcessor = new InputProcessor();
    // Use LangChain's official in-memory vector store
    this.vectorStore = new MemoryVectorStore(this.embeddings);
  }

  async processQuery(
    input: string,
    userContext: UserContext,
    inputType: 'text' | 'voice' | 'image' | 'file' = 'text'
  ): Promise<ConversationMessage> {
    try {
      // --- Persist user context & incoming message ---
      await this.memoryManager.updateContext(userContext);

      const userMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: input,
        timestamp: new Date(),
        metadata: { inputType },
      };
      await this.memoryManager.addMessage(userMessage, userContext.userId);

      const processedInput = await this.inputProcessor.process(input, inputType);
      
      // Retrieve relevant documents from the new vector store
      const relevantDocs = await this.vectorStore.similaritySearch(processedInput, 5);

      const documentContext = relevantDocs
        .map(doc => `Title: ${doc.metadata.title}\nContent: ${doc.pageContent}`)
        .join('\n\n---\n\n');

      const fullPrompt = this.constructPrompt(processedInput, userContext, documentContext);

      const response = await this.llm.invoke(fullPrompt);

      const responseMessage: ConversationMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.content as string,
        timestamp: new Date(),
        metadata: {
          inputType,
          sourceDocuments: relevantDocs.map((doc) => doc.metadata.source),
        },
      };

      // Persist assistant response
      await this.memoryManager.addMessage(responseMessage, userContext.userId);

      return responseMessage;
    } catch (error) {
      console.error('Error processing query:', error);
      throw new Error('Failed to process query');
    }
  }

  private constructPrompt(
    query: string,
    userContext: UserContext,
    documentContext: string
  ): string {
    const roleContext = this.getRoleSpecificContext(userContext.role);

    return `
      You are an intelligent HR assistant helping ${userContext.role} with HR-related queries.
      
      User Context:
      - Role: ${userContext.role}
      - Department: ${userContext.department}
      - Communication Style: casual
      
      ${roleContext}
      
      Answer the user's query based *only* on the following documents. Do NOT copy large sections verbatim; instead, paraphrase or summarise the relevant parts:
      ---
      ${documentContext}
      ---
      
      User Query: ${query}
      
      Please provide a helpful, accurate response that is concise and to the point. Your answer should:
      - be no longer than 3 sentences or ~80 words
      - use short bullet points if listing items
      - avoid quoting long passages from the policy (paraphrase instead)
      - include references or links only if explicitly requested
      If the documents do not contain enough information, clearly state that you do not have sufficient data to answer.
    `;
  }

  private getRoleSpecificContext(role: UserRole): string {
    switch (role) {
      case UserRole.EMPLOYEE:
        return 'Focus on employee-facing information, benefits, and general policies.';
      case UserRole.MANAGER:
        return 'Include management-specific procedures, team policies, and leadership guidance.';
      case UserRole.HR_ADMIN:
        return 'Provide comprehensive information including administrative procedures and compliance details.';
      default:
        return 'Provide general HR information appropriate for all users.';
    }
  }

  async ingestDocument(file: File, category?: DocumentCategory): Promise<HRDocument> {
    try {
      const document = await this.documentProcessor.processDocument(file, category);
      
      // Convert our custom chunks into LangChain's standard Document format
      const lcDocs = document.chunks.map(chunk => new Document({
        pageContent: chunk.content,
        metadata: {
          source: document.metadata.fileName,
          title: document.title,
          category: document.category,
        }
      }));

      // Add documents to the vector store
      await this.vectorStore.addDocuments(lcDocs);
      
      console.log(`Document ingested and added to vector store: ${document.title}`);
      return document;  // <-- return the ingested document so callers can access its metadata
    } catch (error) {
      console.error('Error ingesting document:', error);
      throw new Error(`Failed to ingest document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getQueryInsights(timeframe: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<QueryInsight[]> {
    return this.memoryManager.generateInsights(timeframe);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Public helper to expose raw similarity search without needing to access
   * internal properties. Useful for demos or chaining.
   */
  async similaritySearch(query: string, topK: number = 5) {
    return this.vectorStore.similaritySearch(query, topK);
  }
}
