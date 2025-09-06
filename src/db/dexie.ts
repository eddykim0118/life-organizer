import Dexie from "dexie";
import type { Table } from "dexie";
import type { Task, CalendarEvent, Routine, FinanceEntry, Suggestion } from "@/types/models";

export class LifeDB extends Dexie {
  tasks!: Table<Task, string>;
  events!: Table<CalendarEvent, string>;
  routines!: Table<Routine, string>;
  finance!: Table<FinanceEntry, string>;
  suggestions!: Table<Suggestion, string>;

  constructor() {
    super("life-organizer-db");
    this.version(1).stores({
      tasks: "id, status, priority, health_domain, intended_use, due_at, scheduled_start, scheduled_end, updated_at",
      events: "id, task_id, start, end, health_domain, intended_use, updated_at",
      routines: "id, active, updated_at",
      finance: "id, date, category, updated_at",
      suggestions: "id, suggestion_type, confidence, expires_at, updated_at",
    });
  }
}

export const db = new LifeDB();


