// api/search-hr.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { name, department } = req.query;

  const url = new URL("https://script.google.com/macros/s/AKfycbznshw60BVGRB5FCa9PZMfPb2pzEMGCPd1wNqpUk-FNLta1MQFAuHZ_-aNAp13PBajc/exec");
  if (name) url.searchParams.append("name", name as string);
  if (department) url.searchParams.append("department", department as string);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    res.status(200).json(data); // GPT-friendly
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch HR data", detail: err.message });
  }
}