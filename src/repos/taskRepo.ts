import { db } from "@/db/dexie";
import type { ID, TaskRepo as ITaskRepo } from "@/types/models";
import type { Task, TaskFilter } from "@/types/models";
import { USE_SERVER } from "./httpClient";
import { http } from "./httpClient";

function nowIso() {
  return new Date().toISOString();
}

export class TaskRepo implements ITaskRepo {
  async create(task: Task): Promise<Task> {
    const toSave: Task = {
      ...task,
      id: task.id ?? crypto.randomUUID(),
      created_at: task.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    await db.tasks.add(toSave);
    return toSave;
  }

  async update(id: ID, patch: Partial<Task>): Promise<Task> {
    const existing = await this.get(id);
    if (!existing) throw new Error("Task not found");
    const updated: Task = { ...existing, ...patch, updated_at: nowIso() };
    await db.tasks.put(updated);
    return updated;
  }

  async get(id: ID): Promise<Task | null> {
    return (await db.tasks.get(id)) ?? null;
  }

  async list(filter?: TaskFilter): Promise<Task[]> {
    let c = db.tasks.toCollection();
    if (filter?.status) c = c.filter(t => t.status === filter.status);
    if (filter?.health_domain) c = c.filter(t => t.health_domain === filter.health_domain);
    if (filter?.intended_use) c = c.filter(t => t.intended_use === filter.intended_use);
    if (filter?.priority) c = c.filter(t => t.priority === filter.priority);
    if (filter?.tag) c = c.filter(t => t.tags?.includes(filter.tag!));
    if (filter?.q) {
      const q = filter.q.toLowerCase();
      c = c.filter(t => t.title.toLowerCase().includes(q) || (t.about ?? "").toLowerCase().includes(q));
    }
    return c.sortBy("updated_at");
  }

  async bulkUpdate(ids: ID[], patch: Partial<Task>): Promise<number> {
    let count = 0;
    await db.transaction("rw", db.tasks, async () => {
      for (const id of ids) {
        const existing = await db.tasks.get(id);
        if (!existing) continue;
        const updated: Task = { ...existing, ...patch, updated_at: nowIso() };
        await db.tasks.put(updated);
        count += 1;
      }
    });
    return count;
  }

  async delete(id: ID): Promise<void> {
    await db.tasks.delete(id)
  }

  async bulkDelete(ids: ID[]): Promise<number> {
    await db.tasks.bulkDelete(ids)
    return ids.length
  }
}

class TaskHttpRepo implements ITaskRepo {
  async create(task: Task): Promise<Task> {
    return http<Task>(`/api/tasks`, { method: 'POST', body: JSON.stringify(task) })
  }
  async update(id: ID, patch: Partial<Task>): Promise<Task> {
    return http<Task>(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) })
  }
  async get(id: ID): Promise<Task | null> {
    try { return await http<Task>(`/api/tasks/${id}`) } catch { return null }
  }
  async list(filter?: TaskFilter): Promise<Task[]> {
    const items = await http<Task[]>(`/api/tasks`)
    // client-side filter
    return items.filter(t => (
      (!filter?.status || t.status === filter.status) &&
      (!filter?.health_domain || t.health_domain === filter.health_domain) &&
      (!filter?.intended_use || t.intended_use === filter.intended_use) &&
      (!filter?.priority || t.priority === filter.priority) &&
      (!filter?.tag || (t.tags || []).includes(filter.tag)) &&
      (!filter?.q || t.title.toLowerCase().includes(filter.q.toLowerCase()) || (t.about||'').toLowerCase().includes(filter.q.toLowerCase()))
    ))
  }
  async bulkUpdate(ids: ID[], patch: Partial<Task>): Promise<number> {
    const res = await http<{ count: number }>(`/api/tasks/bulk-update`, { method: 'POST', body: JSON.stringify({ ids, patch }) })
    return res.count
  }
  async delete(id: ID): Promise<void> {
    await http<void>(`/api/tasks/${id}`, { method: 'DELETE' })
  }
  async bulkDelete(ids: ID[]): Promise<number> {
    const res = await http<{ count: number }>(`/api/tasks/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) })
    return res.count
  }
}

export const taskRepo: ITaskRepo = USE_SERVER ? new TaskHttpRepo() : new TaskRepo();


