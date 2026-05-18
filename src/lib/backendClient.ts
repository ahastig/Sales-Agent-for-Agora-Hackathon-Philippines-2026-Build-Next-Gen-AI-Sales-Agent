import type { AgentResponse, ChatMessage, LeadProfile } from '../types';

interface ChatPayload {
  question: string;
  lead: LeadProfile;
  history: ChatMessage[];
}

async function postJson<T>(backendUrl: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Backend request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function requestAgentResponse(backendUrl: string, lead: LeadProfile) {
  return postJson<AgentResponse>(backendUrl, '/api/agent/run', { lead });
}

export function requestChatAnswer(backendUrl: string, payload: ChatPayload) {
  return postJson<{ answer: string }>(backendUrl, '/api/agent/chat', payload);
}
