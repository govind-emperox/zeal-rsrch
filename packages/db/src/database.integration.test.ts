import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvalidTaskTransitionError } from "@zeal-rsrch/domain";
import { createDatabaseClient, type DatabaseClient } from "./client.js";
import { ArchivedProjectError, BlockedReasonRequiredError, OptimisticLockError } from "./errors.js";
import { createRepositories } from "./repositories/index.js";
import { promptVersions, projects, reports, skillVersions } from "./schema.js";

describe("PostgreSQL persistence", () => {
  let client: DatabaseClient;
  let repositories: ReturnType<typeof createRepositories>;
  const projectIds: string[] = [];
  const versionIds: { prompt?: string; skill?: string } = {};

  beforeAll(() => {
    client = createDatabaseClient({ max: 3 });
    repositories = createRepositories(client.db);
  });

  afterAll(async () => {
    for (const projectId of projectIds) {
      await client.db.delete(reports).where(eq(reports.projectId, projectId));
      await client.db.delete(projects).where(eq(projects.id, projectId));
    }
    if (versionIds.prompt) {
      await client.db.delete(promptVersions).where(eq(promptVersions.id, versionIds.prompt));
    }
    if (versionIds.skill) {
      await client.db.delete(skillVersions).where(eq(skillVersions.id, versionIds.skill));
    }
    await client.close();
  });

  it("has every Release 1 table after migration", async () => {
    const expectedTables = [
      "approval_requests",
      "cleanup_audits",
      "files",
      "messages",
      "projects",
      "prompt_versions",
      "reports",
      "research_runs",
      "run_events",
      "skill_versions",
      "sources",
      "tasks",
    ];
    const result = await client.pool.query<{ table_name: string }>(
      `select table_name
       from information_schema.tables
       where table_schema = 'public' and table_name = any($1::text[])
       order by table_name`,
      [expectedTables],
    );

    expect(result.rows.map((row) => row.table_name)).toEqual(expectedTables);
  });

  it("persists the complete task lifecycle and related records", async () => {
    const uniqueName = `Integration ${randomUUID()}`;
    const project = await repositories.projects.create({
      title: uniqueName,
      description: "Disposable repository integration fixture",
    });
    projectIds.push(project.id);

    await expect(repositories.projects.create({ title: uniqueName.toLowerCase() })).rejects.toMatchObject({
      cause: { code: "23505" },
    });

    const promptVersion = await repositories.versions.createPromptVersion({
      name: "research-run",
      version: randomUUID(),
      contentHash: "a".repeat(64),
      template: "$research-journalist {{request}}",
    });
    versionIds.prompt = promptVersion.id;
    const skillVersion = await repositories.versions.createSkillVersion({
      name: "research-journalist",
      version: randomUUID(),
      contentHash: "b".repeat(64),
      path: "/tmp/research-journalist/SKILL.md",
    });
    versionIds.skill = skillVersion.id;

    const task = await repositories.tasks.create({
      projectId: project.id,
      title: "Compare primary evidence",
      request: "Read the primary sources and explain material disagreements.",
      priority: "high",
      skillName: "research-journalist",
    });
    expect(task.status).toBe("backlog");

    const initialEvents = await repositories.events.listForTask(task.id);
    expect(initialEvents.map((event) => event.type)).toEqual(["task_created"]);

    const queued = await repositories.tasks.transition(task.id, {
      expectedVersion: task.version,
      status: "queued",
      phase: "queued",
      eventType: "task_queued",
      eventMessage: "Task queued",
    });
    expect(queued.version).toBe(1);

    await expect(
      repositories.tasks.transition(task.id, {
        expectedVersion: 0,
        status: "researching",
        eventType: "planning_started",
        eventMessage: "Planning",
      }),
    ).rejects.toBeInstanceOf(OptimisticLockError);

    await expect(
      repositories.tasks.transition(task.id, {
        expectedVersion: queued.version,
        status: "done",
        eventType: "task_completed",
        eventMessage: "Skipped required states",
      }),
    ).rejects.toBeInstanceOf(InvalidTaskTransitionError);

    await expect(
      repositories.tasks.transition(task.id, {
        expectedVersion: queued.version,
        status: "blocked",
        eventType: "task_blocked",
        eventMessage: "Approval required",
      }),
    ).rejects.toBeInstanceOf(BlockedReasonRequiredError);

    expect((await repositories.events.listForTask(task.id)).map((event) => event.type)).toEqual([
      "task_created",
      "task_queued",
    ]);

    const researching = await repositories.tasks.transition(task.id, {
      expectedVersion: queued.version,
      status: "researching",
      phase: "planning",
      eventType: "planning_started",
      eventMessage: "Planning research",
    });

    const run = await repositories.runs.create({
      taskId: task.id,
      promptVersionId: promptVersion.id,
      skillVersionId: skillVersion.id,
    });
    expect(run.jobId).toBeNull();
    const running = await repositories.runs.update(run.id, {
      jobId: `job-${randomUUID()}`,
      status: "running",
      startedAt: new Date(),
      model: "account-default",
    });
    expect(running.status).toBe("running");
    expect(await repositories.runs.findByJobId(running.jobId!)).toMatchObject({ id: run.id });

    const appended = await repositories.events.append({
      projectId: project.id,
      taskId: task.id,
      runId: run.id,
      jobId: running.jobId,
      type: "source_found",
      message: "Primary source recorded",
      metadata: { sourceType: "webpage" },
    });
    expect(appended.id).toMatch(/^[1-9]\d*$/);
    await expect(
      repositories.events.append({
        projectId: project.id,
        taskId: task.id,
        runId: run.id,
        type: "source_read",
        message: "Oversized metadata must be rejected",
        metadata: { rawBody: "x".repeat(17_000) },
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    const userMessage = await repositories.messages.create({
      taskId: task.id,
      runId: run.id,
      role: "user",
      content: task.request,
    });
    expect((await repositories.messages.listForTask(task.id))[0]).toEqual(userMessage);

    const source = await repositories.sources.create({
      taskId: task.id,
      runId: run.id,
      type: "webpage",
      url: "https://example.com/primary-source",
      title: "Primary source",
      publisher: "Example",
      retrievedAt: new Date(),
      accessStatus: "available",
      citationLabel: "example-primary",
    });
    expect((await repositories.sources.listForTask(task.id))[0]).toEqual(source);
    await expect(
      repositories.sources.create({
        taskId: task.id,
        runId: run.id,
        type: "webpage",
        url: "file:///etc/passwd",
        title: "Unsafe source",
        retrievedAt: new Date(),
        accessStatus: "available",
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    const file = await repositories.files.create({
      projectId: project.id,
      taskId: task.id,
      runId: run.id,
      kind: "report",
      name: "report.md",
      storageKey: `projects/${project.id}/reports/report.md`,
      contentType: "text/markdown",
      contentHash: "c".repeat(64),
      sizeBytes: 1024,
      retentionClass: "final_report",
    });
    expect(await repositories.files.get(file.id)).toEqual(file);
    await expect(
      repositories.files.create({
        projectId: project.id,
        taskId: task.id,
        runId: run.id,
        kind: "temporary",
        name: "unsafe.md",
        storageKey: "../unsafe.md",
        contentType: "text/markdown",
        contentHash: "e".repeat(64),
        sizeBytes: 1,
        retentionClass: "temporary_notes",
      }),
    ).rejects.toMatchObject({ cause: { code: "23514" } });

    const report = await repositories.reports.create({
      projectId: project.id,
      taskId: task.id,
      runId: run.id,
      fileId: file.id,
      title: "Evidence report",
      version: 1,
    });
    expect((await repositories.reports.listForTask(task.id))[0]).toEqual(report);

    const auditFile = await repositories.files.create({
      projectId: project.id,
      taskId: task.id,
      runId: run.id,
      kind: "audit",
      name: "cleanup-audit.json",
      storageKey: `projects/${project.id}/audits/cleanup-audit.json`,
      contentType: "application/json",
      contentHash: "d".repeat(64),
      sizeBytes: 256,
      retentionClass: "cleanup_audit",
    });
    const audit = await repositories.cleanupAudits.create({
      projectId: project.id,
      taskId: task.id,
      runId: run.id,
      auditFileId: auditFile.id,
      status: "complete",
      deletedItems: [{ key: `tmp/${task.id}/` }],
      retainedItems: [{ key: file.storageKey }],
      failedItems: [],
      startedAt: new Date(),
      finishedAt: new Date(),
    });
    expect(await repositories.cleanupAudits.getForRun(run.id)).toEqual(audit);

    const approval = await repositories.approvals.create({
      taskId: task.id,
      runId: run.id,
      codexThreadId: "thread-integration",
      codexTurnId: "turn-integration",
      codexItemId: "item-integration",
      serverRequestId: 7,
      kind: "network_access",
      reason: "Access primary source",
      actionSummary: "Connect to example.com over HTTPS",
    });
    expect((await repositories.approvals.listPendingForTask(task.id))[0]).toEqual(approval);
    expect(await repositories.approvals.resolve(approval.id, "accept")).toMatchObject({
      status: "accepted",
    });

    const orderedEvents = await repositories.events.listForTask(task.id);
    expect(orderedEvents.map((event) => BigInt(event.id))).toEqual(
      [...orderedEvents].map((event) => BigInt(event.id)).sort((left, right) => (left < right ? -1 : 1)),
    );
    const afterFirst = await repositories.events.listForTask(task.id, { afterId: orderedEvents[0].id });
    expect(afterFirst).toEqual(orderedEvents.slice(1));

    expect(researching.version).toBe(2);
    const archivedProject = await repositories.projects.update(project.id, {
      status: "archived",
      version: project.version,
    });
    expect(archivedProject.archivedAt).not.toBeNull();
    await expect(
      repositories.tasks.create({
        projectId: project.id,
        title: "Should be rejected",
        request: "This project is archived.",
        priority: "medium",
        skillName: "research-journalist",
      }),
    ).rejects.toBeInstanceOf(ArchivedProjectError);

    const replacement = await repositories.projects.create({ title: uniqueName });
    projectIds.push(replacement.id);
    expect(replacement.status).toBe("active");
  });
});
