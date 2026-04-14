import { getWeather } from "@/lib/weather";

export async function GET() {
  try {
    const data = await getWeather();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
