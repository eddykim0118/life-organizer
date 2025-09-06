import { db } from "@/db/dexie";
import type { ID, FinanceRepo as IFinanceRepo } from "@/types/models";
import type { FinanceEntry } from "@/types/models";
import { USE_SERVER, http } from "./httpClient";

function nowIso() {
  return new Date().toISOString();
}

export class FinanceRepo implements IFinanceRepo {
  async create(entry: FinanceEntry): Promise<FinanceEntry> {
    const toSave: FinanceEntry = {
      ...entry,
      id: entry.id ?? crypto.randomUUID(),
      created_at: entry.created_at ?? nowIso(),
      updated_at: nowIso(),
      health_domain: "finance",
    };
    await db.finance.add(toSave);
    return toSave;
  }
  async update(id: ID, patch: Partial<FinanceEntry>): Promise<FinanceEntry> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Finance entry not found");
    const updated: FinanceEntry = { ...existing, ...patch, updated_at: nowIso() };
    await db.finance.put(updated);
    return updated;
  }
  async get(id: ID): Promise<FinanceEntry | null> {
    return (await db.finance.get(id)) ?? null;
  }
  async list(range?: { start?: string; end?: string }): Promise<FinanceEntry[]> {
    let c = db.finance.toCollection();
    if (range?.start) c = c.filter(f => f.date >= range.start!);
    if (range?.end) c = c.filter(f => f.date <= range.end!);
    return c.sortBy("date");
  }
  async markRecurring(id: ID, recurring: boolean): Promise<FinanceEntry> {
    return this.update(id, { recurring });
  }
}

class FinanceHttpRepo implements IFinanceRepo {
  async create(entry: FinanceEntry): Promise<FinanceEntry> {
    return http<FinanceEntry>(`/api/finance`, { method: 'POST', body: JSON.stringify(entry) })
  }
  async update(id: ID, patch: Partial<FinanceEntry>): Promise<FinanceEntry> {
    return http<FinanceEntry>(`/api/finance/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
  }
  async get(id: ID): Promise<FinanceEntry | null> {
    try { return await http<FinanceEntry>(`/api/finance/${id}`) } catch { return null }
  }
  async list(range?: { start?: string; end?: string }): Promise<FinanceEntry[]> {
    const items = await http<FinanceEntry[]>(`/api/finance`)
    if (!range) return items
    return items.filter(f => (!range.start || f.date >= range.start) && (!range.end || f.date <= range.end))
  }
  async markRecurring(id: ID, recurring: boolean): Promise<FinanceEntry> {
    return this.update(id, { recurring })
  }
}

export const financeRepo: IFinanceRepo = USE_SERVER ? new FinanceHttpRepo() : new FinanceRepo();


