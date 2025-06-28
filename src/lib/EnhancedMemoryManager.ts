import { createClient, RedisClientType } from 'redis';
import type { ConversationMessage, UserContext } from '../types/index';

interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
}

interface ResumeAnalysisResult {
  candidateId: string;
  scores: Record<string, number>;
  recommendation: string;
  reasoning: string[];
  fitScore: number;
  missingRequirements: string[];
  strengths: string[];
  storedAt?: string;
}

interface FileMetadata {
  fileId: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt?: string;
}

/**
 * Enhanced Memory Manager with Redis persistence and in-memory fallback
 */
export class EnhancedMemoryManager {
  private redis: RedisClientType | null = null;
  private redisConnected = false;
  private connectionAttempted = false;
  
  // In-memory storage as fallback
  private memoryStorage: Map<string, ConversationMessage[]> = new Map();
  private userContexts: Map<string, UserContext> = new Map();

  constructor(config?: RedisConfig) {
    this.initializeRedis(config);
  }

  /**
   * Initialize Redis connection with fallback
   */
  private async initializeRedis(config?: RedisConfig): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    try {
      // Create Redis client
      this.redis = createClient({
        url: config?.url || 'redis://localhost:6379',
        socket: {
          host: config?.host || 'localhost',
          port: config?.port || 6379,
          reconnectStrategy: (retries: number) => {
            if (retries > 3) {
              console.warn('Redis reconnection failed, using in-memory fallback');
              return false;
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      // Handle connection events
      this.redis.on('error', (error: Error) => {
        console.warn('Redis connection error:', error.message);
        this.redisConnected = false;
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.redisConnected = true;
      });

      this.redis.on('disconnect', () => {
        console.warn('⚠️ Redis disconnected, using in-memory fallback');
        this.redisConnected = false;
      });

      // Connect to Redis
      await this.redis.connect();
      
    } catch (error) {
      console.warn('Redis initialization failed, using in-memory storage:', error);
      this.redis = null;
      this.redisConnected = false;
    }
  }

  /**
   * Enhanced message storage with Redis persistence
   */
  async addMessage(message: ConversationMessage, userId: string): Promise<void> {
    try {
      // Try Redis first
      if (this.redis && this.redisConnected) {
        const key = `messages:${userId}`;
        
        // Store message in Redis list (newest first)
        await this.redis.lPush(key, JSON.stringify({
          ...message,
          timestamp: message.timestamp.toISOString() // Serialize date
        }));
        
        // Keep only last 100 messages
        await this.redis.lTrim(key, 0, 99);
        
        // Set expiry to 24 hours
        await this.redis.expire(key, 86400);
        
        // Also store user session
        await this.storeUserSession(userId);
        
        console.log(`💾 Message stored in Redis for user: ${userId}`);
        return;
      }
    } catch (error) {
      console.warn('Redis storage failed, using memory fallback:', error);
    }

    // Fallback to in-memory storage
    const messages = this.memoryStorage.get(userId) || [];
    messages.push(message);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
      messages.splice(0, messages.length - 100);
    }
    
    this.memoryStorage.set(userId, messages);
  }

  /**
   * Enhanced conversation history retrieval
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMessage[]> {
    try {
      // Try Redis first
      if (this.redis && this.redisConnected) {
        const key = `messages:${userId}`;
        const messages = await this.redis.lRange(key, 0, limit - 1);
        
        if (messages.length > 0) {
          const parsedMessages = messages.map((msg: string) => {
            const parsed = JSON.parse(msg);
            return {
              ...parsed,
              timestamp: new Date(parsed.timestamp) // Deserialize date
            };
          });
          
          console.log(`📖 Retrieved ${parsedMessages.length} messages from Redis for user: ${userId}`);
          return parsedMessages.reverse(); // Reverse to get chronological order
        }
      }
    } catch (error) {
      console.warn('Redis retrieval failed, using memory fallback:', error);
    }

    // Fallback to in-memory storage
    const messages = this.memoryStorage.get(userId) || [];
    return messages.slice(-limit);
  }

  /**
   * Enhanced context storage
   */
  async updateContext(userContext: UserContext): Promise<void> {
    try {
      // Try Redis first
      if (this.redis && this.redisConnected) {
        const key = `session:${userContext.userId}`;
        
        // Store user context
        await this.redis.setEx(key, 86400, JSON.stringify({
          ...userContext,
          lastUpdated: new Date().toISOString()
        }));
        
        console.log(`🔄 Context updated in Redis for user: ${userContext.userId}`);
      }
    } catch (error) {
      console.warn('Redis context update failed, using memory fallback:', error);
    }

    // Always update memory (fallback + faster access)
    this.userContexts.set(userContext.userId, userContext);
  }

  /**
   * Get user context with Redis support
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      // Try Redis first
      if (this.redis && this.redisConnected) {
        const key = `session:${userId}`;
        const contextData = await this.redis.get(key);
        
        if (contextData) {
          const parsed = JSON.parse(contextData);
          return {
            ...parsed,
            sessionHistory: await this.getConversationHistory(userId)
          };
        }
      }
    } catch (error) {
      console.warn('Redis context retrieval failed, using memory fallback:', error);
    }

    // Fallback to in-memory storage
    return this.userContexts.get(userId) || null;
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
   * Extract topics from conversation messages
   */
  private extractTopics(messages: string[]): string[] {
    const topicKeywords = {
      'recruitment': ['hire', 'recruit', 'candidate', 'interview', 'job', 'position', 'vacancy'],
      'performance': ['performance', 'review', 'evaluation', 'feedback', 'goal', 'improvement'],
      'benefits': ['benefits', 'insurance', 'vacation', 'leave', 'pto', 'healthcare', 'retirement'],
      'policy': ['policy', 'procedure', 'guideline', 'rule', 'regulation', 'compliance'],
      'training': ['training', 'development', 'course', 'skill', 'education', 'learning'],
      'payroll': ['salary', 'pay', 'wage', 'compensation', 'bonus', 'payroll'],
      'onboarding': ['onboard', 'new hire', 'orientation', 'welcome', 'first day'],
      'employee relations': ['conflict', 'dispute', 'grievance', 'complaint', 'relationship']
    };

    const foundTopics: string[] = [];
    const messageText = messages.join(' ');

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => messageText.includes(keyword))) {
        foundTopics.push(topic);
      }
    }

    return foundTopics.slice(0, 3); // Return top 3 topics
  }

