import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Copy,
  HelpCircle,
  Mail,
  MessageSquareText,
  PhoneCall,
  Play,
  Rocket,
  Save,
  Send,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { answerSalesQuestion, buildAgentResponse } from './lib/aiEngine';
import {
  requestAgentResponse,
  requestChatAnswer,
  requestWorkspace,
  saveDealToBackend,
  saveLeadToBackend,
} from './lib/backendClient';
import { hasEnoughDataForAgent, hasLeadData } from './lib/records';
import { loadDeals, loadLead, loadSettings, saveDeals, saveLead, saveSettings } from './lib/storage';
import type { Activity as SalesActivity, AgentResponse, ChatMessage, Deal, DealStage, LeadProfile } from './types';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const pipelineStages: DealStage[] = ['Prospect', 'Qualified', 'Demo', 'Proposal', 'Negotiation'];

type AppPage = 'home' | 'lead' | 'outreach' | 'copilot' | 'pipeline' | 'backend';

const pages: AppPage[] = ['home', 'lead', 'outreach', 'copilot', 'pipeline', 'backend'];

function createEmptyDeal(): Deal {
  return {
    id: crypto.randomUUID(),
    account: '',
    owner: '',
    value: 0,
    stage: 'Prospect',
    probability: 0,
    nextStep: '',
  };
}

