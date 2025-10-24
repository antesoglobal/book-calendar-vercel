// api/search-hr.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }
  
  const { name, department } = req.body || {};
  
  console.log("Search-HR called with:", name, department); // 👈 log để hiện trong Vercel
  
  try {
    const response = await fetch("https://script.google.com/macros/s/AKfycbyoCnffZV75cqBVjhDtkKD-zuAGx9_7v0geCLYaVpPn0WtwclY0g-I49IATH5GFh838/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, department })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`GAS Error ${response.status}: ${text}`);
    }

    const data = await response.json();
    res.status(200).json(data);

  } catch (err: any) {
    console.error("Search-HR failed:", err.message);
    res.status(500).json({ error: "Failed to fetch HR data", detail: err.message });
  }
  
  //const url = new URL("https://script.google.com/macros/s/AKfycbyoCnffZV75cqBVjhDtkKD-zuAGx9_7v0geCLYaVpPn0WtwclY0g-I49IATH5GFh838/exec");

  //if (name) url.searchParams.append("name", name);
  //if (department) url.searchParams.append("department", department);

  

  //try {
//    const response = await fetch(url.toString());
  //  const data = await response.json();
//    res.status(200).json(data);
//  } catch (err: any) {
  //  res.status(500).json({ error: "Failed to fetch HR data", detail: err.message });
  //}
}