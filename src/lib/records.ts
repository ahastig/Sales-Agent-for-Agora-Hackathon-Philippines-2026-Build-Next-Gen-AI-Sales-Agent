import type { LeadProfile } from '../types';

export function createEmptyLead(): LeadProfile {
  return {
    id: crypto.randomUUID(),
    name: '',
    title: '',
    company: '',
    industry: '',
    companySize: '',
    region: '',
    email: '',
    phone: '',
    source: '',
    painPoints: '',
    budget: 0,
    urgency: 1,
    decisionPower: 1,
    engagement: 1,
    notes: '',
  };
}

export function hasLeadData(lead: LeadProfile) {
  return Boolean(lead.name.trim() || lead.company.trim() || lead.email.trim() || lead.phone.trim());
}

export function hasEnoughDataForAgent(lead: LeadProfile) {
  return Boolean(lead.name.trim() && lead.company.trim() && lead.painPoints.trim());
}
