import { getRepositories } from "@/lib/server/database";
import { previewArtifact } from "@/lib/server/artifacts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ artifactId: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  return previewArtifact((await context.params).artifactId, getRepositories().files);
}
