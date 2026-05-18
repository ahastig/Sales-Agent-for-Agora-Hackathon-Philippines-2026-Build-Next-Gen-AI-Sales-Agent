import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { chatWithAgent, runAgent } from './agent';
import {
  deleteActivity,
  deleteDeal,
  deleteLead,
  getStoreInfo,
  initializeDatabase,
  listActivities,
  listDeals,
  listLeads,
  upsertActivity,
  upsertDeal,
  upsertLead,
} from './db';

const app = express();
const port = Number(process.env.PORT ?? 8787);

const leadSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string(),
  title: z.string(),
  company: z.string(),
  industry: z.string(),
  companySize: z.string(),
  region: z.string(),
  email: z.string(),
  phone: z.string(),
  source: z.string(),
  painPoints: z.string(),
  budget: z.coerce.number().nonnegative(),
  urgency: z.coerce.number().min(1).max(10),
  decisionPower: z.coerce.number().min(1).max(10),
  engagement: z.coerce.number().min(1).max(10),
  notes: z.string(),
});

const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const dealSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  account: z.string(),
  owner: z.string(),
  value: z.coerce.number().nonnegative(),
  stage: z.enum(['Prospect', 'Qualified', 'Demo', 'Proposal', 'Negotiation']),
  probability: z.coerce.number().min(0).max(100),
  nextStep: z.string(),
});

const activitySchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  leadId: z.string(),
  type: z.enum(['note', 'email', 'call', 'meeting', 'task']),
  title: z.string(),
  body: z.string(),
  dueAt: z.string().default(''),
  completed: z.boolean().default(false),
  createdAt: z.string().default(() => new Date().toISOString()),
});

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  const store = getStoreInfo();
  response.json({
    ok: true,
    mode: process.env.OPENAI_API_KEY ? 'openai-compatible' : 'local-fallback',
    database: store.database,
    store: store.mode,
  });
});

app.get('/api/workspace', async (_request, response, next) => {
  try {
    response.json({
      leads: await listLeads(),
      deals: await listDeals(),
      activities: await listActivities(),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/leads', async (_request, response, next) => {
  try {
    response.json(await listLeads());
  } catch (error) {
    next(error);
  }
});

app.post('/api/leads', async (request, response, next) => {
  try {
    response.status(201).json(await upsertLead(leadSchema.parse(request.body)));
  } catch (error) {
    next(error);
  }
});

app.put('/api/leads/:id', async (request, response, next) => {
  try {
    response.json(await upsertLead(leadSchema.parse({ ...request.body, id: request.params.id })));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/leads/:id', async (request, response, next) => {
  try {
    await deleteLead(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/deals', async (_request, response, next) => {
  try {
    response.json(await listDeals());
  } catch (error) {
    next(error);
  }
});

app.post('/api/deals', async (request, response, next) => {
  try {
    response.status(201).json(await upsertDeal(dealSchema.parse(request.body)));
  } catch (error) {
    next(error);
  }
});

app.put('/api/deals/:id', async (request, response, next) => {
  try {
    response.json(await upsertDeal(dealSchema.parse({ ...request.body, id: request.params.id })));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/deals/:id', async (request, response, next) => {
  try {
    await deleteDeal(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get('/api/activities', async (_request, response, next) => {
  try {
    response.json(await listActivities());
  } catch (error) {
    next(error);
  }
});

app.post('/api/activities', async (request, response, next) => {
  try {
    response.status(201).json(await upsertActivity(activitySchema.parse(request.body)));
  } catch (error) {
    next(error);
  }
});

app.put('/api/activities/:id', async (request, response, next) => {
  try {
    response.json(await upsertActivity(activitySchema.parse({ ...request.body, id: request.params.id })));
  } catch (error) {
    next(error);
  }
});

app.delete('/api/activities/:id', async (request, response, next) => {
  try {
    await deleteActivity(request.params.id);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.post('/api/agent/run', async (request, response, next) => {
  try {
    const body = z.object({ lead: leadSchema }).parse(request.body);
    response.json(await runAgent(body.lead));
  } catch (error) {
    next(error);
  }
});

app.post('/api/agent/chat', async (request, response, next) => {
  try {
    const body = z
      .object({
        question: z.string().min(1),
        lead: leadSchema,
        history: z.array(chatMessageSchema).default([]),
      })
      .parse(request.body);
    response.json({ answer: await chatWithAgent(body.question, body.lead, body.history) });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof z.ZodError) {
    response.status(400).json({ error: 'Invalid request payload', issues: error.issues });
    return;
  }

  response.status(500).json({
    error: error instanceof Error ? error.message : 'Unexpected server error',
  });
});

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      const store = getStoreInfo();
      console.log(`Agora AI Sales Agent API listening on http://localhost:${port} using ${store.mode}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });
