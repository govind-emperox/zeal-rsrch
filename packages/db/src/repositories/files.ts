import { and, desc, eq, isNull } from "drizzle-orm";
import type { Artifact, ArtifactKind, RetentionClass } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { RecordNotFoundError } from "../errors.js";
import { mapFile } from "../mappers.js";
import { files } from "../schema.js";

export type CreateFileInput = {
  projectId: string;
  taskId?: string | null;
  runId?: string | null;
  kind: ArtifactKind;
  name: string;
  storageKey: string;
  contentType: string;
  contentHash: string;
  sizeBytes: number;
  retentionClass: RetentionClass;
};

export class FileRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateFileInput): Promise<Artifact> {
    const [row] = await this.db.insert(files).values(input).returning();
    return mapFile(row);
  }

  async get(id: string): Promise<Artifact | null> {
    const [row] = await this.db
      .select()
      .from(files)
      .where(and(eq(files.id, id), isNull(files.deletedAt)))
      .limit(1);
    return row ? mapFile(row) : null;
  }

  async listForProject(projectId: string): Promise<Artifact[]> {
    const rows = await this.db
      .select()
      .from(files)
      .where(and(eq(files.projectId, projectId), isNull(files.deletedAt)))
      .orderBy(desc(files.createdAt));
    return rows.map(mapFile);
  }

  async markDeleted(id: string): Promise<void> {
    const result = await this.db
      .update(files)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(files.id, id), isNull(files.deletedAt)))
      .returning({ id: files.id });
    if (result.length === 0) {
      throw new RecordNotFoundError("File", id);
    }
  }

  async rename(id: string, name: string): Promise<Artifact> {
    const [row] = await this.db
      .update(files)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(files.id, id), isNull(files.deletedAt)))
      .returning();
    if (!row) throw new RecordNotFoundError("File", id);
    return mapFile(row);
  }
}
