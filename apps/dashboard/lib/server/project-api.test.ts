import { beforeEach, describe, expect, it } from "vitest";
import type { CreateProjectInput, Project, UpdateProjectInput } from "@zeal-rsrch/contracts";
import { OptimisticLockError, RecordNotFoundError } from "@zeal-rsrch/db";
import {
  archiveProject,
  createProject,
  getProject,
  listProjects,
  updateProject,
  type ProjectStore,
} from "./project-api";

const projectId = "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f1";
const archivedProjectId = "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f2";

function fixture(overrides: Partial<Project> = {}): Project {
  return {
    id: projectId,
    title: "Science Fiction Books — September 2026",
    description: "Sci-Fi Books Weekly, Episode 03",
    status: "active",
    version: 0,
    createdAt: "2026-09-06T12:00:00.000Z",
    updatedAt: "2026-09-06T12:00:00.000Z",
    archivedAt: null,
    ...overrides,
  };
}

class FakeProjectStore implements ProjectStore {
  projects: Project[] = [
    fixture(),
    fixture({
      id: archivedProjectId,
      title: "Archived channel research",
      status: "archived",
      archivedAt: "2026-09-06T13:00:00.000Z",
    }),
  ];

  lastListOptions: { includeArchived?: boolean; limit?: number } | undefined;

  async create(input: CreateProjectInput): Promise<Project> {
    if (this.projects.some((project) => project.status === "active" && project.title === input.title)) {
      throw new Error("duplicate", { cause: { code: "23505" } });
    }
    const project = fixture({
      id: "018f0b21-4b4e-7c26-9f2f-0d15dc2f31f3",
      title: input.title,
      description: input.description ?? null,
    });
    this.projects.push(project);
    return project;
  }

  async get(id: string): Promise<Project | null> {
    return this.projects.find((project) => project.id === id) ?? null;
  }

  async list(options: { includeArchived?: boolean; limit?: number } = {}): Promise<Project[]> {
    this.lastListOptions = options;
    const selected = options.includeArchived
      ? this.projects
      : this.projects.filter((project) => project.status === "active");
    return selected.slice(0, options.limit);
  }

  async update(id: string, input: UpdateProjectInput): Promise<Project> {
    const index = this.projects.findIndex((project) => project.id === id);
    if (index === -1) {
      throw new RecordNotFoundError("Project", id);
    }
    const existing = this.projects[index];
    if (existing.version !== input.version) {
      throw new OptimisticLockError("Project", id, input.version);
    }
    const status = input.status ?? existing.status;
    const project: Project = {
      ...existing,
      title: input.title ?? existing.title,
      description: input.description === undefined ? existing.description : input.description,
      status,
      version: existing.version + 1,
      updatedAt: "2026-09-06T14:00:00.000Z",
      archivedAt:
        status === "archived"
          ? "2026-09-06T14:00:00.000Z"
          : input.status === "active"
            ? null
            : existing.archivedAt,
    };
    this.projects[index] = project;
    return project;
  }
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("project API", () => {
  let store: FakeProjectStore;

  beforeEach(() => {
    store = new FakeProjectStore();
  });

  it("lists active projects with validated query defaults", async () => {
    const response = await listProjects(new Request("http://localhost/api/projects"), store);

    expect(response.status).toBe(200);
    expect(store.lastListOptions).toEqual({ includeArchived: false, limit: 50 });
    expect(await responseJson(response)).toMatchObject({ data: [{ id: projectId }] });
  });

  it("supports bounded archived project listings", async () => {
    const response = await listProjects(
      new Request("http://localhost/api/projects?includeArchived=true&limit=2"),
      store,
    );

    expect(response.status).toBe(200);
    expect(store.lastListOptions).toEqual({ includeArchived: true, limit: 2 });
    expect((await responseJson(response)).data).toHaveLength(2);
  });

  it("rejects unsupported list parameters", async () => {
    const response = await listProjects(
      new Request("http://localhost/api/projects?includeArchived=yes&sort=title"),
      store,
    );

    expect(response.status).toBe(400);
    expect(await responseJson(response)).toMatchObject({ error: { code: "validation_error" } });
  });

  it("creates a normalized project", async () => {
    const response = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ title: "  Managing AI Products research  " }),
      }),
      store,
    );

    expect(response.status).toBe(201);
    expect(await responseJson(response)).toMatchObject({
      data: { title: "Managing AI Products research", version: 0 },
    });
  });

  it("returns actionable errors for malformed and conflicting creates", async () => {
    const malformed = await createProject(
      new Request("http://localhost/api/projects", { method: "POST", body: "{" }),
      store,
    );
    expect(malformed.status).toBe(400);
    expect(await responseJson(malformed)).toMatchObject({ error: { code: "validation_error" } });

    const conflict = await createProject(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ title: "Science Fiction Books — September 2026" }),
      }),
      store,
    );
    expect(conflict.status).toBe(409);
    expect(await responseJson(conflict)).toMatchObject({
      error: { code: "project_title_conflict" },
    });
  });

  it("validates project IDs and returns missing projects as 404", async () => {
    const invalid = await getProject("not-a-uuid", store);
    expect(invalid.status).toBe(400);

    const missing = await getProject("018f0b21-4b4e-7c26-9f2f-0d15dc2f31f9", store);
    expect(missing.status).toBe(404);
    expect(await responseJson(missing)).toMatchObject({ error: { code: "project_not_found" } });
  });

  it("updates and archives with optimistic version checks", async () => {
    const updated = await updateProject(
      projectId,
      new Request(`http://localhost/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "September SF releases", version: 0 }),
      }),
      store,
    );
    expect(updated.status).toBe(200);
    expect(await responseJson(updated)).toMatchObject({
      data: { title: "September SF releases", version: 1 },
    });

    const stale = await updateProject(
      projectId,
      new Request(`http://localhost/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Stale title", version: 0 }),
      }),
      store,
    );
    expect(stale.status).toBe(409);
    expect(await responseJson(stale)).toMatchObject({ error: { code: "version_conflict" } });

    const archived = await archiveProject(
      projectId,
      new Request(`http://localhost/api/projects/${projectId}?version=1`, { method: "DELETE" }),
      store,
    );
    expect(archived.status).toBe(200);
    expect(await responseJson(archived)).toMatchObject({
      data: { status: "archived", version: 2 },
    });
  });

  it("recognizes database errors duplicated by the server bundler", async () => {
    store.update = async () => {
      const error = new Error("Bundled optimistic lock error");
      error.name = "OptimisticLockError";
      throw error;
    };

    const response = await updateProject(
      projectId,
      new Request(`http://localhost/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Bundled stale title", version: 0 }),
      }),
      store,
    );

    expect(response.status).toBe(409);
    expect(await responseJson(response)).toMatchObject({ error: { code: "version_conflict" } });
  });
});
