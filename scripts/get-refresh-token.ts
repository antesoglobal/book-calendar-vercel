/**
 * scripts/get-refresh-token.ts
 *
 * One-time helper to obtain a Google OAuth2 refresh token.
 *
 * Usage:
 *   1. Create OAuth2 credentials in Google Cloud Console
 *      → APIs & Services → Credentials → Create OAuth client ID (Desktop app)
 *      → No redirect URI needed for Desktop type
 *   2. Enable the "Google Calendar API" in your project
 *   3. Run:
 *        GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx ts-node scripts/get-refresh-token.ts
 *   4. Open the printed URL in your browser, authorize, paste the code back
 *   5. Copy the refresh token → set it as GOOGLE_REFRESH_TOKEN env var in Vercel
 */

import { google } from 'googleapis';
import * as http from 'http';
import { exec } from 'child_process';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 8090;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/calendar.readonly'],
});

console.log('\n🔗 Open this URL in your browser to authorize:\n');
console.log(authUrl);
console.log(`\n⏳ Waiting for callback on http://localhost:${PORT}/callback ...\n`);

// Auto-open in default browser (macOS)
exec(`open "${authUrl}"`);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  if (!code) {
    res.writeHead(400);
    res.end('Missing code parameter');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ Tokens received!\n');
    console.log('Access Token :', tokens.access_token);
    console.log('Refresh Token:', tokens.refresh_token);
    console.log('Expiry       :', tokens.expiry_date);
    console.log('\n📋 Copy the Refresh Token above and set it as GOOGLE_REFRESH_TOKEN in Vercel.\n');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2>✅ Success! You can close this tab.</h2><p>Check your terminal for the refresh token.</p>');
  } catch (err: any) {
    console.error('❌ Error exchanging code:', err.message);
    res.writeHead(500);
    res.end('Error exchanging code: ' + err.message);
  } finally {
    server.close();
  }
});

server.listen(PORT, () => {
  console.log(`🖥  Local server listening on port ${PORT}`);
});
