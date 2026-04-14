import { getNews } from "@/lib/news";

export async function GET() {
  try {
    const data = await getNews();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
