import "server-only";

import { z } from "zod";
import { LocalStorage } from "@zeal-rsrch/storage";
import { shouldRetain } from "@zeal-rsrch/domain";
import type { Artifact } from "@zeal-rsrch/contracts";
import { RecordNotFoundError } from "@zeal-rsrch/db";

const RenameArtifactSchema = z.object({ name: z.string().trim().min(1).max(255) });

type FileStore = {
  get(id: string): Promise<Artifact | null>;
  listForProject(projectId: string): Promise<Artifact[]>;
  markDeleted(id: string): Promise<void>;
  rename(id: string, name: string): Promise<Artifact>;
};

function storage(): LocalStorage {
  return new LocalStorage(process.env.STORAGE_ROOT ?? ".rsrch-storage");
}

export async function listArtifacts(projectId: string, files: FileStore): Promise<Response> {
  return Response.json({ data: await files.listForProject(projectId) });
}

export async function getArtifactContent(id: string, files: FileStore, download = false): Promise<Response> {
  const artifact = await files.get(id);
  if (!artifact) throw new RecordNotFoundError("File", id);
  const content = await storage().get(artifact.storageKey);
  return new Response(new Uint8Array(content), {
    headers: {
      "Content-Type": artifact.contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(artifact.name)}`,
    },
  });
}

export async function previewArtifact(id: string, files: FileStore): Promise<Response> {
  const artifact = await files.get(id);
  if (!artifact) throw new RecordNotFoundError("File", id);
  if (!/^(text\/|application\/(json|.*\+json))/.test(artifact.contentType)) {
    return Response.json({ error: { code: "preview_unsupported", message: "Only text, Markdown, and JSON files can be previewed" } }, { status: 415 });
  }
  return Response.json({ data: { artifact, ...(await storage().preview(artifact.storageKey)) } });
}

export async function updateArtifact(request: Request, id: string, files: FileStore): Promise<Response> {
  const input = RenameArtifactSchema.parse(await request.json());
  return Response.json({ data: await files.rename(id, input.name) });
}

export async function deleteArtifact(id: string, files: FileStore): Promise<Response> {
  const artifact = await files.get(id);
  if (!artifact) throw new RecordNotFoundError("File", id);
  if (shouldRetain(artifact.retentionClass)) {
    return Response.json({ error: { code: "retained_artifact", message: "Retained artifacts cannot be deleted" } }, { status: 409 });
  }
  await storage().cleanupTemporary([{ storageKey: artifact.storageKey, retentionClass: artifact.retentionClass, contentHash: artifact.contentHash, sizeBytes: artifact.sizeBytes, contentType: artifact.contentType }]);
  await files.markDeleted(id);
  return new Response(null, { status: 204 });
}
