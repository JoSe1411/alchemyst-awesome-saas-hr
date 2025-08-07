# Aura HR Assistant

This is Aura, an AI-powered assistant designed to help HR teams and hiring managers streamline their daily tasks. It provides tools for generating job descriptions, creating interview question kits, and searching through company policy documents. Built with Next.js and integrated with various AI services, Aura is currently at an MVP stage with a clear roadmap for additional features.

## Core Features
- **AI-Powered Chat**: An interactive chat interface for general HR inquiries, powered by Google Gemini with a local LLM fallback for development.
- **Job Description Generator**: A form-based tool that produces well-structured, professional job descriptions in markdown format.
- **Interview Question Generator**: Creates sets of behavioral interview questions based on provided role context.
- **Policy Document Search**: Allows for uploading and performing semantic search on internal company policies (PDF, TXT), with content chunked and stored in a pgvector database.
- **Authentication**: User management via Clerk, with distinct roles for Managers and Employees.
- **Rate Limiting**: API endpoints are protected by an Upstash Redis-based rate limiter, with a clear UI banner to inform users of limits.
- **Demo Mode**: Non-registered users can try out the generators with a limited number of uses before being prompted to sign up.

## Planned Features
The following features are on the immediate roadmap to evolve Aura from a demo into a more robust, deployable application:

1.  **Data Persistence**:
    - Save all user-generated content, including conversations, job descriptions, and interview kits, to a Prisma-managed database.
2.  **User Dashboards**:
    - **Manager Dashboard**: A central place to view, edit, and manage all saved job descriptions and interview kits.
    - **Employee Dashboard**: A view for employees to see assigned onboarding tasks and access the policy search tool.
3.  **Enhanced Policy Management**:
    - A user-friendly interface for managers to upload and manage policy documents.
    - Improved search results with highlighted text snippets.
4.  **Improved UX and Polish**:
    - **Edit & Re-generate**: Allow users to load a saved job description back into the form for modifications.
    - **Export Options**: Add functionality to download generated content as either Markdown or PDF files.
    - **Dark Mode**: A simple UI toggle for theme preference, persisted in `localStorage`.
5.  **Robustness and Testing**:
    - **Accessibility**: Conduct a full audit and implement ARIA labels and other a11y improvements.
    - **Unit/Integration Tests**: Add a basic test suite using Jest and React Testing Library for critical UI components.
6.  **Advanced Functionality**:
    - **Role-Based Permissions**: Implement server-side logic to allow managers to assign tasks and employees to update their status.
    - **Email Integration**: Add a feature to email generated documents directly to team members via an email service like SendGrid.
    - **Admin Analytics**: A simple dashboard to track key metrics like content generation counts and API latencies.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- Node.js (v18 or newer)
- pnpm (or npm/yarn)
- Docker (for PostgreSQL)

### Installation
1.  Clone the repo
    ```sh
    git clone https://github.com/your-username/aura-hr-assistant.git
    ```
2.  Install NPM packages
    ```sh
    pnpm install
    ```
3.  Set up environment variables by copying the example file.
    ```sh
    cp .env.example .env
    ```
    You'll need to add your own keys for:
    - `DATABASE_URL` (and `DIRECT_URL`) for PostgreSQL
    - Clerk (Publishable, Secret Key)
    - Google Gemini API Key
    - Upstash Redis (URL, Token)

4.  Run the database migrations.
    ```sh
    pnpm prisma db push
    ```
5.  Start the development server.
    ```sh
    pnpm dev
    ```

The application will be available at `http://localhost:3000`.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with pgvector for embeddings
- **ORM**: Prisma
- **Authentication**: Clerk
- **AI**: LangChain.js with Google Gemini & local Ollama fallback
- **Rate Limiting**: Upstash Redis
- **Styling**: Tailwind CSS with Lucide for icons
- **State Management**: Zustand