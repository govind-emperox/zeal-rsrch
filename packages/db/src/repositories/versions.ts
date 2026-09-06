import { and, eq } from "drizzle-orm";
import type { Database } from "../client.js";
import { promptVersions, skillVersions } from "../schema.js";

export type PromptVersionRecord = typeof promptVersions.$inferSelect;
export type SkillVersionRecord = typeof skillVersions.$inferSelect;

export class VersionRepository {
  constructor(private readonly db: Database) {}

  async createPromptVersion(input: typeof promptVersions.$inferInsert): Promise<PromptVersionRecord> {
    const [row] = await this.db.insert(promptVersions).values(input).returning();
    return row;
  }

  async findPromptVersion(name: string, version: string): Promise<PromptVersionRecord | null> {
    const [row] = await this.db
      .select()
      .from(promptVersions)
      .where(and(eq(promptVersions.name, name), eq(promptVersions.version, version)))
      .limit(1);
    return row ?? null;
  }

  async createSkillVersion(input: typeof skillVersions.$inferInsert): Promise<SkillVersionRecord> {
    const [row] = await this.db.insert(skillVersions).values(input).returning();
    return row;
  }

  async findSkillVersion(name: string, contentHash: string): Promise<SkillVersionRecord | null> {
    const [row] = await this.db
      .select()
      .from(skillVersions)
      .where(and(eq(skillVersions.name, name), eq(skillVersions.contentHash, contentHash)))
      .limit(1);
    return row ?? null;
  }
}
