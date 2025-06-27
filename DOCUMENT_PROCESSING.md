# HR Agent Document Processing Feature

## Overview

The HR Agent's document processing feature enables intelligent ingestion, analysis, and retrieval of HR documents. This system provides semantic search capabilities, automatic categorization, and role-based access control.

## Core Features

### 1. Multi-Format Document Processing
- **PDF Files**: Extract text using pdf-parse library
- **Word Documents**: Process .docx/.doc files using mammoth
- **Text Files**: Direct text processing
- **Images**: OCR extraction using tesseract.js or similar
- **File Upload Support**: Browser-based file uploads

### 2. Intelligent Text Chunking
- **Overlapping Chunks**: Creates 1000-character chunks with 200-character overlap
- **Sentence Boundaries**: Respects natural text boundaries
- **Metadata Tracking**: Each chunk includes position and context information

### 3. Auto-Categorization
Documents are automatically categorized based on content analysis:
- **Policy**: Company policies, guidelines, rules
- **Procedure**: Step-by-step processes and workflows
- **Benefits**: Health insurance, retirement, vacation policies
- **Onboarding**: New hire materials and orientation
- **Training**: Educational content and development materials
- **Compliance**: Legal requirements and audit materials

### 4. Semantic Vector Search
- **OpenAI Embeddings**: Uses text-embedding-ada-002 model
- **Similarity Search**: Finds most relevant document chunks
- **Role-Based Filtering**: Returns appropriate content based on user permissions

### 5. Role-Based Access Control
- **Employee**: Access to general policies, benefits, and onboarding
- **Manager**: Additional access to management procedures (excluding confidential)
- **HR Admin**: Full access to all documents including sensitive compliance

## Architecture

### Components

1. **DocumentProcessor** (`src/lib/DocumentProcessor.ts`)
   - File parsing and text extraction
   - Chunk creation with overlap
   - Auto-categorization logic
   - Metadata extraction

2. **VectorStore** (`src/stores/VectorStore.ts`)
   - Embedding generation and storage
   - Similarity search with cosine similarity
   - Role-based access filtering
   - Document management (add/remove)

3. **HRAgent** (`src/lib/agent.ts`)
   - Main orchestration class
   - Query processing with context
   - Integration with LangChain and OpenAI

### Data Flow

```
File Upload → DocumentProcessor → Text Extraction → Chunking → Embedding → VectorStore
                     ↓
User Query → InputProcessor → Embedding → Similarity Search → Context Assembly → LLM Response
```

## Usage Examples

### Basic Document Ingestion

```typescript
import { HRAgent } from './lib/agent';
import { DocumentCategory } from './types/index';

const agent = new HRAgent();

// Ingest a policy document
const file = new File([policyContent], 'remote-work-policy.pdf');
const document = await agent.ingestDocument(file, DocumentCategory.POLICY);

console.log(`Document processed: ${document.title}`);
console.log(`Created ${document.chunks.length} chunks`);
```

### Querying Documents

```typescript
import { UserRole } from './types/index';

const userContext = {
  userId: 'emp001',
  role: UserRole.EMPLOYEE,
  department: 'Engineering',
  preferences: {
    communicationStyle: 'casual',
    language: 'en',
    frequentTopics: ['benefits', 'time-off']
  },
  sessionHistory: []
};

const response = await agent.processQuery(
  "What is our remote work policy?",
  userContext
);

console.log(response.content);
```

## Production Setup

### Required Dependencies

```bash
npm install pdf-parse mammoth tesseract.js
```

### Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### File Processing Libraries

For production use, replace the mock implementations with:

1. **PDF Processing**: `pdf-parse`
2. **Word Documents**: `mammoth`
3. **OCR**: `tesseract.js` or cloud services (Google Vision, Azure)
4. **Embeddings**: OpenAI API or local alternatives

## Security Considerations

1. **Input Validation**: All uploaded files are validated for type and size
2. **Content Filtering**: Basic inappropriate content detection
3. **Access Control**: Role-based permissions for document access
4. **Data Storage**: Embeddings stored in memory (use persistent storage in production)

## Performance Optimization

1. **Chunking Strategy**: Optimized for embedding model token limits
2. **Similarity Search**: Efficient cosine similarity calculation
3. **Caching**: In-memory storage for fast retrieval
4. **Batch Processing**: Process multiple documents simultaneously

## Future Enhancements

1. **Persistent Storage**: Database integration for production
2. **Advanced OCR**: Better image text extraction
3. **Document Relationships**: Link related documents automatically
4. **Version Control**: Track document updates and changes
5. **Analytics**: Enhanced query insights and usage patterns

## Demo

Run the demonstration to see the feature in action:

```typescript
import { runDocumentProcessingDemo } from './demo/document-processing-demo';

await runDocumentProcessingDemo();
```

This will show:
- Document ingestion with a sample policy
- Similarity search with various queries
- Role-based access control
- Analytics and insights

## API Reference

### DocumentProcessor Methods

- `processDocument(file, category?)`: Process uploaded file into HRDocument
- `extractTextFromFile(file)`: Extract raw text from various file formats
- `createTextChunks(text)`: Split text into overlapping chunks
- `autoCategorizDocument(text, filename)`: Determine document category

### VectorStore Methods

- `addDocument(document)`: Add document chunks to vector store
- `similaritySearch(query, topK?, userRole?)`: Find relevant documents
- `removeDocument(documentId)`: Remove document from store
- `getAllDocuments()`: Get all stored documents

### HRAgent Methods

- `ingestDocument(file, category?)`: Complete document processing pipeline
- `processQuery(input, userContext)`: Answer user queries with context
- `getQueryInsights(timeframe)`: Generate analytics insights 