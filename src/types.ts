export type LeadTemperature = 'Cold' | 'Warm' | 'Hot';
export type DealStage = 'Prospect' | 'Qualified' | 'Demo' | 'Proposal' | 'Negotiation';

export interface LeadProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  companySize: string;
  region: string;
  email: string;
  phone: string;
  source: string;
  painPoints: string;
  budget: number;
  urgency: number;
  decisionPower: number;
  engagement: number;
  notes: string;
}

export interface LeadAnalysis {
  score: number;
  temperature: LeadTemperature;
  fitSummary: string;
  buyingSignals: string[];
  risks: string[];
  recommendedNextStep: string;
  crmSummary: string;
}

export interface OutreachSequence {
  subject: string;
  email: string;
  linkedin: string;
  sms: string;
  callScript: string;
  objections: string[];
}

export interface Deal {
  id: string;
  account: string;
  owner: string;
  value: number;
  stage: DealStage;
  probability: number;
  nextStep: string;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'note' | 'email' | 'call' | 'meeting' | 'task';
  title: string;
  body: string;
  dueAt: string;
  completed: boolean;
  createdAt: string;
}

export interface AgentResponse {
  analysis: LeadAnalysis;
  outreach: OutreachSequence;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentSettings {
  backendUrl: string;
}

export interface WorkspaceData {
  leads: LeadProfile[];
  deals: Deal[];
  activities: Activity[];
}
