# Portfolio Sync Agent

AI-powered portfolio sync tool that automatically syncs your GitHub projects to LinkedIn, Twitter, and your portfolio website.

## Features

- 🤖 AI Agent (via OpenRouter) that decides what to share and how to frame it
- 📊 Dashboard to monitor sync activity
- 📁 Project management interface
- 🔗 GitHub integration (direct API or via Composio)
- 📝 LinkedIn & Twitter mock integrations (activate with Composio connected accounts)
- 🗄️ SQLite database with JSON file fallback
- ⚙️ Configurable autonomy levels

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- better-sqlite3 (with JSON fallback)
- OpenRouter (AI/LLM access)
- Composio (tool execution for GitHub, LinkedIn, Twitter)
- Axios

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Sanidhya14321/portfolio-sync.git
cd portfolio-sync
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

**Only 2 API keys are required:**

| Variable | How to Get |
|----------|-----------|
| `OPENROUTER_API_KEY` | Sign up at [openrouter.ai](https://openrouter.ai) → API Keys |
| `COMPOSIO_API_KEY` | Sign up at [composio.dev](https://composio.dev) → Dashboard → API Keys |

**Optional enhancements:**
- `GITHUB_TOKEN` — Get from [github.com/settings/tokens](https://github.com/settings/tokens) (for higher rate limits and private repos)
- `GITHUB_USERNAME` — Your GitHub username (for fetching your repos)

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** The app is designed for local use. No auth or login system is needed.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create a project |
| `/api/projects/[id]` | GET/PUT/DELETE | Manage a project |
| `/api/sync/run` | POST | Run daily sync |
| `/api/sync-logs` | GET | Get sync logs |
| `/api/settings` | GET/POST | Manage settings |

## Project Structure

```
src/
  app/              # Next.js App Router pages
    api/            # API routes
    page.tsx        # Dashboard
    projects/       # Project management
    settings/       # Settings page
  lib/              # Backend utilities
    db.ts           # SQLite + JSON fallback
    github-helper.ts # GitHub API (with mock fallback)
    claude-agent.ts # OpenRouter LLM client
    sync-manager.ts # Sync orchestration
    tool-executor.ts # Composio + mock tool execution
    composio-client.ts # Composio SDK client
    agent-prompt.ts # System prompts
  types/            # TypeScript types
```

## How It Works

1. **OpenRouter** provides AI/LLM access (Claude, GPT, etc.) with a single API key
2. **Composio** handles tool execution for GitHub, LinkedIn, Twitter (connect accounts in Composio dashboard)
3. If Composio tools aren't available, the app gracefully falls back to mock mode
4. If GitHub token isn't set, the app uses unauthenticated API or returns sample data

## License

MIT
