# Production Deployment

GitHub Pages can host only the static frontend. The backend in this repository must be deployed to a Node-compatible host.

## Recommended free stack

- Frontend: GitHub Pages
- Backend API: Render free web service
- Database: Neon free PostgreSQL or Supabase free PostgreSQL

The backend supports:

- PostgreSQL when `DATABASE_URL` is set
- SQLite for local development when `DATABASE_URL` is not set

## Deploy backend on Render

1. Create a free PostgreSQL database on Neon or Supabase.
2. Copy its pooled PostgreSQL connection string.
3. In Render, create a new **Blueprint** or **Web Service** from this GitHub repository.
4. Render will read `render.yaml`.
5. Set these environment variables in Render:

```bash
DATABASE_URL=your-postgres-connection-string
DATABASE_SSL=true
CORS_ORIGIN=https://ahastig.github.io
OPENAI_API_KEY=optional-openai-compatible-key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```

6. Deploy the service.
7. Open `https://your-render-service.onrender.com/api/health`.
8. Copy `https://your-render-service.onrender.com`.
9. Open the frontend Backend page and paste that URL.
10. Click **Load database**.

## Local backend

```bash
cp .env.example .env
npm run server:dev
```

Local health check:

```bash
curl http://localhost:8787/api/health
```

## Important

This repository does not include real customer data. The app starts empty. Records are created only from user input or API calls.
