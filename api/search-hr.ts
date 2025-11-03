// api/search-hr.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwzCF8KSk6t4NPufiL1m‑PV0GfHc2QCTB9qzh9GcJhR5BVm8kmia7csKX8VY1PpBgr0/exec';

function normalize(str: string): string {
  return str ? str.normalize("NFD").replace(/[\u0300‑\u036f]/g, "").toLowerCase() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { name = '', department = '' } = req.body || {};

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content‑Type': 'application/json' },
      body: JSON.stringify({ mode: 'ALL' })
    });

    const json = await response.json();

    console.log("📄 Raw data from GAS:", JSON.stringify(json, null, 2));
    const first = Array.isArray(json.results) && json.results.length > 0 ? json.results[0] : null;
    console.log("🔍 First record keys:", first ? Object.keys(first) : "no records");

    if (!Array.isArray(json.results)) {
      return res.status(500).json({ error: 'Invalid response format from GAS', raw: json });
    }

    const filtered = json.results.filter((record: any) => {
      // fallback key names
      const fullName = record.fullName ?? record["H\u1ed9 & T\u00ean"] ?? record["Ho & Ten"] ?? "";
      const dept = record.department ?? record["Ph\u00f2ng ban"] ?? record["Phong ban"] ?? "";

      return (!name || normalize(fullName).includes(normalize(name))) &&
        (!department || normalize(dept).includes(normalize(department)));
    });

    return res.status(200).json({ count: filtered.length, results: filtered });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to fetch HR data',
      detail: err.message
    });
  }
}