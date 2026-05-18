import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { chatWithAgent, runAgent } from './agent';

const app = express();
const port = Number(process.env.PORT ?? 8787);

const leadSchema = z.object({
  id: z.string(),
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

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    mode: process.env.OPENAI_API_KEY ? 'openai-compatible' : 'local-fallback',
  });
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

app.listen(port, () => {
  console.log(`Agora AI Sales Agent API listening on http://localhost:${port}`);
});
