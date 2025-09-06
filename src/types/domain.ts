export type ID = string;

export type HealthDomain =
  | "time"
  | "finance"
  | "physical"
  | "mental"
  | "social"
  | "spiritual"
  | "admin";

export type IntendedUse =
  | "plan"
  | "execute"
  | "review"
  | "learn"
  | "budget"
  | "recover"
  | "reflect";

export type Priority = "now" | "soon" | "later";

export type TaskStatus = "inbox" | "scheduled" | "done" | "skipped" | "canceled";

export type Source = "manual" | "suggestion_accepted" | "template";

export type EventSource = "manual" | "autoscheduled" | "external_sync";

export type FinanceCategory =
  | "groceries"
  | "rent"
  | "transport"
  | "utilities"
  | "misc"
  | "savings"
  | "investment"
  | "debt";

export type SuggestionType =
  | "schedule_slot"
  | "routine_prompt"
  | "finance_check"
  | "reflection"
  | "recovery_break"
  | "buffer_time"
  | "bill_reminder";

export type SuggestionAction = "accept" | "snooze" | "dismiss";


