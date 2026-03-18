// api/contacts.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

/**
 * GET /api/contacts
 *
 * Returns contacts from Google Contacts via the People API.
 *
 * Query parameters:
 *   pageSize   – Max contacts to return (default: 100, max: 1000)
 *   pageToken  – Token to fetch the next page of results
 *   query      – Free-text search query to filter contacts by name/email
 *
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *
 * Note: The refresh token must have been granted the scope:
 *   https://www.googleapis.com/auth/contacts.readonly
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

/** Shape of a single contact returned by this API */
interface ContactResult {
  resourceName: string;
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
  emails: { value: string; type: string | null }[];
  phones: { value: string; type: string | null }[];
  organizations: { name: string | null; title: string | null }[];
  photoUrl: string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const auth = getAuthClient();
    const people = google.people({ version: 'v1', auth });

    const pageSize = Math.min(parseInt((req.query.pageSize as string) || '100', 10), 1000);
    const pageToken = (req.query.pageToken as string) || undefined;
    const query = (req.query.query as string) || undefined;

    let contacts: ContactResult[] = [];
    let nextPageToken: string | null | undefined = undefined;
    let totalCount: number | null | undefined = undefined;

    if (query) {
      // ── Fuzzy search by name / email ─────────────────────────────────────
      const searchRes = await people.people.searchContacts({
        query,
        pageSize,
        readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });

      const results = searchRes.data.results || [];
      contacts = results.map((r) => mapPerson(r.person || {}));
    } else {
      // ── List all contacts (paginated) ─────────────────────────────────────
      const listRes = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize,
        pageToken,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
        sortOrder: 'DISPLAY_NAME_ASCENDING',
      });

      contacts = (listRes.data.connections || []).map((p) => mapPerson(p));
      nextPageToken = listRes.data.nextPageToken;
      totalCount = listRes.data.totalItems;
    }

    return res.status(200).json({
      count: contacts.length,
      totalCount: totalCount ?? null,
      nextPageToken: nextPageToken ?? null,
      contacts,
    });
  } catch (err: any) {
    console.error('❌ contacts error:', err);
    return res.status(500).json({
      error: 'Failed to fetch Google Contacts',
      detail: err.message,
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function mapPerson(person: any): ContactResult {
  const primaryName = (person.names || [])[0] || {};
  const primaryPhoto = (person.photos || [])[0] || {};

  return {
    resourceName: person.resourceName || '',
    displayName: primaryName.displayName || null,
    givenName: primaryName.givenName || null,
    familyName: primaryName.familyName || null,
    emails: (person.emailAddresses || []).map((e: any) => ({
      value: e.value || '',
      type: e.type || null,
    })),
    phones: (person.phoneNumbers || []).map((p: any) => ({
      value: p.value || '',
      type: p.type || null,
    })),
    organizations: (person.organizations || []).map((o: any) => ({
      name: o.name || null,
      title: o.title || null,
    })),
    photoUrl: primaryPhoto.url || null,
  };
}
