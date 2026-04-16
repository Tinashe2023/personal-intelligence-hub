import { getYouTubeStats } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getYouTubeStats();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
