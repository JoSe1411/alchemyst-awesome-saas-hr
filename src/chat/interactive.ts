import readline from 'node:readline';
import { HRAgent } from '../lib/agent';
import { UserRole, UserContext } from '../types';
import fs from 'fs';
import path from 'path';

// Helper to create a user context for the session
function buildUserContext(): Promise<UserContext> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<UserContext>((resolve) => {
    const context: UserContext = {
      userId: '',
      role: UserRole.EMPLOYEE,
      department: '',
      preferences: {
        communicationStyle: 'casual' as const,
        language: 'en',
        frequentTopics: [] as string[],
      },
      sessionHistory: [],
    };

    const askUserId = () => {
      rl.question('🆔 User ID: ', (userId) => {
        context.userId = userId.trim() || 'anonymous';
        askDepartment();
      });
    };

    const askDepartment = () => {
      rl.question('💼 Department (optional): ', (dept) => {
        context.department = dept.trim();
        askRole();
      });
    };

    const askRole = () => {
      rl.question('👤 Role (employee | manager | hr_admin) [employee]: ', (role) => {
        const val = role.trim().toUpperCase();
        if (val && val in UserRole) {
          context.role = UserRole[val as keyof typeof UserRole];
        }
        rl.close();
        resolve(context);
      });
    };

    askUserId();
  });
}

// Pre-ingest all documents in ./src/policies so they are available in the same process
async function preIngestPolicies(agent: HRAgent) {
  const policiesDir = path.join(__dirname, '..', 'policies');
  if (!fs.existsSync(policiesDir)) return;

  const entries = fs.readdirSync(policiesDir);
  for (const fileName of entries) {
    const fullPath = path.join(policiesDir, fileName);
    if (!fs.statSync(fullPath).isFile()) continue;
    try {
      const buffer = fs.readFileSync(fullPath);
      const file = new File([buffer], fileName);
      await agent.ingestDocument(file);
      console.log(`[ingest] Added ${fileName}`);
    } catch (err) {
      console.warn(`[ingest] Failed ${fileName}:`, err instanceof Error ? err.message : err);
    }
  }
}

async function main() {
  // Build user context interactively first
  const userContext = await buildUserContext();

  const agent = new HRAgent();

  // Ingest policies synchronously before opening prompt
  await preIngestPolicies(agent);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'You 👉 ' ,
  });

  console.log('\nType your questions below. Type "exit" to quit.');
  rl.prompt();

  rl.on('line', async (line) => {
    const query = line.trim();
    if (!query) {
      rl.prompt();
      return;
    }
    if (['exit', 'quit', 'q'].includes(query.toLowerCase())) {
      rl.close();
      return;
    }
    try {
      const response = await agent.processQuery(query, userContext);
      console.log(`\n🤖 ${response.content}\n`);
    } catch (err) {
      console.error('Error:', err instanceof Error ? err.message : err);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n👋 Bye!');
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
} 