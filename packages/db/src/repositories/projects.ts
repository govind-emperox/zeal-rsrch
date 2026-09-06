import { and, desc, eq, sql } from "drizzle-orm";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { OptimisticLockError, RecordNotFoundError } from "../errors.js";
import { mapProject } from "../mappers.js";
import { projects } from "../schema.js";

export class ProjectRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateProjectInput): Promise<Project> {
    const [row] = await this.db
      .insert(projects)
      .values({ title: input.title, description: input.description ?? null })
      .returning();
    return mapProject(row);
  }

  async get(id: string): Promise<Project | null> {
    const [row] = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return row ? mapProject(row) : null;
  }

  async list(options: { includeArchived?: boolean; limit?: number } = {}): Promise<Project[]> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const query = this.db.select().from(projects);
    const rows = options.includeArchived
      ? await query.orderBy(desc(projects.updatedAt)).limit(limit)
      : await query.where(eq(projects.status, "active")).orderBy(desc(projects.updatedAt)).limit(limit);
    return rows.map(mapProject);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const archivedAt = input.status === "archived" ? new Date() : input.status === "active" ? null : undefined;
    const [row] = await this.db
      .update(projects)
      .set({
        title: input.title,
        description: input.description,
        status: input.status,
        archivedAt,
        updatedAt: new Date(),
        version: sql`${projects.version} + 1`,
      })
      .where(and(eq(projects.id, id), eq(projects.version, input.version)))
      .returning();

    if (row) {
      return mapProject(row);
    }

    const existing = await this.get(id);
    if (!existing) {
      throw new RecordNotFoundError("Project", id);
    }
    throw new OptimisticLockError("Project", id, input.version);
  }
}
