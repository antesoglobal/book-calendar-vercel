import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzxQ5VWbjnOh0iWAiPGIwjiX-wIj_4nrznidRtHQu4hxJ9oZGAIKAk9vD7_DgkvJhJmnQ/exec";

    const gscriptResponse = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const result = await gscriptResponse.json();
    res.status(200).json(result);
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to call Google Apps Script',
      detail: err.message,
    });
  }
}