  /**
   * Store resume analysis results (NEW FEATURE)
   */
  async storeResumeAnalysis(candidateId: string, analysis: ResumeAnalysisResult): Promise<void> {
    try {
      if (this.redis && this.redisConnected) {
        const key = `analysis:${candidateId}`;
        
        await this.redis.setEx(key, 86400, JSON.stringify({
          ...analysis,
          storedAt: new Date().toISOString()
        }));
        
        console.log(`📊 Resume analysis stored for candidate: ${candidateId}`);
      }
    } catch (error) {
      console.warn('Failed to store resume analysis:', error);
    }
  }

  /**
   * Retrieve resume analysis results (NEW FEATURE)
   */
  async getResumeAnalysis(candidateId: string): Promise<ResumeAnalysisResult | null> {
    try {
      if (this.redis && this.redisConnected) {
        const key = `analysis:${candidateId}`;
        const data = await this.redis.get(key);
        
        if (data) {
          const parsed = JSON.parse(data) as ResumeAnalysisResult;
          console.log(`📊 Resume analysis retrieved for candidate: ${candidateId}`);
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve resume analysis:', error);
    }
    
    return null;
  }

  /**
   * Store file metadata for web uploads (NEW FEATURE)
   */
  async storeFileMetadata(fileId: string, metadata: FileMetadata): Promise<void> {
    try {
      if (this.redis && this.redisConnected) {
        const key = `file:${fileId}`;
        
        await this.redis.setEx(key, 3600, JSON.stringify({
          ...metadata,
          uploadedAt: new Date().toISOString()
        })); // 1 hour TTL for temporary files
        
        console.log(`📁 File metadata stored: ${fileId}`);
      }
    } catch (error) {
      console.warn('Failed to store file metadata:', error);
    }
  }

  /**
   * Get file metadata (NEW FEATURE)
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      if (this.redis && this.redisConnected) {
        const key = `file:${fileId}`;
        const data = await this.redis.get(key);
        
        if (data) {
          return JSON.parse(data) as FileMetadata;
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve file metadata:', error);
    }
    
    return null;
  }

  /**
   * Private helper to store session data
   */
  private async storeUserSession(userId: string): Promise<void> {
    try {
      if (this.redis && this.redisConnected) {
        const sessionKey = `session_activity:${userId}`;
        await this.redis.setEx(sessionKey, 86400, new Date().toISOString());
      }
    } catch {
      // Silent fail for session tracking
    }
  }

  /**
   * Get Redis connection status
   */
  isRedisConnected(): boolean {
    return this.redisConnected;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    redisConnected: boolean;
    inMemoryFallback: boolean;
    activeUsers?: number;
  }> {
    const stats = {
      redisConnected: this.redisConnected,
      inMemoryFallback: !this.redisConnected,
      activeUsers: undefined as number | undefined
    };

    try {
      if (this.redis && this.redisConnected) {
        // Count active sessions
        const keys = await this.redis.keys('session_activity:*');
        stats.activeUsers = keys.length;
      }
    } catch {
      // Silent fail
    }

    return stats;
  }

  /**
   * Cleanup old data
   */
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    // Redis handles TTL automatically, but clean up memory fallback
    const cutoffTime = new Date(Date.now() - maxAge);
    
    // Clean up in-memory message storage
    for (const [userId, messages] of this.memoryStorage.entries()) {
      const recentMessages = messages.filter(msg => msg.timestamp > cutoffTime);
      if (recentMessages.length !== messages.length) {
        this.memoryStorage.set(userId, recentMessages);
      }
    }
    
    console.log('✅ Memory cleanup completed, Redis TTL handles automatic cleanup');
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.disconnect();
        console.log('👋 Redis connection closed');
      } catch (error) {
        console.warn('Error closing Redis connection:', error);
      }
    }
  }
} 