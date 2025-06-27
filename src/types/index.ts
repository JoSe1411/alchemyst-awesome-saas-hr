export interface DocumentMetadata {
  fileName: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  tags: string[];
  version: string;
}

export enum DocumentCategory {
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  BENEFITS = 'benefits',
  ONBOARDING = 'onboarding',
  TRAINING = 'training',
  COMPLIANCE = 'compliance'
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  inputType: 'text' | 'voice' | 'image' | 'file';
  confidence?: number;
  sourceDocuments?: string[];
  processingTime?: number;
}

export interface UserContext {
  userId: string;
  role: UserRole;
  department: string;
  preferences: UserPreferences;
  sessionHistory: ConversationMessage[];
}

export enum UserRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  HR_ADMIN = 'hr_admin'
}

export interface UserPreferences {
  communicationStyle: 'formal' | 'casual' | 'detailed' | 'concise';
  language: string;
  frequentTopics: string[];
}

export interface QueryInsight {
  topic: string;
  frequency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  relatedQuestions: string[];
  lastAsked: Date;
}

export interface HRDocument {
  id: string;
  title: string;
  content: string;
  category: DocumentCategory;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  relatedDocuments: string[];
  versionHistory: DocumentVersion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  embedding?: number[];
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  chunkIndex: number;
  overlapStart: number;
  overlapEnd: number;
  pageNumber?: number;
  section?: string;
}

export interface DocumentVersion {
  version: string;
  changes: string;
  updatedBy: string;
  updatedAt: Date;
}
  