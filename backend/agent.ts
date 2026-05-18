import { answerSalesQuestion, buildAgentResponse } from '../src/lib/aiEngine';
import type { AgentResponse, ChatMessage, LeadProfile } from '../src/types';

const baseUrl = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

function systemPrompt() {
  return `You are Agora AI Sales Agent, a concise expert sales assistant. Return practical sales guidance only. Avoid inventing customer facts.`;
}

async function callOpenAi(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible request failed with ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  return data.choices?.[0]?.message?.content?.trim() ?? null;
}

export async function runAgent(lead: LeadProfile): Promise<AgentResponse> {
  const localResponse = buildAgentResponse(lead);
  const content = await callOpenAi([
    { role: 'system', content: `${systemPrompt()} Return valid JSON matching the provided structure.` },
    {
      role: 'user',
      content: `Analyze this lead and improve the existing recommendation. Lead: ${JSON.stringify(
        lead,
      )}. Draft response JSON shape: ${JSON.stringify(localResponse)}`,
    },
  ]);

  if (!content) {
    return localResponse;
  }

  try {
    const parsed = JSON.parse(content) as AgentResponse;
    return {
      analysis: { ...localResponse.analysis, ...parsed.analysis },
      outreach: { ...localResponse.outreach, ...parsed.outreach },
    };
  } catch {
    return {
      ...localResponse,
      analysis: {
        ...localResponse.analysis,
        fitSummary: content,
      },
    };
  }
}

export async function chatWithAgent(question: string, lead: LeadProfile, history: ChatMessage[]) {
  const localAnswer = answerSalesQuestion(question, lead, history);
  const content = await callOpenAi([
    { role: 'system', content: systemPrompt() },
    {
      role: 'user',
      content: `Lead context: ${JSON.stringify(lead)}. Prior chat: ${JSON.stringify(
        history.slice(-8),
      )}. User question: ${question}`,
    },
  ]);

  return content ?? localAnswer;
}
