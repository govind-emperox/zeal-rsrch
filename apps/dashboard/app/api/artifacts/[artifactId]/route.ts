import { getRepositories } from "@/lib/server/database";
import { deleteArtifact, getArtifactContent, updateArtifact } from "@/lib/server/artifacts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ artifactId: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  return getArtifactContent((await context.params).artifactId, getRepositories().files, new URL(request.url).searchParams.get("download") === "true");
}
export async function PATCH(request: Request, context: Context): Promise<Response> {
  return updateArtifact(request, (await context.params).artifactId, getRepositories().files);
}
export async function DELETE(_request: Request, context: Context): Promise<Response> {
  return deleteArtifact((await context.params).artifactId, getRepositories().files);
}
