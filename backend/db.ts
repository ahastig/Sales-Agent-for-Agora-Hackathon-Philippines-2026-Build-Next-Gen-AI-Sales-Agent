import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import pg from 'pg';
import type { Activity, Deal, LeadProfile } from '../src/types';

const { Pool } = pg;

type StoreMode = 'postgres' | 'sqlite';

const mode: StoreMode = process.env.DATABASE_URL ? 'postgres' : 'sqlite';
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
    })
  : null;

const databasePath = resolve(process.env.DATABASE_PATH ?? 'data/sales-agent.sqlite');
if (!pool) {
  mkdirSync(dirname(databasePath), { recursive: true });
}

const sqlite = pool ? null : new Database(databasePath);
sqlite?.pragma('journal_mode = WAL');
sqlite?.pragma('foreign_keys = ON');

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
  completed: boolean | number;
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
    budget: Number(row.budget),
    urgency: Number(row.urgency),
    decisionPower: Number(row.decision_power),
    engagement: Number(row.engagement),
    notes: row.notes,
  };
}

function dealFromRow(row: DealRow): Deal {
  return {
    id: row.id,
    account: row.account,
    owner: row.owner,
    value: Number(row.value),
    stage: row.stage,
    probability: Number(row.probability),
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

export function getStoreInfo() {
  return {
    mode,
    database: pool ? 'postgres' : databasePath,
  };
}

export async function initializeDatabase() {
  if (pool) {
    await pool.query(`
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
        budget NUMERIC NOT NULL DEFAULT 0,
        urgency INTEGER NOT NULL DEFAULT 1,
        decision_power INTEGER NOT NULL DEFAULT 1,
        engagement INTEGER NOT NULL DEFAULT 1,
        notes TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS deals (
        id TEXT PRIMARY KEY,
        account TEXT NOT NULL DEFAULT '',
        owner TEXT NOT NULL DEFAULT '',
        value NUMERIC NOT NULL DEFAULT 0,
        stage TEXT NOT NULL DEFAULT 'Prospect',
        probability INTEGER NOT NULL DEFAULT 0,
        next_step TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        type TEXT NOT NULL DEFAULT 'note',
        title TEXT NOT NULL DEFAULT '',
        body TEXT NOT NULL DEFAULT '',
        due_at TEXT NOT NULL DEFAULT '',
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    return;
  }

  sqlite?.exec(`
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
}

export async function listLeads() {
  if (pool) {
    const result = await pool.query('SELECT * FROM leads ORDER BY updated_at DESC');
    return result.rows.map((row) => leadFromRow(row as LeadRow));
  }

  return sqlite
    ?.prepare('SELECT * FROM leads ORDER BY updated_at DESC')
    .all()
    .map((row) => leadFromRow(row as LeadRow)) ?? [];
}

export async function upsertLead(lead: LeadProfile) {
  if (pool) {
    await pool.query(
      `
        INSERT INTO leads (
          id, name, title, company, industry, company_size, region, email, phone, source,
          pain_points, budget, urgency, decision_power, engagement, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT(id) DO UPDATE SET
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          company = EXCLUDED.company,
          industry = EXCLUDED.industry,
          company_size = EXCLUDED.company_size,
          region = EXCLUDED.region,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          source = EXCLUDED.source,
          pain_points = EXCLUDED.pain_points,
          budget = EXCLUDED.budget,
          urgency = EXCLUDED.urgency,
          decision_power = EXCLUDED.decision_power,
          engagement = EXCLUDED.engagement,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `,
      [
        lead.id,
        lead.name,
        lead.title,
        lead.company,
        lead.industry,
        lead.companySize,
        lead.region,
        lead.email,
        lead.phone,
        lead.source,
        lead.painPoints,
        lead.budget,
        lead.urgency,
        lead.decisionPower,
        lead.engagement,
        lead.notes,
      ],
    );
    return lead;
  }

  sqlite
    ?.prepare(
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
    )
    .run(lead);
  return lead;
}

export async function deleteLead(id: string) {
  if (pool) {
    await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return;
  }
  sqlite?.prepare('DELETE FROM leads WHERE id = ?').run(id);
}

export async function listDeals() {
  if (pool) {
    const result = await pool.query('SELECT * FROM deals ORDER BY updated_at DESC');
    return result.rows.map((row) => dealFromRow(row as DealRow));
  }
  return sqlite
    ?.prepare('SELECT * FROM deals ORDER BY updated_at DESC')
    .all()
    .map((row) => dealFromRow(row as DealRow)) ?? [];
}

export async function upsertDeal(deal: Deal) {
  if (pool) {
    await pool.query(
      `
        INSERT INTO deals (id, account, owner, value, stage, probability, next_step)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(id) DO UPDATE SET
          account = EXCLUDED.account,
          owner = EXCLUDED.owner,
          value = EXCLUDED.value,
          stage = EXCLUDED.stage,
          probability = EXCLUDED.probability,
          next_step = EXCLUDED.next_step,
          updated_at = NOW()
      `,
      [deal.id, deal.account, deal.owner, deal.value, deal.stage, deal.probability, deal.nextStep],
    );
    return deal;
  }

  sqlite
    ?.prepare(
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
    )
    .run(deal);
  return deal;
}

export async function deleteDeal(id: string) {
  if (pool) {
    await pool.query('DELETE FROM deals WHERE id = $1', [id]);
    return;
  }
  sqlite?.prepare('DELETE FROM deals WHERE id = ?').run(id);
}

export async function listActivities() {
  if (pool) {
    const result = await pool.query('SELECT * FROM activities ORDER BY created_at DESC');
    return result.rows.map((row) => activityFromRow(row as ActivityRow));
  }
  return sqlite
    ?.prepare('SELECT * FROM activities ORDER BY created_at DESC')
    .all()
    .map((row) => activityFromRow(row as ActivityRow)) ?? [];
}

export async function upsertActivity(activity: Activity) {
  if (pool) {
    await pool.query(
      `
        INSERT INTO activities (id, lead_id, type, title, body, due_at, completed, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT(id) DO UPDATE SET
          lead_id = EXCLUDED.lead_id,
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          due_at = EXCLUDED.due_at,
          completed = EXCLUDED.completed
      `,
      [
        activity.id,
        activity.leadId,
        activity.type,
        activity.title,
        activity.body,
        activity.dueAt,
        activity.completed,
        activity.createdAt,
      ],
    );
    return activity;
  }

  sqlite
    ?.prepare(
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
    )
    .run({ ...activity, completed: activity.completed ? 1 : 0 });
  return activity;
}

export async function deleteActivity(id: string) {
  if (pool) {
    await pool.query('DELETE FROM activities WHERE id = $1', [id]);
    return;
  }
  sqlite?.prepare('DELETE FROM activities WHERE id = ?').run(id);
}
