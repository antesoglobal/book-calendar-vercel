// api/search-hr.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwzCF8KSk6t4NPufiL1m-PV0GfHc2QCTB9qzh9GcJhR5BVm8kmia7csKX8VY1PpBgr0/exec';

function normalize(str: string): string {
  return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { name = '', department = '' } = req.body || {};

  try {
    // Gửi yêu cầu lấy toàn bộ data từ GAS
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'ALL' })
    });

    const json = await response.json();
    // const raw = await response.text();
    console.log("📄 Raw response:");
    console.log(json);


    if (!Array.isArray(json.results)) {
      return res.status(500).json({ error: 'Invalid response format from GAS' });
    }

    // Lọc lại theo name / department
    const filtered = json.results.filter((record: any) => {
      const matchName = name ? normalize(record.fullName).includes(normalize(name)) : true;
      const matchDept = department ? normalize(record.department).includes(normalize(department)) : true;
      return matchName && matchDept;
    });

    return res.status(200).json({ count: filtered.length, results: filtered });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Failed to fetch HR data',
      detail: err.message
    });
  }
}