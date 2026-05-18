# Agora AI Sales Agent

A fully functional next-generation AI sales agent for lead qualification, outreach generation, objection handling, pipeline visibility, and sales coaching.

Live GitHub Pages URL:

https://ahastig.github.io/Sales-Agent-for-Agora-Hackathon-Philippines-2026-Build-Next-Gen-AI-Sales-Agent/

## What is included

- React + TypeScript sales cockpit built with Vite
- Lead scoring engine with buying signals, risks, CRM summary, and next-best action
- Multi-channel outreach generator for email, LinkedIn, SMS, and calls
- Sales copilot chat for coaching, objection handling, and next-step guidance
- Pipeline board with weighted revenue metrics
- Browser persistence through localStorage
- Express backend API for real deployments
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

By default, the backend uses the deterministic local sales agent engine. To connect live AI, set:

```bash
OPENAI_API_KEY=your-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

Then paste the backend URL into the app's "Connect backend" panel.

## Build

```bash
npm run build
```

The static site is generated in `dist/` and can be hosted by GitHub Pages.

## Deployment

The repository includes `.github/workflows/deploy.yml`, which builds and deploys the static frontend to GitHub Pages on pushes to `main` and the feature branch used for this implementation. The frontend works on GitHub Pages without a server by using the local AI engine; the backend can be deployed separately to any Node-compatible host.

If this is the repository's first Pages deployment, enable GitHub Pages once in repository settings:

1. Open **Settings > Pages**.
2. Set **Build and deployment > Source** to **GitHub Actions**.
3. Re-run the `Deploy to GitHub Pages` workflow.

After that one-time setting, deployments publish to the live URL above.
