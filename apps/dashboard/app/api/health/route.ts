import { getHealthChecks } from "@/lib/server/health";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({ data: await getHealthChecks() });
}
