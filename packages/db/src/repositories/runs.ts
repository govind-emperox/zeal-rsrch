import { and, desc, eq } from "drizzle-orm";
import type { ResearchRun, ResearchRunStatus } from "@zeal-rsrch/contracts";
import type { Database } from "../client.js";
import { RecordNotFoundError } from "../errors.js";
import { mapResearchRun } from "../mappers.js";
import { researchRuns } from "../schema.js";

export type CreateResearchRunInput = {
  taskId: string;
  parentRunId?: string | null;
  attempt?: number;
  promptVersionId?: string | null;
  skillVersionId?: string | null;
};

export type UpdateResearchRunInput = {
  status?: ResearchRunStatus;
  jobId?: string | null;
  codexThreadId?: string | null;
  codexTurnId?: string | null;
  traceId?: string | null;
  model?: string | null;
  terminalCode?: string | null;
  startedAt?: Date | null;
  finishedAt?: Date | null;
};

export class ResearchRunRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateResearchRunInput): Promise<ResearchRun> {
    const [row] = await this.db
      .insert(researchRuns)
      .values({
        taskId: input.taskId,
        parentRunId: input.parentRunId,
        attempt: input.attempt,
        promptVersionId: input.promptVersionId,
        skillVersionId: input.skillVersionId,
      })
      .returning();
    return mapResearchRun(row);
  }

  async get(id: string): Promise<ResearchRun | null> {
    const [row] = await this.db.select().from(researchRuns).where(eq(researchRuns.id, id)).limit(1);
    return row ? mapResearchRun(row) : null;
  }

  async listForTask(taskId: string): Promise<ResearchRun[]> {
    const rows = await this.db
      .select()
      .from(researchRuns)
      .where(eq(researchRuns.taskId, taskId))
      .orderBy(desc(researchRuns.createdAt));
    return rows.map(mapResearchRun);
  }

  async update(id: string, input: UpdateResearchRunInput): Promise<ResearchRun> {
    const [row] = await this.db.update(researchRuns).set(input).where(eq(researchRuns.id, id)).returning();
    if (!row) {
      throw new RecordNotFoundError("Research run", id);
    }
    return mapResearchRun(row);
  }

  async findByJobId(jobId: string): Promise<ResearchRun | null> {
    const [row] = await this.db.select().from(researchRuns).where(and(eq(researchRuns.jobId, jobId))).limit(1);
    return row ? mapResearchRun(row) : null;
  }
}
