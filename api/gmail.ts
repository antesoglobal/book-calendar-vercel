// api/gmail.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

/**
 * GET /api/gmail
 *
 * Returns Gmail messages for the authenticated user.
 *
 * Query parameters:
 *   q           – Gmail search query (default: all messages, e.g. "from:someone@example.com")
 *   maxResults  – Max messages to return (default: 20, max: 500)
 *   pageToken   – Token to fetch the next page of results
 *   labelIds    – Comma-separated label IDs to filter by (e.g. "INBOX,UNREAD")
 *   full        – If "true", returns full message body; otherwise returns metadata only
 *
 * Required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 *
 * Note: The refresh token must have been granted the scope:
 *   https://www.googleapis.com/auth/gmail.readonly
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

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmailAddress {
  name: string | null;
  email: string | null;
}

interface MessageMetadata {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string | null;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  date: string | null;
  isUnread: boolean;
}

interface MessageFull extends MessageMetadata {
  bodyText: string | null;
  bodyHtml: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAddresses(headerValue: string): EmailAddress[] {
  if (!headerValue) return [];
  return headerValue.split(',').map((part) => {
    const match = part.trim().match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
    return {
      name: match?.[1]?.trim() || null,
      email: match?.[2]?.trim() || null,
    };
  });
}

function getHeader(headers: { name?: string | null; value?: string | null }[], name: string): string {
  return headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64(data: string): string {
  try {
    return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function extractParts(
  payload: any,
  mimeType: string,
): string {
  if (!payload) return '';

  // Direct body
  if (payload.mimeType === mimeType && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Recurse through parts
  for (const part of payload.parts || []) {
    const result = extractParts(part, mimeType);
    if (result) return result;
  }

  return '';
}

function buildMetadata(msg: any): MessageMetadata {
  const headers: { name?: string | null; value?: string | null }[] = msg.payload?.headers || [];
  const fromAddresses = parseAddresses(getHeader(headers, 'from'));
  const labelIds: string[] = msg.labelIds || [];

  return {
    id: msg.id,
    threadId: msg.threadId,
    labelIds,
    snippet: msg.snippet || '',
    subject: getHeader(headers, 'subject') || null,
    from: fromAddresses[0] || { name: null, email: null },
    to: parseAddresses(getHeader(headers, 'to')),
    cc: parseAddresses(getHeader(headers, 'cc')),
    date: getHeader(headers, 'date') || null,
    isUnread: labelIds.includes('UNREAD'),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const auth = getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const q = (req.query.q as string) || undefined;
    const maxResults = Math.min(parseInt((req.query.maxResults as string) || '20', 10), 500);
    const pageToken = (req.query.pageToken as string) || undefined;
    const labelIds = (req.query.labelIds as string)
      ? (req.query.labelIds as string).split(',').map((l) => l.trim())
      : undefined;
    const full = (req.query.full as string) === 'true';

    // Step 1: List matching message IDs
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q,
      maxResults,
      pageToken,
      labelIds,
    });

    const messageRefs = listRes.data.messages || [];
    const nextPageToken = listRes.data.nextPageToken || null;
    const resultSizeEstimate = listRes.data.resultSizeEstimate || 0;

    if (messageRefs.length === 0) {
      return res.status(200).json({
        count: 0,
        resultSizeEstimate,
        nextPageToken,
        messages: [],
      });
    }

    // Step 2: Fetch each message (metadata or full)
    const format = full ? 'full' : 'metadata';
    const metadataHeaders = ['Subject', 'From', 'To', 'Cc', 'Date'];

    const messageDetails = await Promise.all(
      messageRefs.map((ref) =>
        gmail.users.messages.get({
          userId: 'me',
          id: ref.id!,
          format,
          ...(format === 'metadata' ? { metadataHeaders } : {}),
        }),
      ),
    );

    const messages: MessageMetadata[] | MessageFull[] = messageDetails.map((detail) => {
      const msg = detail.data;
      const base = buildMetadata(msg);

      if (full) {
        return {
          ...base,
          bodyText: extractParts(msg.payload, 'text/plain'),
          bodyHtml: extractParts(msg.payload, 'text/html'),
        } as MessageFull;
      }

      return base;
    });

    return res.status(200).json({
      count: messages.length,
      resultSizeEstimate,
      nextPageToken,
      messages,
    });
  } catch (err: any) {
    console.error('❌ gmail error:', err);
    return res.status(500).json({
      error: 'Failed to fetch Gmail messages',
      detail: err.message,
    });
  }
}
