// api/create-event.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

/**
 * POST /api/create-event
 *
 * Creates a new event in Google Calendar.
 *
 * Request body (application/json):
 *   calendarId   – Calendar to create event in (default: "primary")
 *   summary      – Event title (required)
 *   description  – Event description (optional)
 *   location     – Event location (optional)
 *   start        – Start datetime in ISO 8601, e.g. "2026-03-25T10:00:00+07:00" (required)
 *   end          – End datetime in ISO 8601, e.g. "2026-03-25T11:00:00+07:00" (required)
 *   attendees    – Array of email strings, e.g. ["alice@example.com", "bob@example.com"] (optional)
 *   timeZone     – IANA timezone (default: "Asia/Ho_Chi_Minh")
 *   sendUpdates  – Who to notify: "all" | "externalOnly" | "none" (default: "all")
 *
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *
 * Note: The refresh token must include the scope:
 *   https://www.googleapis.com/auth/calendar
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const {
    calendarId = 'primary',
    summary,
    description,
    location,
    start,
    end,
    attendees = [],
    timeZone = 'Asia/Ho_Chi_Minh',
    sendUpdates = 'all',
  } = req.body || {};

  // Validate required fields
  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Missing required field: summary' });
  }
  if (!start || typeof start !== 'string') {
    return res.status(400).json({ error: 'Missing required field: start (ISO 8601 datetime)' });
  }
  if (!end || typeof end !== 'string') {
    return res.status(400).json({ error: 'Missing required field: end (ISO 8601 datetime)' });
  }
  if (new Date(start) >= new Date(end)) {
    return res.status(400).json({ error: 'start must be before end' });
  }

  // Build attendees list
  const attendeeList = (Array.isArray(attendees) ? attendees : [attendees])
    .filter((e: any) => typeof e === 'string' && e.includes('@'))
    .map((email: string) => ({ email }));

  try {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.insert({
      calendarId,
      sendUpdates,
      requestBody: {
        summary,
        description: description || undefined,
        location: location || undefined,
        start: {
          dateTime: start,
          timeZone,
        },
        end: {
          dateTime: end,
          timeZone,
        },
        attendees: attendeeList.length > 0 ? attendeeList : undefined,
      },
    });

    const event = response.data;

    return res.status(201).json({
      id: event.id,
      summary: event.summary,
      description: event.description || null,
      location: event.location || null,
      start: event.start?.dateTime || event.start?.date || null,
      end: event.end?.dateTime || event.end?.date || null,
      status: event.status,
      htmlLink: event.htmlLink,
      organizer: event.organizer
        ? { email: event.organizer.email, displayName: event.organizer.displayName || null }
        : null,
      attendees: (event.attendees || []).map((a) => ({
        email: a.email,
        displayName: a.displayName || null,
        responseStatus: a.responseStatus || null,
      })),
    });
  } catch (err: any) {
    console.error('❌ create-event error:', err);
    return res.status(500).json({
      error: 'Failed to create Google Calendar event',
      detail: err.message,
    });
  }
}
