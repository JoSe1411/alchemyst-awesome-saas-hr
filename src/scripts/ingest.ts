import { HRAgent } from '../lib/agent';
import * as fs from 'fs';
import * as path from 'path';

// Helper to create a File object from a buffer (Node.js)
function bufferToFile(buffer: Buffer, filename: string): File {
  const blob = new Blob([buffer]);
  return new File([blob], filename);
}

async function ingestDirectory(dirPath: string) {
  const agent = new HRAgent();
  const absoluteDir = path.resolve(dirPath);

  if (!fs.existsSync(absoluteDir)) {
    console.error(`Directory not found: ${absoluteDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(absoluteDir);
  if (entries.length === 0) {
    console.warn(`[ingest] No files found in ${absoluteDir}`);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(absoluteDir, entry);
    if (!fs.statSync(fullPath).isFile()) continue;

    try {
      const buffer = fs.readFileSync(fullPath);
      const file = bufferToFile(buffer, entry);
      const doc = await agent.ingestDocument(file);
      console.log(`✅ Ingested "${doc.title}" (${doc.chunks.length} chunks)`);
    } catch (err) {
      console.error(`❌ Failed to ingest ${entry}:`, err instanceof Error ? err.message : err);
    }
  }
}

// Default directory is ./src/policies. Allow override via CLI.
const targetDir = process.argv[2] || path.join(__dirname, '..', 'policies');

ingestDirectory(targetDir).catch((e) => {
  console.error('Ingestion error:', e instanceof Error ? e.message : e);
  process.exit(1);
});