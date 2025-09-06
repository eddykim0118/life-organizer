import type {
  ID,
  HealthDomain,
  IntendedUse,
  Priority,
  TaskStatus,
  Source,
  EventSource,
  FinanceCategory,
  SuggestionType,
  SuggestionAction,
} from "./domain";

export interface BaseEntity {
  id: ID;
  created_at: string; // ISO string
  updated_at: string; // ISO string
}

export interface Task extends BaseEntity {
  title: string;
  about?: string; // markdown
  health_domain: HealthDomain;
  intended_use: IntendedUse;
  priority: Priority;
  effort_minutes?: number;
  due_at?: string; // ISO
  scheduled_start?: string; // ISO
  scheduled_end?: string; // ISO
  recurrence_rule?: string; // RRULE
  status: TaskStatus;
  tags: string[];
  source: Source;
}

export interface Routine extends BaseEntity {
  title: string;
  default_health_domain: HealthDomain;
  default_intended_use: IntendedUse;
  default_time_block?: number; // minutes
  default_slots?: string; // human window e.g. "weekday mornings 7–8 am"
  default_tags?: string[];
  default_recurrence_rule?: string;
  default_checklist?: string[];
  active: boolean;
}

export interface CalendarEvent extends BaseEntity {
  task_id?: ID | null;
  title: string;
  health_domain: HealthDomain;
  intended_use: IntendedUse;
  start: string; // ISO
  end: string; // ISO
  is_all_day?: boolean;
  recurrence_rule?: string;
  source: EventSource;
  color?: string;
}

export interface FinanceEntry extends BaseEntity {
  title: string;
  amount: number;
  date: string; // ISO date
  category: FinanceCategory;
  health_domain: "finance"; // fixed
  link_task_id?: ID | null;
  notes?: string;
  tags?: string[];
  recurring?: boolean;
}

export interface Suggestion extends BaseEntity {
  suggestion_type: SuggestionType;
  payload: Record<string, unknown>;
  confidence: number; // 0..1
  explanation: string;
  action: SuggestionAction;
  expires_at?: string; // ISO
}

// Filters and repos
export interface TaskFilter {
  health_domain?: HealthDomain;
  intended_use?: IntendedUse;
  priority?: Priority;
  tag?: string;
  status?: TaskStatus;
  q?: string;
}

export interface TaskRepo {
  create(task: Task): Promise<Task>;
  update(id: ID, patch: Partial<Task>): Promise<Task>;
  get(id: ID): Promise<Task | null>;
  list(filter?: TaskFilter): Promise<Task[]>;
  bulkUpdate(ids: ID[], patch: Partial<Task>): Promise<number>;
  delete(id: ID): Promise<void>;
  bulkDelete(ids: ID[]): Promise<number>;
}

export interface EventRepo {
  create(event: CalendarEvent): Promise<CalendarEvent>;
  update(id: ID, patch: Partial<CalendarEvent>): Promise<CalendarEvent>;
  get(id: ID): Promise<CalendarEvent | null>;
  list(range?: { start?: string; end?: string }): Promise<CalendarEvent[]>;
}

export interface RoutineRepo {
  create(routine: Routine): Promise<Routine>;
  update(id: ID, patch: Partial<Routine>): Promise<Routine>;
  get(id: ID): Promise<Routine | null>;
  list(): Promise<Routine[]>;
  apply(templateId: ID, params: { startDate: string; days?: string[]; time?: string }): Promise<{ tasks: Task[]; events: CalendarEvent[] }>;
}

export interface FinanceRepo {
  create(entry: FinanceEntry): Promise<FinanceEntry>;
  update(id: ID, patch: Partial<FinanceEntry>): Promise<FinanceEntry>;
  get(id: ID): Promise<FinanceEntry | null>;
  list(range?: { start?: string; end?: string }): Promise<FinanceEntry[]>;
  markRecurring(id: ID, recurring: boolean): Promise<FinanceEntry>;
}

export interface SuggestionRepo {
  upsert(s: Suggestion): Promise<Suggestion>;
  listActive(nowIso: string): Promise<Suggestion[]>;
  purgeExpired(nowIso: string): Promise<number>;
  delete(id: ID): Promise<void>;
}


