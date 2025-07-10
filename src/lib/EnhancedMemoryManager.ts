import { PrismaClient } from '@prisma/client';
import type { ConversationMessage, UserContext, MessageMetadata } from '../types/index';
import type { JsonValue } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * Simplified Memory Manager with PostgreSQL persistence only
 */
export class EnhancedMemoryManager {
  // In-memory cache for faster access during active sessions
  private memoryCache: Map<string, ConversationMessage[]> = new Map();
  private userContexts: Map<string, UserContext> = new Map();

  constructor() {
    // No Redis initialization needed
  }

  /**
   * Add message with PostgreSQL persistence
   */
  async addMessage(message: ConversationMessage, userId: string): Promise<void> {
    try {
      // Add to memory cache first for fast access
      const messages = this.memoryCache.get(userId) || [];
      messages.push(message);
      
      // Keep only last 100 messages in cache
      if (messages.length > 100) {
        messages.splice(0, messages.length - 100);
      }
      
      this.memoryCache.set(userId, messages);

      // Determine user type from database
      const userType = await this.getUserType(userId);
      
      // Get or create conversation session
      let session = await prisma.conversationSession.findFirst({
        where: {
          userId,
          userType,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      if (!session) {
        // Create new session
        session = await prisma.conversationSession.create({
          data: {
            userId,
            userType,
            title: this.generateSessionTitle(message.content),
            messages: [this.serializeMessage(message)]
          }
        });
      } else {
        // Update existing session
        const currentMessages = Array.isArray(session.messages) ? session.messages as JsonValue[] : [];
        const updatedMessages = [...currentMessages, this.serializeMessage(message)];
        
        // Keep only last 200 messages in database
        if (updatedMessages.length > 200) {
          updatedMessages.splice(0, updatedMessages.length - 200);
        }

        await prisma.conversationSession.update({
          where: { id: session.id },
          data: {
            messages: updatedMessages,
            updatedAt: new Date()
          }
        });
      }

      console.log(`💾 Message stored in database for user: ${userId}`);
    } catch (error) {
      console.error('Database storage failed:', error);
      // Keep in memory cache as fallback
    }
  }

  /**
   * Get conversation history from database with memory cache fallback
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMessage[]> {
    try {
      // Try memory cache first for recent sessions
      const cachedMessages = this.memoryCache.get(userId);
      if (cachedMessages && cachedMessages.length > 0) {
        const recentMessages = cachedMessages.slice(-limit);
        if (recentMessages.length >= limit) {
          return recentMessages;
        }
      }

      // Fetch from database
      const userType = await this.getUserType(userId);
      const session = await prisma.conversationSession.findFirst({
        where: {
          userId,
          userType,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      if (session && Array.isArray(session.messages)) {
        const messages = (session.messages as JsonValue[])
          .map((msg) => this.deserializeMessage(msg))
          .filter((msg): msg is ConversationMessage => msg !== null)
          .slice(-limit);
        
        // Update memory cache
        this.memoryCache.set(userId, messages);
        
        console.log(`📖 Retrieved ${messages.length} messages from database for user: ${userId}`);
        return messages;
      }
    } catch (error) {
      console.error('Database retrieval failed:', error);
    }

    // Fallback to memory cache
    return this.memoryCache.get(userId)?.slice(-limit) || [];
  }

  /**
   * Update user context (simplified without Redis)
   */
  async updateContext(userContext: UserContext): Promise<void> {
    // Store in memory cache
    this.userContexts.set(userContext.userId, userContext);
    console.log(`🔄 Context updated for user: ${userContext.userId}`);
  }

  /**
   * Get user context
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    const context = this.userContexts.get(userId);
    if (context) {
      return {
        ...context,
        sessionHistory: await this.getConversationHistory(userId)
      };
    }
    return null;
  }

  /**
   * Get topic context for improved conversation flow
   */
  async getTopicContext(userId: string): Promise<string> {
    try {
      const history = await this.getConversationHistory(userId, 10);
      
      if (history.length === 0) {
        return 'No previous conversation context available.';
      }

      // Analyze recent messages for topic patterns
      const recentMessages = history.slice(-5).map(msg => msg.content.toLowerCase());
      const topics = this.extractTopics(recentMessages);
      
      if (topics.length > 0) {
        return `Current conversation topics: ${topics.join(', ')}. Continue providing relevant context based on these topics.`;
      }

      return 'General HR discussion context. Ready to assist with any HR-related queries.';
    } catch (error) {
      console.warn('Failed to get topic context:', error);
      return 'Unable to determine conversation context.';
    }
  }

  /**
   * Get session continuity information
   */
  async getSessionContinuity(userId: string): Promise<{
    isActiveSession: boolean;
    currentTopic: string | undefined;
    relatedQuestionCount: number;
    sessionDuration: number;
  }> {
    try {
      const history = await this.getConversationHistory(userId, 20);
      
      if (history.length === 0) {
        return {
          isActiveSession: false,
          currentTopic: undefined,
          relatedQuestionCount: 0,
          sessionDuration: 0
        };
      }

      const firstMessage = history[0];
      const lastMessage = history[history.length - 1];
      const now = new Date();
      
      // Calculate session duration
      const sessionDuration = lastMessage.timestamp.getTime() - firstMessage.timestamp.getTime();
      
      // Check if session is active (last message within 30 minutes)
      const isActiveSession = (now.getTime() - lastMessage.timestamp.getTime()) < (30 * 60 * 1000);
      
      // Extract current topic from recent messages
      const recentMessages = history.slice(-3).map(msg => msg.content.toLowerCase());
      const topics = this.extractTopics(recentMessages);
      const currentTopic = topics.length > 0 ? topics[0] : undefined;
      
      // Count related questions (similar topic mentions)
      const relatedQuestionCount = currentTopic 
        ? history.filter(msg => 
            msg.role === 'user' && 
            msg.content.toLowerCase().includes(currentTopic.toLowerCase())
          ).length
        : 0;

      return {
        isActiveSession,
        currentTopic,
        relatedQuestionCount,
        sessionDuration
      };
    } catch (error) {
      console.warn('Failed to get session continuity:', error);
      return {
        isActiveSession: false,
        currentTopic: undefined,
        relatedQuestionCount: 0,
        sessionDuration: 0
      };
    }
  }

  /**
   * Private helper methods
   */
  private async getUserType(userId: string): Promise<string> {
    try {
      // Check if user is a manager
      const manager = await prisma.manager.findUnique({ where: { id: userId } });
      if (manager) return 'manager';
      
      // Check if user is an employee
      const employee = await prisma.employee.findUnique({ where: { id: userId } });
      if (employee) return 'employee';
      
      // Default to employee if not found
      return 'employee';
    } catch (error) {
      console.warn('Failed to determine user type:', error);
      return 'employee';
    }
  }

  private generateSessionTitle(firstMessage: string): string {
    // Generate a simple title from the first message
    const words = firstMessage.split(' ').slice(0, 5);
    return words.join(' ') + (firstMessage.split(' ').length > 5 ? '...' : '');
  }

  private serializeMessage(message: ConversationMessage): JsonValue {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      metadata: message.metadata || null
    } as JsonValue;
  }

  private deserializeMessage(messageData: JsonValue): ConversationMessage | null {
    try {
      if (typeof messageData === 'object' && messageData !== null && !Array.isArray(messageData)) {
        const data = messageData as Record<string, unknown>;
        return {
          id: data.id as string,
          role: data.role as 'user' | 'assistant',
          content: data.content as string,
          timestamp: new Date(data.timestamp as string),
          metadata: data.metadata ? data.metadata as MessageMetadata : undefined
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to deserialize message:', error);
      return null;
    }
  }

  private extractTopics(messages: string[]): string[] {
    // Simple topic extraction - could be enhanced with NLP
    const commonTopics = [
      'benefits', 'vacation', 'leave', 'policy', 'payroll', 'hr',
      'hiring', 'training', 'performance', 'onboarding', 'compliance'
    ];
    
    const foundTopics: string[] = [];
    const messagesText = messages.join(' ').toLowerCase();
    
    for (const topic of commonTopics) {
      if (messagesText.includes(topic)) {
        foundTopics.push(topic);
      }
    }
    
    return foundTopics;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    databaseConnected: boolean;
    inMemoryCache: boolean;
    activeUsers?: number;
  }> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Count active conversation sessions
      const activeSessionsCount = await prisma.conversationSession.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      return {
        databaseConnected: true,
        inMemoryCache: true,
        activeUsers: activeSessionsCount
      };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return {
        databaseConnected: false,
        inMemoryCache: true,
        activeUsers: 0
      };
    }
  }

  /**
   * Cleanup old conversations
   */
  async cleanup(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - maxAge);
      
      // Clean up old conversation sessions
      const deletedSessions = await prisma.conversationSession.deleteMany({
        where: {
          updatedAt: {
            lt: cutoffTime
          }
        }
      });
      
      // Clean up in-memory cache
      for (const [userId, messages] of this.memoryCache.entries()) {
        const recentMessages = messages.filter(msg => msg.timestamp > cutoffTime);
        if (recentMessages.length !== messages.length) {
          if (recentMessages.length === 0) {
            this.memoryCache.delete(userId);
          } else {
            this.memoryCache.set(userId, recentMessages);
          }
        }
      }
      
      console.log(`✅ Cleanup completed: ${deletedSessions.count} old sessions removed`);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
} 