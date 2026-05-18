import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Activity, Deal, LeadProfile } from '../src/types';

const databasePath = resolve(process.env.DATABASE_PATH ?? 'data/sales-agent.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    company_size TEXT NOT NULL DEFAULT '',
    region TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    pain_points TEXT NOT NULL DEFAULT '',
    budget REAL NOT NULL DEFAULT 0,
    urgency INTEGER NOT NULL DEFAULT 1,
    decision_power INTEGER NOT NULL DEFAULT 1,
    engagement INTEGER NOT NULL DEFAULT 1,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    account TEXT NOT NULL DEFAULT '',
    owner TEXT NOT NULL DEFAULT '',
    value REAL NOT NULL DEFAULT 0,
    stage TEXT NOT NULL DEFAULT 'Prospect',
    probability INTEGER NOT NULL DEFAULT 0,
    next_step TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'note',
    title TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    due_at TEXT NOT NULL DEFAULT '',
    completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
  );
`);

type LeadRow = {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  company_size: string;
  region: string;
  email: string;
  phone: string;
  source: string;
  pain_points: string;
  budget: number;
  urgency: number;
  decision_power: number;
  engagement: number;
  notes: string;
};

type DealRow = {
  id: string;
  account: string;
  owner: string;
  value: number;
  stage: Deal['stage'];
  probability: number;
  next_step: string;
};

type ActivityRow = {
  id: string;
  lead_id: string;
  type: Activity['type'];
  title: string;
  body: string;
  due_at: string;
  completed: number;
  created_at: string;
};

function leadFromRow(row: LeadRow): LeadProfile {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    company: row.company,
    industry: row.industry,
    companySize: row.company_size,
    region: row.region,
    email: row.email,
    phone: row.phone,
    source: row.source,
    painPoints: row.pain_points,
    budget: row.budget,
    urgency: row.urgency,
    decisionPower: row.decision_power,
    engagement: row.engagement,
    notes: row.notes,
  };
}

function dealFromRow(row: DealRow): Deal {
  return {
    id: row.id,
    account: row.account,
    owner: row.owner,
    value: row.value,
    stage: row.stage,
    probability: row.probability,
    nextStep: row.next_step,
  };
}

function activityFromRow(row: ActivityRow): Activity {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type,
    title: row.title,
    body: row.body,
    dueAt: row.due_at,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export function listLeads() {
  return db.prepare('SELECT * FROM leads ORDER BY updated_at DESC').all().map((row) => leadFromRow(row as LeadRow));
}

export function upsertLead(lead: LeadProfile) {
  db.prepare(
    `
      INSERT INTO leads (
        id, name, title, company, industry, company_size, region, email, phone, source,
        pain_points, budget, urgency, decision_power, engagement, notes
      )
      VALUES (
        @id, @name, @title, @company, @industry, @companySize, @region, @email, @phone, @source,
        @painPoints, @budget, @urgency, @decisionPower, @engagement, @notes
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        title = excluded.title,
        company = excluded.company,
        industry = excluded.industry,
        company_size = excluded.company_size,
        region = excluded.region,
        email = excluded.email,
        phone = excluded.phone,
        source = excluded.source,
        pain_points = excluded.pain_points,
        budget = excluded.budget,
        urgency = excluded.urgency,
        decision_power = excluded.decision_power,
        engagement = excluded.engagement,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run(lead);
  return lead;
}

export function deleteLead(id: string) {
  db.prepare('DELETE FROM leads WHERE id = ?').run(id);
}

export function listDeals() {
  return db.prepare('SELECT * FROM deals ORDER BY updated_at DESC').all().map((row) => dealFromRow(row as DealRow));
}

export function upsertDeal(deal: Deal) {
  db.prepare(
    `
      INSERT INTO deals (id, account, owner, value, stage, probability, next_step)
      VALUES (@id, @account, @owner, @value, @stage, @probability, @nextStep)
      ON CONFLICT(id) DO UPDATE SET
        account = excluded.account,
        owner = excluded.owner,
        value = excluded.value,
        stage = excluded.stage,
        probability = excluded.probability,
        next_step = excluded.next_step,
        updated_at = CURRENT_TIMESTAMP
    `,
  ).run(deal);
  return deal;
}

export function deleteDeal(id: string) {
  db.prepare('DELETE FROM deals WHERE id = ?').run(id);
}

export function listActivities() {
  return db
    .prepare('SELECT * FROM activities ORDER BY created_at DESC')
    .all()
    .map((row) => activityFromRow(row as ActivityRow));
}

export function upsertActivity(activity: Activity) {
  db.prepare(
    `
      INSERT INTO activities (id, lead_id, type, title, body, due_at, completed, created_at)
      VALUES (@id, @leadId, @type, @title, @body, @dueAt, @completed, @createdAt)
      ON CONFLICT(id) DO UPDATE SET
        lead_id = excluded.lead_id,
        type = excluded.type,
        title = excluded.title,
        body = excluded.body,
        due_at = excluded.due_at,
        completed = excluded.completed
    `,
  ).run({ ...activity, completed: activity.completed ? 1 : 0 });
  return activity;
}

export function deleteActivity(id: string) {
  db.prepare('DELETE FROM activities WHERE id = ?').run(id);
}
