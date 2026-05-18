import type { AgentResponse, ChatMessage, LeadAnalysis, LeadProfile, OutreachSequence } from '../types';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function analyzeLead(lead: LeadProfile): LeadAnalysis {
  const painStrength = Math.min(100, lead.painPoints.length * 1.8 + lead.notes.length * 0.4);
  const budgetScore = Math.min(100, lead.budget / 1000);
  const authorityScore = lead.decisionPower * 10;
  const urgencyScore = lead.urgency * 10;
  const engagementScore = lead.engagement * 10;
  const score = Math.round(
    budgetScore * 0.18 +
      authorityScore * 0.24 +
      urgencyScore * 0.22 +
      engagementScore * 0.2 +
      painStrength * 0.16,
  );

  const temperature = score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold';
  const buyingSignals = [
    `${lead.company} is actively discussing ${lead.painPoints.toLowerCase() || 'sales growth priorities'}.`,
    `${lead.title} involvement suggests ${lead.decisionPower >= 7 ? 'strong' : 'moderate'} buying authority.`,
    `${money.format(lead.budget)} budget indicates ${
      lead.budget >= 50000 ? 'enterprise' : lead.budget >= 15000 ? 'mid-market' : 'pilot-stage'
    } buying capacity.`,
  ];

  const risks = [
    lead.engagement < 6 ? 'Engagement is still developing; lead needs more education before a hard pitch.' : '',
    lead.decisionPower < 6 ? 'Decision-maker access is incomplete; map the buying committee early.' : '',
    lead.urgency < 6 ? 'Timeline pressure is low; create a cost-of-delay business case.' : '',
  ].filter(Boolean);

  return {
    score,
    temperature,
    fitSummary: `${lead.company} is a ${temperature.toLowerCase()} ${lead.industry} opportunity in ${lead.region}. Focus the conversation on measurable revenue impact, faster qualification, and the specific pain around ${lead.painPoints.toLowerCase()}.`,
    buyingSignals,
    risks: risks.length ? risks : ['No critical blockers detected. Confirm timeline, procurement path, and success criteria.'],
    recommendedNextStep:
      temperature === 'Hot'
        ? `Book a 30-minute value mapping call with ${lead.name} and ask for the economic buyer.`
        : temperature === 'Warm'
          ? `Send a tailored proof-of-value email, then schedule discovery within this buying cycle.`
          : `Start with an insight-led nurture sequence and invite ${lead.name} to a short diagnostic call.`,
    crmSummary: `${lead.name}, ${lead.title} at ${lead.company}, is a ${temperature.toLowerCase()} lead scored ${score}/100. Main pain: ${lead.painPoints}. Budget: ${money.format(
      lead.budget,
    )}. Next action: align on urgency, stakeholders, and success metric.`,
  };
}

export function generateOutreach(lead: LeadProfile, analysis = analyzeLead(lead)): OutreachSequence {
  const outcome = lead.industry.toLowerCase().includes('retail')
    ? 'increase conversion from every customer conversation'
    : lead.industry.toLowerCase().includes('finance')
      ? 'shorten compliant sales cycles'
      : 'turn more qualified conversations into booked revenue';

  const subject = `${lead.company} x AI sales lift: ${analysis.score}/100 opportunity`;
  const email = `Hi ${lead.name},

I noticed ${lead.company} is focused on ${lead.painPoints.toLowerCase()}. Teams with similar priorities are using AI sales agents to qualify leads instantly, draft personalized follow-ups, and surface next-best actions before opportunities stall.

Based on the signals I see, there may be a near-term path to ${outcome} without adding manual admin work for your team.

Would it be useful to compare your current funnel with a lightweight AI-assisted workflow this week?

Best,
Your AI Sales Agent`;

  return {
    subject,
    email,
    linkedin: `Hi ${lead.name} - saw your work at ${lead.company}. I built a quick AI sales workflow around ${lead.painPoints.toLowerCase()} and think it could help your team ${outcome}. Open to a short exchange?`,
    sms: `Hi ${lead.name}, quick idea for ${lead.company}: an AI sales agent could help with ${lead.painPoints.toLowerCase()}. Worth a 15-min look?`,
    callScript: `Open with the trigger: "${lead.name}, I saw ${lead.company} is dealing with ${lead.painPoints.toLowerCase()}." Ask: "What part of the revenue workflow creates the most delay today?" Quantify the impact, confirm stakeholders, then propose ${analysis.recommendedNextStep.toLowerCase()}`,
    objections: [
      'If they say "we already have a CRM": position the agent as the action layer that keeps CRM data fresh and recommends follow-up.',
      'If they say "AI quality is risky": offer a human-in-the-loop approval path for all outbound messages.',
      'If they say "no budget": connect the pilot to one measurable metric such as booked meetings, response rate, or cycle time.',
    ],
  };
}

export function buildAgentResponse(lead: LeadProfile): AgentResponse {
  const analysis = analyzeLead(lead);
  return {
    analysis,
    outreach: generateOutreach(lead, analysis),
  };
}

export function answerSalesQuestion(question: string, lead: LeadProfile, history: ChatMessage[] = []): string {
  const analysis = analyzeLead(lead);
  const lowerQuestion = question.toLowerCase();
  const contextHint = history.length > 1 ? 'Building on the current thread, ' : '';

  if (lowerQuestion.includes('objection')) {
    return `${contextHint}lead with the strongest value hypothesis: "${lead.painPoints}". Acknowledge the objection, quantify the current cost, and offer a low-risk pilot. For ${lead.company}, I would say: "That makes sense. If we can prove one metric improves before a wider rollout, would that be enough to keep the evaluation open?"`;
  }

  if (lowerQuestion.includes('email') || lowerQuestion.includes('message')) {
    return generateOutreach(lead, analysis).email;
  }

  if (lowerQuestion.includes('score') || lowerQuestion.includes('priority')) {
    return `${lead.name} is scored ${analysis.score}/100 and should be treated as ${analysis.temperature.toLowerCase()}. The strongest signals are urgency ${lead.urgency}/10, authority ${lead.decisionPower}/10, engagement ${lead.engagement}/10, and budget ${money.format(
      lead.budget,
    )}.`;
  }

  if (lowerQuestion.includes('next')) {
    return analysis.recommendedNextStep;
  }

  return `${contextHint}for ${lead.company}, lead with a business case around ${lead.painPoints.toLowerCase()}. Recommended move: ${
    analysis.recommendedNextStep
  } Use the CRM note: ${analysis.crmSummary}`;
}
