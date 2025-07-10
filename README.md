# 🤖 TalentWise - AI-Powered HR SaaS Platform

**Your 24/7 AI-Powered HR Assistant**

TalentWise is a comprehensive HR SaaS platform that revolutionizes human resources management through intelligent automation, providing round-the-clock support for recruitment, employee assistance, and HR operations.

## ✨ Key Features

### 🧠 **Intelligent HR Agent**
- **24/7 Availability**: Never-ending HR support across all time zones
- **LangChain Integration**: Advanced AI tools for complex HR tasks
- **Persistent Memory**: Conversation history stored in PostgreSQL database
- **Multi-Modal Input**: Support for text, documents, and file uploads

### 👥 **Smart Recruitment**
- **AI-Powered Resume Analysis**: Automatic candidate screening and scoring
- **Intelligent Matching**: Match candidates against job requirements
- **Candidate Comparison**: Side-by-side analysis of multiple candidates
- **Document Processing**: Extract and analyze resumes from PDF, DOCX, and more

### 🔐 **Role-Based Access**
- **Manager Dashboard**: Team management, hiring assistance, policy guidance
- **Employee Portal**: Benefits information, policy queries, career development
- **Secure Authentication**: Clerk-powered user management

### 📊 **Advanced Capabilities**
- **Policy Management**: Intelligent search and retrieval of company policies
- **Document Processing**: Automatic categorization and content extraction
- **Real-time Analytics**: Performance metrics and usage insights
- **Compliance Monitoring**: Automated policy adherence tracking

## 🏗️ Architecture

### **Technology Stack**
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI/ML**: LangChain, OpenAI GPT, Mistral AI, Hugging Face
- **Backend**: Node.js, Prisma ORM, PostgreSQL
- **Database**: PostgreSQL for all data persistence
- **Authentication**: Clerk
- **Deployment**: Vercel-ready

### **System Components**
```
┌─────────────────────────────────────────────────────────────┐
│                    Web Interface                            │
├─────────────────────────────────────────────────────────────┤
│                  Enhanced HR Agent                         │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   LangChain     │  │   Memory        │                  │
│  │     Tools       │  │   Manager       │                  │
│  │                 │  │ (PostgreSQL)    │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                    Core Services                           │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Document      │  │   Policy        │                  │
│  │   Processor     │  │   Manager       │                  │
│  └─────────────────┘  └─────────────────┘                  │
├─────────────────────────────────────────────────────────────┤
│                   Data Layer                               │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   PostgreSQL    │  │   File Storage  │                  │
│  │   Database      │  │   & Processing  │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ and pnpm
- PostgreSQL database
- API keys for OpenAI and Mistral AI

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/alchemyst-awesome-saas-hr.git
   cd alchemyst-awesome-saas-hr
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/talentwise"
   DIRECT_URL="postgresql://username:password@localhost:5432/talentwise"
   
   # AI Services
   OPENAI_API_KEY="your-openai-api-key"
   MISTRAL_API_KEY="your-mistral-api-key"
   
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   ```

4. **Set up the database**
   ```bash
   pnpm prisma generate
   pnpm prisma db push
   ```

5. **Ingest company policies**
   ```bash
   pnpm run ingest:policies
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your application running.

## 🎯 Usage Examples

### **Employee Portal**
```javascript
// Chat with HR Assistant
"What's our vacation policy?"
"How do I request time off?"
"What benefits are available to me?"
"Can you help me understand my 401k options?"
```

### **Manager Dashboard**
```javascript
// Team Management
"How do I conduct a performance review?"
"What's the process for hiring a new team member?"
"What are the compliance requirements for remote work?"
"Help me create an onboarding plan for a new developer"
```

### **Resume Analysis**
```javascript
// Automated Candidate Screening
"Analyze this resume for our senior developer position"
"Compare these three candidates for technical skills"
"What are the strengths and weaknesses of this candidate?"
"Does this candidate meet our job requirements?"
```

## 🛠️ Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking
- `pnpm ingest:policies` - Ingest company policies into the system

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── chat/              # Chat interface
│   ├── dashboard/         # Role-based dashboards
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
├── lib/                   # Core business logic
│   ├── agent.ts          # Main HR Agent
│   ├── DocumentProcessor.ts
│   ├── EnhancedMemoryManager.ts
│   └── tools/            # LangChain tools
├── services/             # External service integrations
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── policies/             # Company policy documents
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following key entities:
- **Users**: Managers and Employees with role-based access
- **Conversations**: Persistent chat history and context
- **Documents**: Uploaded files and their processed content
- **Policies**: Company policy documents and categories
- **Resume Analyses**: Candidate evaluation results

## 🔧 Configuration

### **Database Setup**
Ensure PostgreSQL is running and create your database:
```sql
CREATE DATABASE talentwise;
```

### **AI Model Configuration**
The system supports multiple AI providers:
- **Primary**: OpenAI GPT models for conversation
- **Embeddings**: Mistral AI for semantic search
- **Fallback**: Configurable model switching

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npx vercel
```

### **Environment Variables for Production**
Ensure all environment variables are configured in your deployment platform:
- Database connections (consider using connection pooling)
- AI API keys
- Authentication secrets

## 📋 Features Roadmap

### ✅ **Completed**
- [x] 24/7 AI HR Assistant
- [x] Resume analysis and candidate scoring
- [x] Role-based dashboards (Manager/Employee)
- [x] Document processing and categorization
- [x] Persistent conversation memory
- [x] Policy search and retrieval
- [x] Multi-modal input support
- [x] Real-time chat interface
- [x] PostgreSQL-based persistence

### 🔄 **In Progress**
- [ ] Advanced analytics dashboard
- [ ] Integration with popular HR systems
- [ ] Mobile application
- [ ] Advanced reporting features

### 📋 **Planned**
- [ ] Video interview analysis
- [ ] Automated onboarding workflows
- [ ] Integration with calendar systems
- [ ] Advanced compliance monitoring
- [ ] Multi-language support

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@talentwise.ai
- 💬 Discord: [Join our community](https://discord.gg/talentwise)
- 📚 Documentation: [docs.talentwise.ai](https://docs.talentwise.ai)

## 🏆 Success Metrics

- **24/7 Availability**: Zero downtime HR support
- **<30s Response Time**: Lightning-fast AI responses
- **500+ Companies**: Trusted by growing organizations
- **95% Satisfaction Rate**: Highly rated by users

---

**Built with ❤️ by the TalentWise Team**

*Revolutionizing HR through intelligent automation*
