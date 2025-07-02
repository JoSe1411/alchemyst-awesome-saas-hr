-- Add vector column to policy_chunks table
-- Run this AFTER running Prisma migrations

ALTER TABLE policy_chunks 
ADD COLUMN embedding vector(1024);

-- Create vector similarity search index
CREATE INDEX policy_chunks_embedding_idx ON policy_chunks 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100); 