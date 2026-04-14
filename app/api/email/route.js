import { getFilteredEmails } from "@/lib/gmail";

export async function GET() {
  try {
    const data = await getFilteredEmails();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
