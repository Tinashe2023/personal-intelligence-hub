export async function getWeather() {
  const { OPENMETEO_LAT: lat, OPENMETEO_LNG: lng } = process.env;
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&current_weather=true` +
    `&hourly=relativehumidity_2m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode,sunrise,sunset` +
    `&timezone=auto` +
    `&forecast_days=7`,
    { next: { revalidate: 1800 } }, // cache 30 min
  );
  return res.json();
}
