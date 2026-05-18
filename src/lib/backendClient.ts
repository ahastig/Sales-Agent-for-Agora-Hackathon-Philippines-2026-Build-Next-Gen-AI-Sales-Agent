import type { Activity, AgentResponse, ChatMessage, Deal, LeadProfile, WorkspaceData } from '../types';

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

async function requestJson<T>(backendUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
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

export function requestWorkspace(backendUrl: string) {
  return requestJson<WorkspaceData>(backendUrl, '/api/workspace');
}

export function saveLeadToBackend(backendUrl: string, lead: LeadProfile) {
  return requestJson<LeadProfile>(backendUrl, `/api/leads/${lead.id}`, {
    method: 'PUT',
    body: JSON.stringify(lead),
  });
}

export function saveDealToBackend(backendUrl: string, deal: Deal) {
  return requestJson<Deal>(backendUrl, `/api/deals/${deal.id}`, {
    method: 'PUT',
    body: JSON.stringify(deal),
  });
}

export function saveActivityToBackend(backendUrl: string, activity: Activity) {
  return requestJson<Activity>(backendUrl, `/api/activities/${activity.id}`, {
    method: 'PUT',
    body: JSON.stringify(activity),
  });
}
