# Portfolio Sync Agent

AI-powered portfolio sync tool that automatically syncs your GitHub projects to LinkedIn, Twitter, and your portfolio website.

## Features

- 🤖 AI Agent (Claude) that decides what to share and how to frame it
- 📊 Dashboard to monitor sync activity
- 📁 Project management interface
- 🔗 GitHub API integration
- 📝 LinkedIn & Twitter mock integrations (ready for real API keys)
- 🗄️ SQLite database for state management
- ⚙️ Configurable autonomy levels

## Tech Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- better-sqlite3
- Anthropic Claude SDK
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
# Edit .env.local with your API keys
```

Required:
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com
- `GITHUB_TOKEN` - Get from https://github.com/settings/tokens
- `GITHUB_USERNAME` - Your GitHub username

Optional (for full integrations):
- `LINKEDIN_ACCESS_TOKEN`
- `TWITTER_API_KEY` / `TWITTER_API_SECRET`

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

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
    db.ts           # SQLite database
    github-helper.ts # GitHub API
    claude-agent.ts # AI agent
    sync-manager.ts # Sync orchestration
    tool-executor.ts # Tool execution
    agent-prompt.ts # System prompts
  types/            # TypeScript types
```

## License

MIT
