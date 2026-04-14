import { getResearchPapers } from "@/lib/research";

export async function GET() {
  try {
    const data = await getResearchPapers();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
