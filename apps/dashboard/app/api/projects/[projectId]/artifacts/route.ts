import { getRepositories } from "@/lib/server/database";
import { listArtifacts } from "@/lib/server/artifacts";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  return listArtifacts((await context.params).projectId, getRepositories().files);
}
