import type { AgentSettings, Deal, LeadProfile } from '../types';
import { createEmptyLead } from './records';

const leadKey = 'agora-ai-sales-agent:lead';
const dealsKey = 'agora-ai-sales-agent:deals';
const settingsKey = 'agora-ai-sales-agent:settings';

export const defaultSettings: AgentSettings = {
  backendUrl: '',
};

export function loadLead(): LeadProfile {
  const raw = window.localStorage.getItem(leadKey);
  if (!raw) {
    return createEmptyLead();
  }

  try {
    return { ...createEmptyLead(), ...JSON.parse(raw) };
  } catch {
    return createEmptyLead();
  }
}

export function saveLead(lead: LeadProfile) {
  window.localStorage.setItem(leadKey, JSON.stringify(lead));
}

export function loadDeals(): Deal[] {
  const raw = window.localStorage.getItem(dealsKey);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Deal[];
  } catch {
    return [];
  }
}

export function saveDeals(deals: Deal[]) {
  window.localStorage.setItem(dealsKey, JSON.stringify(deals));
}

export function loadSettings(): AgentSettings {
  const raw = window.localStorage.getItem(settingsKey);
  if (!raw) {
    return defaultSettings;
  }

  try {
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AgentSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}
