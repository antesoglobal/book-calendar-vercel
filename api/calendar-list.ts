// api/calendar-list.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

/**
 * GET /api/calendar-list
 *
 * Returns the list of Google Calendars for the authenticated user.
 *
 * Required environment variables:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REFRESH_TOKEN    (obtain via: scripts/get-refresh-token.ts)
 */

function getAuthClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error(
      'Missing env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are all required.',
    );
  }

  const oauth2 = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return oauth2;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.calendarList.list({
      showDeleted: false,
      showHidden: false,
    });

    const calendars = (response.data.items || []).map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description || null,
      timeZone: cal.timeZone || null,
      colorId: cal.colorId || null,
      backgroundColor: cal.backgroundColor || null,
      foregroundColor: cal.foregroundColor || null,
      primary: cal.primary || false,
      accessRole: cal.accessRole || null,
    }));

    return res.status(200).json({
      count: calendars.length,
      calendars,
    });
  } catch (err: any) {
    console.error('❌ calendar-list error:', err);
    return res.status(500).json({
      error: 'Failed to fetch Google Calendar list',
      detail: err.message,
    });
  }
}
