import type { VercelRequest, VercelResponse } from "@vercel/node";

const GAS_URL = "https://script.google.com/macros/s/AKfycbwzCF8KSk6t4NPufiL1m-PV0GfHc2QCTB9qzh9GcJhR5BVm8kmia7csKX8VY1PpBgr0/exec";

const normalize = (str: string = "") =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function filter(records: any[], name: string, department: string) {
  return records.filter((r) => {
    const matchName = name ? normalize(r["Họ & Tên"] || "").includes(normalize(name)) : true;
    const matchDept = department ? normalize(r["Phòng ban"] || "").includes(normalize(department)) : true;
    return matchName && matchDept;
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method is allowed." });
  }

  const { name = "", department = "" } = req.body || {};

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ALL", sheetName: "Human Resource" })
    });

    const raw = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      return res.status(500).json({ error: "Failed to parse JSON from GAS", raw });
    }

    const results = parsed.results || [];
    const filtered = filter(results, name, department);

    return res.status(200).json({
      count: filtered.length,
      results: filtered
    });

  } catch (err: any) {
    return res.status(500).json({ error: "GAS request failed", detail: err.message });
  }
}