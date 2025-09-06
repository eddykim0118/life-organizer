import { db } from "@/db/dexie";
import type { SuggestionRepo as ISuggestionRepo } from "@/types/models";
import type { Suggestion } from "@/types/models";

export class SuggestionRepo implements ISuggestionRepo {
  async upsert(s: Suggestion): Promise<Suggestion> {
    await db.suggestions.put(s);
    return s;
  }
  async listActive(nowIso: string): Promise<Suggestion[]> {
    return db.suggestions
      .where("expires_at")
      .aboveOrEqual(nowIso)
      .or("expires_at")
      .equals(undefined as unknown as string)
      .toArray();
  }
  async purgeExpired(nowIso: string): Promise<number> {
    let count = 0;
    await db.suggestions.where("expires_at").below(nowIso).delete().then(() => {
      count += 1;
    });
    return count; // rough
  }
  async delete(id: string): Promise<void> {
    await db.suggestions.delete(id)
  }
}

export const suggestionRepo = new SuggestionRepo();


