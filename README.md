# Agora AI Sales Agent

A next-generation AI sales agent for lead qualification, outreach generation, objection handling, pipeline visibility, and sales coaching.

The application does **not** include fabricated customers, sample companies, fake pipeline revenue, or seeded demo records. It starts empty and only works from data entered by the user or loaded from the connected backend database.

Live GitHub Pages URL:

https://ahastig.github.io/Sales-Agent-for-Agora-Hackathon-Philippines-2026-Build-Next-Gen-AI-Sales-Agent/

## What is included

- React + TypeScript sales cockpit built with Vite
- Lead scoring engine with buying signals, risks, CRM summary, and next-best action
- Multi-channel outreach generator for email, LinkedIn, SMS, and calls
- Sales copilot chat for coaching, objection handling, and next-step guidance
- Pipeline board with weighted revenue metrics from saved deals only
- Browser draft persistence for local use
- Express backend API for real deployments
- PostgreSQL database for production deployments
- SQLite database for local development
- Optional OpenAI-compatible model integration through environment variables
- GitHub Actions workflow for GitHub Pages deployment

## Quick start

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Run the backend API

```bash
cp .env.example .env
npm run server:dev
```

The backend starts at `http://localhost:8787`.

By default, the backend creates a SQLite database at `data/sales-agent.sqlite`. For production, set `DATABASE_URL` to a PostgreSQL connection string from Neon, Supabase, Render, or another Postgres provider.

```bash
DATABASE_PATH=/absolute/path/to/sales-agent.sqlite
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Core API endpoints:

- `GET /api/workspace`
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`
- `GET /api/deals`
- `POST /api/deals`
- `PUT /api/deals/:id`
- `DELETE /api/deals/:id`
- `GET /api/activities`
- `POST /api/activities`
- `PUT /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/agent/run`
- `POST /api/agent/chat`

By default, the AI layer uses deterministic local reasoning based only on fields provided by the user. To connect live AI, set:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Then paste the backend URL into the app's Backend page and click **Load database**.

## Build

```bash
npm run build
```

The static site is generated in `dist/` and can be hosted by GitHub Pages.

For a project-page build with the correct asset base path:

```bash
npm run build:pages
```

## Deployment

The repository includes `.github/workflows/deploy.yml`, which builds and deploys the static frontend to GitHub Pages on pushes to `main` and the feature branch used for this implementation. The frontend works on GitHub Pages without a server by using the local AI engine; the backend can be deployed separately to any Node-compatible host.

Backend deployment config is included in `render.yaml`. See `DEPLOYMENT.md` for the Render + free PostgreSQL setup.

If this is the repository's first Pages deployment, enable GitHub Pages once in repository settings:

1. Open **Settings > Pages**.
2. Set **Build and deployment > Source** to **GitHub Actions**.
3. Re-run the `Deploy to GitHub Pages` workflow.

After that one-time setting, deployments publish to the live URL above.

For branch-based Pages, publish the already configured static build with:

```bash
npm run deploy:pages
```
