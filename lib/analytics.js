import { BetaAnalyticsDataClient } from "@google-analytics/data";
import path from "path";

let analyticsClient = null;

/**
 * Create or reuse GA4 Analytics client with explicit service account credentials.
 * Reads from the JSON file specified by GOOGLE_APPLICATION_CREDENTIALS.
 */
function getClient() {
  if (analyticsClient) return analyticsClient;

  const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!keyFilePath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS not set in .env.local");
  }

  // Resolve relative paths from project root
  const resolvedPath = path.resolve(process.cwd(), keyFilePath);

  analyticsClient = new BetaAnalyticsDataClient({
    keyFilename: resolvedPath,
  });
  
  return analyticsClient;
}

/**
 * Fetch GA4 stats for the last 30 days.
 * Returns an object with key metrics rather than raw response rows.
 */
export async function getGA4Stats() {
  const propertyId = process.env.GA4_PROPERTY_ID;

  if (!propertyId) {
    throw new Error("GA4_PROPERTY_ID not set in .env.local");
  }

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "bounceRate" },
      { name: "screenPageViews" },
      { name: "averageSessionDuration" },
      { name: "newUsers" },
    ],
  });

  const values = response.rows?.[0]?.metricValues || [];

  return {
    activeUsers: parseInt(values[0]?.value || "0"),
    sessions: parseInt(values[1]?.value || "0"),
    bounceRate: parseFloat(values[2]?.value || "0"),
    pageViews: parseInt(values[3]?.value || "0"),
    avgSessionDuration: parseFloat(values[4]?.value || "0"),
    newUsers: parseInt(values[5]?.value || "0"),
    dateRange: "Last 30 days",
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Fetch GA4 stats broken down by day for charting.
 * Returns an array of { date, activeUsers, sessions, pageViews }.
 */
export async function getGA4DailyStats() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return [];

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  return (response.rows || []).map((row) => ({
    date: row.dimensionValues[0].value, // YYYYMMDD
    activeUsers: parseInt(row.metricValues[0].value || "0"),
    sessions: parseInt(row.metricValues[1].value || "0"),
    pageViews: parseInt(row.metricValues[2].value || "0"),
  }));
}

/**
 * Fetch top pages by views.
 */
export async function getGA4TopPages() {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return [];

  const client = getClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 5,
  });

  return (response.rows || []).map((row) => ({
    page: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value || "0"),
  }));
}
