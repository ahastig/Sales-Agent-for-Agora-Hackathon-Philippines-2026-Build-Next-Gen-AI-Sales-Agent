import type { AgentSettings, LeadProfile } from '../types';
import { defaultLead } from './sampleData';

const leadKey = 'agora-ai-sales-agent:lead';
const settingsKey = 'agora-ai-sales-agent:settings';

export const defaultSettings: AgentSettings = {
  backendUrl: '',
};

export function loadLead(): LeadProfile {
  const raw = window.localStorage.getItem(leadKey);
  if (!raw) {
    return defaultLead;
  }

  try {
    return { ...defaultLead, ...JSON.parse(raw) };
  } catch {
    return defaultLead;
  }
}

export function saveLead(lead: LeadProfile) {
  window.localStorage.setItem(leadKey, JSON.stringify(lead));
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
