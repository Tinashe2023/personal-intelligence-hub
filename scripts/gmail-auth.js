/**
 * Gmail OAuth2 Helper Script
 * ===========================
 * Run this script to obtain a Gmail refresh token for the PIOS dashboard.
 *
 * Usage:
 *   node scripts/gmail-auth.js
 *
 * Prerequisites:
 *   1. Fill GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local
 *   2. Ensure the Google Cloud project has Gmail API enabled
 *   3. Add http://localhost:3000/oauth2callback as an authorized redirect URI
 *      in your Google Cloud Console OAuth client settings
 *
 * This script will:
 *   1. Start a local server on port 3000
 *   2. Open a browser for Google OAuth consent
 *   3. Capture the authorization code
 *   4. Exchange it for a refresh token
 *   5. Print the refresh token to paste into .env.local
 */

import { google } from "googleapis";
import http from "http";
import { URL } from "url";
import { readFileSync } from "fs";
import { resolve } from "path";
import { execSync } from "child_process";
import os from "os";

// ── Load env vars from .env.local ──────────────────────────────────────────
const ENV_PATH = resolve(process.cwd(), ".env.local");
const envVars = {};

try {
  const envContent = readFileSync(ENV_PATH, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      envVars[key] = value;
    }
  }
} catch {
  console.error("❌ Could not read .env.local — make sure it exists in the project root.");
  process.exit(1);
}

const CLIENT_ID = envVars.GMAIL_CLIENT_ID;
const CLIENT_SECRET = envVars.GMAIL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env.local");
  process.exit(1);
}

const REDIRECT_URI = "http://localhost:3001/oauth2callback";
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
];

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// ── Generate consent URL ───────────────────────────────────────────────────
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // Force consent to always get a refresh token
  scope: SCOPES,
});

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║              PIOS — Gmail OAuth2 Setup                     ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log("Opening your browser for Google authorization...\n");
console.log("If the browser doesn't open, visit this URL manually:\n");
console.log(`  ${authUrl}\n`);

// ── Open browser ───────────────────────────────────────────────────────────
try {
  const platform = os.platform();
  if (platform === "win32") {
    execSync(`start "" "${authUrl}"`, { stdio: "ignore" });
  } else if (platform === "darwin") {
    execSync(`open "${authUrl}"`, { stdio: "ignore" });
  } else {
    execSync(`xdg-open "${authUrl}"`, { stdio: "ignore" });
  }
} catch {
  console.log("⚠️  Could not open browser automatically. Please open the URL above manually.");
}

// ── Start local server to capture the callback ────────────────────────────
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://localhost:3001`);

  if (reqUrl.pathname === "/oauth2callback") {
    const code = reqUrl.searchParams.get("code");
    const error = reqUrl.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`
        <html>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>Error: ${error}</p>
            <p>Please try again.</p>
          </body>
        </html>
      `);
      console.error(`\n❌ Authorization failed: ${error}`);
      server.close();
      process.exit(1);
    }

    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h1>✅ Authorization Successful!</h1>
              <p>You can close this tab and return to the terminal.</p>
            </body>
          </html>
        `);

        console.log("\n╔══════════════════════════════════════════════════════════════╗");
        console.log("║                 ✅ SUCCESS — Tokens Received                ║");
        console.log("╚══════════════════════════════════════════════════════════════╝\n");

        if (tokens.refresh_token) {
          console.log("📋 Your GMAIL_REFRESH_TOKEN:\n");
          console.log(`   ${tokens.refresh_token}\n`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("Paste this value into your .env.local file:");
          console.log(`   GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        } else {
          console.log("⚠️  No refresh token received. This might happen if you've");
          console.log("   already authorized this app before. Try revoking access at:");
          console.log("   https://myaccount.google.com/permissions");
          console.log("   Then run this script again.\n");
        }

        if (tokens.access_token) {
          console.log(`Access Token (temporary): ${tokens.access_token.slice(0, 30)}...`);
        }

        server.close();
        process.exit(0);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: sans-serif; padding: 40px; text-align: center;">
              <h1>❌ Token Exchange Failed</h1>
              <p>${err.message}</p>
            </body>
          </html>
        `);
        console.error("\n❌ Token exchange failed:", err.message);
        server.close();
        process.exit(1);
      }
    }
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => {
  console.log("🔄 Waiting for authorization callback on http://localhost:3001 ...\n");
});
