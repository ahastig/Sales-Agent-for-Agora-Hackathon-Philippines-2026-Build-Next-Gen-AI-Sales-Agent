import type { Deal, LeadProfile } from '../types';

export const defaultLead: LeadProfile = {
  id: 'lead-001',
  name: 'Mika Reyes',
  title: 'VP of Growth',
  company: 'Luzon Retail Cloud',
  industry: 'Retail technology',
  companySize: '250-500 employees',
  region: 'Philippines',
  email: 'mika.reyes@example.com',
  phone: '+63 917 555 0188',
  source: 'Agora hackathon inbound',
  painPoints: 'slow follow-up, inconsistent lead qualification, and missed upsell timing',
  budget: 65000,
  urgency: 8,
  decisionPower: 8,
  engagement: 7,
  notes:
    'Downloaded the AI revenue operations guide, opened three emails, and asked about integration with existing CRM and messaging workflows.',
};

export const sampleDeals: Deal[] = [
  {
    id: 'deal-001',
    account: 'Luzon Retail Cloud',
    owner: 'AI Agent',
    value: 65000,
    stage: 'Demo',
    probability: 72,
    nextStep: 'Run value mapping demo with growth and operations leaders',
  },
  {
    id: 'deal-002',
    account: 'Manila FinServe',
    owner: 'AI Agent',
    value: 118000,
    stage: 'Proposal',
    probability: 64,
    nextStep: 'Send compliance-safe outbound workflow proposal',
  },
  {
    id: 'deal-003',
    account: 'Cebu Logistics Hub',
    owner: 'AI Agent',
    value: 42000,
    stage: 'Qualified',
    probability: 51,
    nextStep: 'Confirm CRM integration requirements',
  },
  {
    id: 'deal-004',
    account: 'Davao Health Group',
    owner: 'AI Agent',
    value: 79000,
    stage: 'Negotiation',
    probability: 81,
    nextStep: 'Align pilot success metrics with CFO',
  },
];
