import { getSystemStats } from "@/lib/system";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getSystemStats();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