function getPageFromHash(): AppPage {
  const hash = window.location.hash.replace(/^#\/?/, '') as AppPage;
  return pages.includes(hash) ? hash : 'home';
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  min,
  max,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field field-wide">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}

function App() {
  const [lead, setLead] = useState<LeadProfile>(() => loadLead());
  const [deals, setDeals] = useState<Deal[]>(() => loadDeals());
  const [activities, setActivities] = useState<SalesActivity[]>([]);
  const [dealDraft, setDealDraft] = useState<Deal>(() => createEmptyDeal());
  const [settings, setSettings] = useState(() => loadSettings());
  const [agentResponse, setAgentResponse] = useState<AgentResponse>(() => buildAgentResponse(lead));
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Add a real lead or connect the backend database. I will not invent customer details.',
    },
  ]);
  const [question, setQuestion] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('Local AI engine ready');
  const [showInstructions, setShowInstructions] = useState(true);

  const pipelineValue = useMemo(() => deals.reduce((sum, deal) => sum + deal.value, 0), [deals]);
  const weightedPipeline = useMemo(
    () => deals.reduce((sum, deal) => sum + deal.value * (deal.probability / 100), 0),
    [deals],
  );

  useEffect(() => {
    const syncPageWithHash = () => setActivePage(getPageFromHash());
    window.addEventListener('hashchange', syncPageWithHash);
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#/home');
    }
    return () => window.removeEventListener('hashchange', syncPageWithHash);
  }, []);

  function navigateTo(page: AppPage) {
    window.location.hash = `/${page}`;
    setActivePage(page);
  }

  function closeInstructions() {
    setShowInstructions(false);
  }

  function updateLead<K extends keyof LeadProfile>(key: K, value: LeadProfile[K]) {
    setLead((current) => ({ ...current, [key]: value }));
  }

  function updateDealDraft<K extends keyof Deal>(key: K, value: Deal[K]) {
    setDealDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveCurrentLead() {
    if (!hasLeadData(lead)) {
      setStatus('Nothing saved: enter real lead details first');
      return;
    }

    saveLead(lead);
    if (settings.backendUrl) {
      await saveLeadToBackend(settings.backendUrl, lead);
      setStatus('Lead saved to backend database');
      return;
    }

    setStatus('Lead saved in this browser. Connect backend for shared database persistence.');
  }

  async function loadBackendWorkspace() {
    if (!settings.backendUrl) {
      setStatus('Add a backend URL before loading database records');
      return;
    }

    const workspace = await requestWorkspace(settings.backendUrl);
    setDeals(workspace.deals);
    setActivities(workspace.activities);
    if (workspace.leads[0]) {
      setLead(workspace.leads[0]);
      saveLead(workspace.leads[0]);
      setAgentResponse(buildAgentResponse(workspace.leads[0]));
    }
    saveDeals(workspace.deals);
    setStatus(`Loaded ${workspace.leads.length} leads, ${workspace.deals.length} deals, and ${workspace.activities.length} activities`);
  }

  async function saveCurrentDeal() {
    if (!dealDraft.account.trim()) {
      setStatus('Deal not saved: account name is required');
      return;
    }

    const nextDeals = [dealDraft, ...deals.filter((deal) => deal.id !== dealDraft.id)];
    setDeals(nextDeals);
    saveDeals(nextDeals);
    if (settings.backendUrl) {
      await saveDealToBackend(settings.backendUrl, dealDraft);
      setStatus('Deal saved to backend database');
    } else {
      setStatus('Deal saved in this browser. Connect backend for shared database persistence.');
    }
    setDealDraft(createEmptyDeal());
  }

  async function runAgent() {
    if (!hasEnoughDataForAgent(lead)) {
      setAgentResponse(buildAgentResponse(lead));
      setStatus('Add a real lead name, company, and pain points before running the AI agent');
      return;
    }

    setIsRunning(true);
    setStatus(settings.backendUrl ? 'Calling backend AI agent...' : 'Running local AI agent...');

    try {
      const response = settings.backendUrl
        ? await requestAgentResponse(settings.backendUrl, lead)
        : buildAgentResponse(lead);
      setAgentResponse(response);
      saveLead(lead);
      setStatus(settings.backendUrl ? 'Backend AI response loaded' : 'Local AI response loaded');
    } catch (error) {
      const fallback = buildAgentResponse(lead);
      setAgentResponse(fallback);
      setStatus(
        `Backend unavailable, using local AI fallback: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    } finally {
      setIsRunning(false);
    }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedQuestion,
    };
    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setQuestion('');

    try {
      const answer = settings.backendUrl
        ? (await requestChatAnswer(settings.backendUrl, {
            question: trimmedQuestion,
            lead,
            history: nextMessages,
          })).answer
        : answerSalesQuestion(trimmedQuestion, lead, nextMessages);
      setChatMessages((messages) => [
        ...messages,
        { id: crypto.randomUUID(), role: 'assistant', content: answer },
      ]);
    } catch (error) {
      setChatMessages((messages) => [
        ...messages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I could not reach the backend, so I used local reasoning instead. ${answerSalesQuestion(
            trimmedQuestion,
            lead,
            nextMessages,
          )}`,
        },
      ]);
      setStatus(`Backend chat unavailable: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  function saveCurrentSettings() {
    saveSettings(settings);
    setStatus('Settings saved in this browser');
  }

  async function copyOutreach() {
    await navigator.clipboard.writeText(agentResponse.outreach.email);
    setStatus('Email copied to clipboard');
  }

  const analysis = agentResponse.analysis;
  const outreach = agentResponse.outreach;
  const navItems: Array<{ id: AppPage; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Sparkles size={18} /> },
    { id: 'lead', label: 'Lead Studio', icon: <Target size={18} /> },
    { id: 'outreach', label: 'Outreach', icon: <Mail size={18} /> },
    { id: 'copilot', label: 'Copilot', icon: <Bot size={18} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <BarChart3 size={18} /> },
    { id: 'backend', label: 'Backend', icon: <Settings size={18} /> },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          <div className="brand">
            <span className="brand-mark">
              <Bot size={24} />
            </span>
            <div>
              <strong>Agora AI Sales Agent</strong>
              <small>Lead intelligence + autonomous outreach</small>
            </div>
          </div>

          <div className="status-pill">
            <Activity size={16} />
            {status}
          </div>

          <nav className="app-nav" aria-label="Application sections">
            {navItems.map((item) => (
              <button
                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                key={item.id}
                onClick={() => navigateTo(item.id)}
                type="button"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <button className="help-button" onClick={() => setShowInstructions(true)} type="button">
            <HelpCircle size={18} />
            How to use this app
          </button>
        </div>
      </aside>

      <section className="app-content">
        {activePage === 'home' ? (
          <>
            <section className="hero">
              <div className="hero-grid">
                <div className="hero-copy">
                  <span className="eyebrow">
                    <Sparkles size={16} /> Next Gen AI Sales Agent
                  </span>
                  <h1>Qualify leads, generate outreach, and coach sales reps in one real workflow.</h1>
                  <p>
                    This is the home page. Use the sidebar to open each separate workspace instead of scrolling
                    through one overloaded page.
                  </p>
                  <span className="release-pill">Real pages v4</span>
                  <div className="hero-actions">
                    <button className="primary" onClick={runAgent} disabled={isRunning}>
                      <Play size={18} />
                      {isRunning ? 'Running agent...' : 'Run AI agent'}
                    </button>
                    <button className="secondary" onClick={() => navigateTo('lead')} type="button">
                      <Target size={18} />
                      Open Lead Studio
                    </button>
                  </div>
                </div>

                <div className="score-orb">
                  <span>Lead Score</span>
                  <strong>{analysis.score}</strong>
                  <em>{analysis.temperature}</em>
                </div>
              </div>
            </section>

            <section className="metrics">
              <MetricCard
                icon={<Target />}
                label="Current lead"
                value={hasLeadData(lead) ? lead.company || lead.name : 'No lead'}
                caption={hasEnoughDataForAgent(lead) ? `${analysis.score}/100 ${analysis.temperature}` : 'Enter verified data'}
              />
              <MetricCard
                icon={<TrendingUp />}
                label="Weighted pipeline"
                value={formatter.format(weightedPipeline)}
                caption={`${deals.length} saved deals`}
              />
              <MetricCard
                icon={<Zap />}
                label="Activities"
                value={`${activities.length}`}
                caption="Loaded from backend database"
              />
              <MetricCard
                icon={<Users />}
                label="Data source"
                value={settings.backendUrl ? 'Backend' : 'Browser'}
                caption={settings.backendUrl ? 'SQLite API connected' : 'Connect backend for database'}
              />
            </section>

            <section className="overview-actions">
              <button className="panel quick-action" onClick={() => navigateTo('outreach')} type="button">
                <Mail />
                <span>
                  <strong>Review generated outreach</strong>
                  <small>Email, LinkedIn, SMS, call script, and objection handling.</small>
                </span>
              </button>
              <button className="panel quick-action" onClick={() => navigateTo('copilot')} type="button">
                <MessageSquareText />
                <span>
                  <strong>Ask the sales copilot</strong>
                  <small>Get live coaching and next-step recommendations.</small>
                </span>
              </button>
              <button className="panel quick-action" onClick={() => navigateTo('pipeline')} type="button">
                <BarChart3 />
                <span>
                  <strong>Open pipeline board</strong>
                  <small>See active deals and weighted revenue.</small>
                </span>
              </button>
            </section>
          </>
        ) : null}

        {activePage === 'lead' ? (
          <section className="workspace page-grid">
            <article className="panel lead-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Lead command center</span>
                  <h2>Editable customer profile</h2>
                </div>
                <button className="ghost" onClick={saveCurrentLead}>
                  <Save size={16} /> Save
                </button>
              </div>

              <div className="form-grid">
                <Field label="Name" value={lead.name} onChange={(value) => updateLead('name', value)} />
                <Field label="Title" value={lead.title} onChange={(value) => updateLead('title', value)} />
                <Field label="Company" value={lead.company} onChange={(value) => updateLead('company', value)} />
                <Field label="Industry" value={lead.industry} onChange={(value) => updateLead('industry', value)} />
                <Field
                  label="Company size"
                  value={lead.companySize}
                  onChange={(value) => updateLead('companySize', value)}
                />
                <Field label="Region" value={lead.region} onChange={(value) => updateLead('region', value)} />
                <Field label="Email" value={lead.email} onChange={(value) => updateLead('email', value)} />
                <Field label="Phone" value={lead.phone} onChange={(value) => updateLead('phone', value)} />
                <Field label="Source" value={lead.source} onChange={(value) => updateLead('source', value)} />
                <Field
                  label="Budget"
                  value={lead.budget}
                  type="number"
                  onChange={(value) => updateLead('budget', Number(value))}
                />
                <Field
                  label="Urgency"
                  value={lead.urgency}
                  type="number"
                  min={1}
                  max={10}
                  onChange={(value) => updateLead('urgency', Number(value))}
                />
                <Field
                  label="Decision power"
                  value={lead.decisionPower}
                  type="number"
                  min={1}
                  max={10}
                  onChange={(value) => updateLead('decisionPower', Number(value))}
                />
                <Field
                  label="Engagement"
                  value={lead.engagement}
                  type="number"
                  min={1}
                  max={10}
                  onChange={(value) => updateLead('engagement', Number(value))}
                />
                <TextArea
                  label="Pain points"
                  value={lead.painPoints}
                  onChange={(value) => updateLead('painPoints', value)}
                />
                <TextArea label="Notes" value={lead.notes} onChange={(value) => updateLead('notes', value)} />
              </div>
            </article>

            <aside className="panel intelligence-panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">AI intelligence</span>
                  <h2>Recommendation engine</h2>
                </div>
                <BrainCircuit />
              </div>
              <p>{analysis.fitSummary}</p>
              <div className="insight-block">
                <h3>Buying signals</h3>
                <ul>
                  {analysis.buyingSignals.map((signal) => (
                    <li key={signal}>
                      <CheckCircle2 size={16} /> {signal}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="insight-block risk">
                <h3>Risks to manage</h3>
                <ul>
                  {analysis.risks.map((risk) => (
                    <li key={risk}>{risk}</li>
                  ))}
                </ul>
              </div>
              <div className="next-step">
                <span>Next best action</span>
                <strong>{analysis.recommendedNextStep}</strong>
              </div>
            </aside>
          </section>
        ) : null}

        {activePage === 'outreach' ? (
          <section className="page-single">
            <article className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Autonomous outreach</span>
              <h2>Sequence generated for {lead.name}</h2>
            </div>
            <button className="ghost" onClick={copyOutreach}>
              <Copy size={16} /> Copy email
            </button>
          </div>
          {!hasEnoughDataForAgent(lead) ? (
            <div className="empty-state">
              <strong>No outreach generated</strong>
              <p>Add a verified lead name, company, and pain points in Lead Studio first. The app will not invent a prospect.</p>
            </div>
          ) : (
            <>
          <div className="channel-card">
            <Mail />
            <div>
              <span>Email subject</span>
              <strong>{outreach.subject}</strong>
              <pre>{outreach.email}</pre>
            </div>
          </div>
          <div className="channel-grid">
            <div className="mini-card">
              <MessageSquareText />
              <span>LinkedIn</span>
              <p>{outreach.linkedin}</p>
            </div>
            <div className="mini-card">
              <Send />
              <span>SMS</span>
              <p>{outreach.sms}</p>
            </div>
            <div className="mini-card">
              <PhoneCall />
              <span>Call script</span>
              <p>{outreach.callScript}</p>
            </div>
          </div>
          <div className="objections">
            <h3>Objection handling</h3>
            {outreach.objections.map((objection) => (
              <p key={objection}>{objection}</p>
            ))}
          </div>
            </>
          )}
            </article>
          </section>
        ) : null}

        {activePage === 'copilot' ? (
          <section className="page-single">
            <article className="panel chat-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Sales copilot</span>
              <h2>Ask the agent</h2>
            </div>
            <Bot />
          </div>
          <div className="chat-log">
            {chatMessages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                {message.content}
              </div>
            ))}
          </div>
          <form className="chat-form" onSubmit={submitQuestion}>
            <input
              value={question}
              placeholder="Ask for an objection response, next step, lead score, or email..."
              onChange={(event) => setQuestion(event.target.value)}
            />
            <button className="primary" type="submit">
              <Send size={16} /> Ask
            </button>
          </form>
            </article>
          </section>
        ) : null}

        {activePage === 'pipeline' ? (
          <section className="panel page-single">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Revenue operations</span>
            <h2>Pipeline board</h2>
          </div>
          <div className="pipeline-total">
            <BarChart3 size={18} />
            {formatter.format(pipelineValue)}
          </div>
        </div>
        <div className="deal-form">
          <Field
            label="Account"
            value={dealDraft.account}
            onChange={(value) => updateDealDraft('account', value)}
          />
          <Field label="Owner" value={dealDraft.owner} onChange={(value) => updateDealDraft('owner', value)} />
          <Field
            label="Value"
            value={dealDraft.value}
            type="number"
            onChange={(value) => updateDealDraft('value', Number(value))}
          />
          <label className="field">
            <span>Stage</span>
            <select value={dealDraft.stage} onChange={(event) => updateDealDraft('stage', event.target.value as DealStage)}>
              {pipelineStages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Probability"
            value={dealDraft.probability}
            type="number"
            min={0}
            max={100}
            onChange={(value) => updateDealDraft('probability', Number(value))}
          />
          <Field label="Next step" value={dealDraft.nextStep} onChange={(value) => updateDealDraft('nextStep', value)} />
          <button className="primary" onClick={saveCurrentDeal}>
            <Save size={16} /> Save deal
          </button>
        </div>
        {deals.length === 0 ? (
          <div className="empty-state">
            <strong>No deals saved yet</strong>
            <p>Create a deal above or connect the backend database to load real pipeline records.</p>
          </div>
        ) : null}
        <div className="pipeline">
          {pipelineStages.map((stage) => (
            <div className="pipeline-stage" key={stage}>
              <h3>{stage}</h3>
              {deals
                .filter((deal) => deal.stage === stage)
                .map((deal) => (
                  <article className="deal-card" key={deal.id}>
                    <strong>{deal.account}</strong>
                    <span>{formatter.format(deal.value)}</span>
                    <div className="progress">
                      <i style={{ width: `${deal.probability}%` }} />
                    </div>
                    <small>{deal.nextStep}</small>
                  </article>
                ))}
            </div>
          ))}
        </div>
          </section>
        ) : null}

        {activePage === 'backend' ? (
          <section className="panel backend-panel page-single">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Production backend</span>
            <h2>Connect an API for live AI</h2>
          </div>
          <Rocket />
        </div>
        <p>
          The frontend never ships with customer records. Run the included Express backend to persist real leads,
          deals, and activities in SQLite. Add an OpenAI-compatible API key only if you want live model calls.
        </p>
        <div className="settings-row">
          <Field
            label="Backend URL"
            value={settings.backendUrl}
            onChange={(value) => setSettings((current) => ({ ...current, backendUrl: value }))}
          />
          <button className="primary" onClick={saveCurrentSettings}>
            <Save size={16} /> Save settings
          </button>
          <button className="secondary" onClick={loadBackendWorkspace} type="button">
            <Rocket size={16} /> Load database
          </button>
        </div>
        <code>npm run server:dev</code>
        <code>DATABASE_PATH=data/sales-agent.sqlite</code>
          </section>
        ) : null}
      </section>

      {showInstructions ? (
        <div className="modal-backdrop" role="presentation">
          <section className="instruction-modal" aria-labelledby="instruction-title" aria-modal="true" role="dialog">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  <HelpCircle size={16} /> Quick start guide
                </span>
                <h2 id="instruction-title">How to use the AI Sales Agent</h2>
              </div>
              <button className="ghost" onClick={() => closeInstructions()} type="button">
                Close
              </button>
            </div>

            <ol className="instruction-steps">
              <li>
                <strong>Start on Lead Studio.</strong>
                Enter a real lead name, company, and pain points. The app starts empty and does not include fake
                customers.
              </li>
              <li>
                <strong>Save your data.</strong>
                Without a backend URL, records save only in this browser. For a real shared database, run the backend
                API and add its URL on the Backend page.
              </li>
              <li>
                <strong>Run the AI agent.</strong>
                After required lead fields are filled, click Run AI Agent to score the lead and create recommendations
                from only the data you provided.
              </li>
              <li>
                <strong>Use the focused pages.</strong>
                Outreach creates messages, Copilot answers sales questions, Pipeline stores deals, and Backend connects
                the SQLite API.
              </li>
            </ol>

            <div className="instruction-note">
              <strong>Important:</strong> GitHub Pages hosts only the frontend. To persist shared real data, deploy or
              run the included Express + SQLite backend and connect it from the Backend page.
            </div>

            <div className="modal-actions">
              <button
                className="secondary"
                onClick={() => {
                  navigateTo('lead');
                  closeInstructions();
                }}
                type="button"
              >
                Go to Lead Studio
              </button>
              <button className="primary" onClick={() => closeInstructions()} type="button">
                Got it
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;
