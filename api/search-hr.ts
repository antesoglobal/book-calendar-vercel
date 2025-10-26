// api/search-hr.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }
  
  const { name, department } = req.body || {};
  
  console.log("Search-HR called with:", name, department); // 👈 log để hiện trong Vercel
  
  // const url = new URL("https://script.google.com/macros/s/AKfycbyoCnffZV75cqBVjhDtkKD-zuAGx9_7v0geCLYaVpPn0WtwclY0g-I49IATH5GFh838/exec");
  // const url = new URL("https://script.google.com/macros/s/AKfycbyjEv7egzYsIwsBmzNd0VPKPH33mCXRhTYUMJIRUHbap7bHA4h_55NfgKb0IqvWm9sH/exec");
  const url = new URL("https://script.google.com/macros/s/AKfycbx0JuYi-5OpbbSLrzijL_fCa1hMewXn5ieMPxAjPY3DZ8qTBfXzMCxHOCeXrw-Ni-fS/exec");
  
  

  if (name) url.searchParams.append("name", name);
  if (department) url.searchParams.append("department", department);

  

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    res.status(200).json(data);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch HR data", detail: err.message });
  }
}

//
// 👇 Add this to test locally in terminal with `ts-node` or similar
//
async function testCall() {
  const testPayload = {
    name: "quynh",          // you can change this
    department: "media"     // optional
  };

  const response = await fetch("https://script.google.com/macros/s/AKfycbyoCnffZV75cqBVjhDtkKD-zuAGx9_7v0geCLYaVpPn0WtwclY0g-I49IATH5GFh838/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testPayload)
  });

  const result = await response.json();
  console.log("📄 HR Search Result:", result);
}

// uncomment this line if you want to run test from terminal
testCall();