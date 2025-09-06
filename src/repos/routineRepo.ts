import { db } from "@/db/dexie";
import type { ID, RoutineRepo as IRoutineRepo } from "@/types/models";
import type { Routine, Task, CalendarEvent } from "@/types/models";

function nowIso() {
  return new Date().toISOString();
}

export class RoutineRepo implements IRoutineRepo {
  async create(routine: Routine): Promise<Routine> {
    const toSave: Routine = {
      ...routine,
      id: routine.id ?? crypto.randomUUID(),
      created_at: routine.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await db.routines.add(toSave);
    return toSave;
  }
  async update(id: ID, patch: Partial<Routine>): Promise<Routine> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Routine not found");
    const updated: Routine = { ...existing, ...patch, updated_at: nowIso() };
    await db.routines.put(updated);
    return updated;
  }
  async get(id: ID): Promise<Routine | null> {
    return (await db.routines.get(id)) ?? null;
  }
  async list(): Promise<Routine[]> {
    return db.routines.toCollection().sortBy("updated_at");
  }
  async apply(templateId: ID, params: { startDate: string; days?: string[]; time?: string }): Promise<{ tasks: Task[]; events: CalendarEvent[] }> {
    const routine = await this.get(templateId);
    if (!routine) throw new Error("Routine not found");
    // Minimal MVP implementation: create one task/event at startDate
    const start = new Date(params.startDate);
    const end = new Date(start.getTime() + (routine.default_time_block ?? 60) * 60000);
    const idBase = crypto.randomUUID();
    const task: Task = {
      id: idBase,
      title: routine.title,
      about: routine.default_checklist?.join("\n- "),
      health_domain: routine.default_health_domain,
      intended_use: routine.default_intended_use,
      priority: "soon",
      effort_minutes: routine.default_time_block ?? 60,
      status: "scheduled",
      tags: routine.default_tags ?? [],
      source: "template",
      created_at: nowIso(),
      updated_at: nowIso(),
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      recurrence_rule: routine.default_recurrence_rule,
    };
    const event: CalendarEvent = {
      id: crypto.randomUUID(),
      task_id: task.id,
      title: task.title,
      health_domain: task.health_domain,
      intended_use: task.intended_use,
      start: task.scheduled_start!,
      end: task.scheduled_end!,
      is_all_day: false,
      recurrence_rule: task.recurrence_rule,
      source: "manual",
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await db.transaction("rw", db.tasks, db.events, async () => {
      await db.tasks.add(task);
      await db.events.add(event);
    });
    return { tasks: [task], events: [event] };
  }
}

export const routineRepo = new RoutineRepo();


