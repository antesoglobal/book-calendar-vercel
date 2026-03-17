// api/calendar-events.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

/**
 * GET /api/calendar-events
 *
 * Returns events from Google Calendar.
 *
 * Query parameters:
 *   calendarId  – Calendar ID (default: "primary")
 *   timeMin     – Start date in ISO format (default: start of today)
 *   timeMax     – End date in ISO format (default: 30 days from now)
 *   maxResults  – Max events to return (default: 50)
 *
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
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

    const calendarId = (req.query.calendarId as string) || 'primary';
    const now = new Date();
    const timeMin = (req.query.timeMin as string) || now.toISOString();
    const timeMax =
      (req.query.timeMax as string) ||
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const maxResults = parseInt((req.query.maxResults as string) || '50', 10);

    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id,
      summary: event.summary || '(No title)',
      description: event.description || null,
      location: event.location || null,
      start: event.start?.dateTime || event.start?.date || null,
      end: event.end?.dateTime || event.end?.date || null,
      status: event.status || null,
      htmlLink: event.htmlLink || null,
      organizer: event.organizer
        ? { email: event.organizer.email, displayName: event.organizer.displayName || null }
        : null,
      attendees: (event.attendees || []).map((a) => ({
        email: a.email,
        displayName: a.displayName || null,
        responseStatus: a.responseStatus || null,
      })),
    }));

    return res.status(200).json({
      calendarId,
      timeMin,
      timeMax,
      count: events.length,
      events,
    });
  } catch (err: any) {
    console.error('❌ calendar-events error:', err);
    return res.status(500).json({
      error: 'Failed to fetch Google Calendar events',
      detail: err.message,
    });
  }
}
