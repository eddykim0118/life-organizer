import { db } from "@/db/dexie";
import type { ID, EventRepo as IEventRepo } from "@/types/models";
import type { CalendarEvent } from "@/types/models";
import { USE_SERVER, http } from "./httpClient";

function nowIso() {
  return new Date().toISOString();
}

export class EventRepo implements IEventRepo {
  async create(event: CalendarEvent): Promise<CalendarEvent> {
    const toSave: CalendarEvent = {
      ...event,
      id: event.id ?? crypto.randomUUID(),
      created_at: event.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await db.events.add(toSave);
    return toSave;
  }
  async update(id: ID, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Event not found");
    const updated: CalendarEvent = { ...existing, ...patch, updated_at: nowIso() };
    await db.events.put(updated);
    return updated;
  }
  async get(id: ID): Promise<CalendarEvent | null> {
    return (await db.events.get(id)) ?? null;
  }
  async list(range?: { start?: string; end?: string }): Promise<CalendarEvent[]> {
    let c = db.events.toCollection();
    if (range?.start) c = c.filter(e => e.end >= range.start!);
    if (range?.end) c = c.filter(e => e.start <= range.end!);
    return c.sortBy("start");
  }
}

class EventHttpRepo implements IEventRepo {
  async create(event: CalendarEvent): Promise<CalendarEvent> {
    return http<CalendarEvent>(`/api/events`, { method: 'POST', body: JSON.stringify(event) })
  }
  async update(id: ID, patch: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return http<CalendarEvent>(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
  }
  async get(id: ID): Promise<CalendarEvent | null> {
    try { return await http<CalendarEvent>(`/api/events/${id}`) } catch { return null }
  }
  async list(range?: { start?: string; end?: string }): Promise<CalendarEvent[]> {
    const items = await http<CalendarEvent[]>(`/api/events`)
    if (!range) return items
    return items.filter(e => (!range.start || e.end >= range.start) && (!range.end || e.start <= range.end))
  }
}

export const eventRepo: IEventRepo = USE_SERVER ? new EventHttpRepo() : new EventRepo();


