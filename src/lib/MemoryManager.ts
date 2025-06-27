import type { ConversationMessage, UserContext, QueryInsight } from '../types/index';

interface UserSession {
  userId: string;
  context: UserContext;
  messages: ConversationMessage[];
  lastActive: Date;
}

export class MemoryManager {
  private sessions: Map<string, UserSession> = new Map();
  private queryHistory: Map<string, ConversationMessage[]> = new Map();

  constructor() {
    // In production, you'd initialize with persistent storage (Redis, database, etc.)
  }

  /**
   * Update user context in memory
   */
  async updateContext(userContext: UserContext): Promise<void> {
    const session = this.sessions.get(userContext.userId) || {
      userId: userContext.userId,
      context: userContext,
      messages: [],
      lastActive: new Date(),
    };

    session.context = { ...session.context, ...userContext };
    session.lastActive = new Date();
    
    this.sessions.set(userContext.userId, session);
  }

  /**
   * Add a message to user's conversation history
   */
  async addMessage(message: ConversationMessage, userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error(`No session found for user: ${userId}`);
    }

    session.messages.push(message);
    session.lastActive = new Date();

    // Also track in query history for insights
    const userQueries = this.queryHistory.get(userId) || [];
    userQueries.push(message);
    this.queryHistory.set(userId, userQueries);

    // Keep only last 100 messages to prevent memory bloat
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100);
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMessage[]> {
    const session = this.sessions.get(userId);
    if (!session) {
      return [];
    }

    return session.messages.slice(-limit);
  }

  /**
   * Get user context
   */
  async getUserContext(userId: string): Promise<UserContext | null> {
    const session = this.sessions.get(userId);
    return session?.context || null;
  }

  /**
   * Generate query insights for analytics
   */
  async generateInsights(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<QueryInsight[]> {
    const now = new Date();
    const cutoffDate = this.getCutoffDate(now, timeframe);
    
    // Aggregate query topics from all users
    const topicCounts = new Map<string, number>();
    const topicLastAsked = new Map<string, Date>();
    const relatedQuestions = new Map<string, Set<string>>();

    for (const messages of this.queryHistory.values()) {
      for (const message of messages) {
        if (message.timestamp >= cutoffDate && message.role === 'user') {
          const topics = this.extractTopics(message.content);
          
          for (const topic of topics) {
            topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            
            // Track latest occurrence
            const lastAsked = topicLastAsked.get(topic);
            if (!lastAsked || message.timestamp > lastAsked) {
              topicLastAsked.set(topic, message.timestamp);
            }

            // Track related questions
            if (!relatedQuestions.has(topic)) {
              relatedQuestions.set(topic, new Set());
            }
            relatedQuestions.get(topic)!.add(message.content);
          }
        }
      }
    }

    // Convert to insights
    const insights: QueryInsight[] = [];
    for (const [topic, frequency] of topicCounts.entries()) {
      insights.push({
        topic,
        frequency,
        trend: this.calculateTrend(), // Simplified - always stable for now
        relatedQuestions: Array.from(relatedQuestions.get(topic) || []).slice(0, 5),
        lastAsked: topicLastAsked.get(topic) || now,
      });
    }

    // Sort by frequency and return top 20
    return insights
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);
  }

  /**
   * Clear old sessions (cleanup method)
   */
  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [userId, session] of this.sessions.entries()) {
      if (session.lastActive < cutoff) {
        this.sessions.delete(userId);
        this.queryHistory.delete(userId);
      }
    }
  }

  /**
   * Get total number of active sessions
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get session statistics
   */
  getSessionStats(): { totalSessions: number; totalMessages: number; avgMessagesPerSession: number } {
    const totalSessions = this.sessions.size;
    const totalMessages = Array.from(this.sessions.values())
      .reduce((sum, session) => sum + session.messages.length, 0);
    
    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession: totalSessions > 0 ? totalMessages / totalSessions : 0,
    };
  }

  // Helper methods
  private getCutoffDate(now: Date, timeframe: 'daily' | 'weekly' | 'monthly'): Date {
    const cutoff = new Date(now);
    
    switch (timeframe) {
      case 'daily':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'weekly':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'monthly':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
    }
    
    return cutoff;
  }

  private extractTopics(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const topics: string[] = [];

    // Simple topic extraction based on keywords
    const topicKeywords = {
      'benefits': ['benefit', 'insurance', 'health', '401k', 'retirement'],
      'time-off': ['vacation', 'pto', 'sick', 'leave', 'holiday'],
      'policy': ['policy', 'rule', 'guideline', 'procedure'],
      'payroll': ['salary', 'pay', 'payroll', 'bonus', 'compensation'],
      'onboarding': ['onboard', 'new hire', 'orientation', 'getting started'],
      'training': ['training', 'course', 'learning', 'development'],
      'remote-work': ['remote', 'work from home', 'telecommute'],
      'compliance': ['compliance', 'legal', 'regulation'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        topics.push(topic);
      }
    }

    // If no specific topics found, return generic
    return topics.length > 0 ? topics : ['general'];
  }

  private calculateTrend(): 'increasing' | 'decreasing' | 'stable' {
    // Simplified implementation - in production, you'd compare with previous periods
    return 'stable';
  }
} 