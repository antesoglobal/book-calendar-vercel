async function fetchAllHRRecordsFromGAS(): Promise<any[]> {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbwzCF8KSk6t4NPufiL1m-PV0GfHc2QCTB9qzh9GcJhR5BVm8kmia7csKX8VY1PpBgr0/exec"; // 👈 THAY LINK CỦA BẠN

  const payload = {
    mode: "ALL",
    sheetName: "Human Resource"
  };

  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    // console.log("📄 Raw response:");
    // console.log(raw);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      console.error("❌ Failed to parse JSON:", e.message);
      return [];
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      console.error("❌ Missing or invalid 'results' field");
      return [];
    }

    console.log("✅ Total records fetched:", parsed.results.length);
    return parsed.results;

  } catch (err: any) {
    console.error("❌ Error fetching GAS data:", err.message);
    return [];
  }
}

function filterRecords(records: any[], name: string, department: string) {
  const normalize = (str: string = "") =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  return records.filter((r) => {
    const matchesName = name ? normalize(r["Họ & Tên"] || "").includes(normalize(name)) : true;
    const matchesDept = department ? normalize(r["Phòng ban"] || "").includes(normalize(department)) : true;
    return matchesName && matchesDept;
  });
}

async function run() {
  const allRecords = await fetchAllHRRecordsFromGAS();

  const searchName = "Quỳnh";        // 👈 thay đổi để test
  const searchDept = "";      // 👈 hoặc để "" nếu chỉ tìm theo tên

  const filtered = filterRecords(allRecords, searchName, searchDept);

  console.log(`🎯 Found ${filtered.length} matching records`);
  console.log(JSON.stringify(filtered, null, 2));
}

run();



/* async function testHRSearch() {
  const payload = {
    name: "Cúc",  // 👈 Bạn có thể đổi tên ở đây
    department: ""
  };

//   const url = "https://script.google.com/macros/s/AKfycbyjEv7egzYsIwsBmzNd0VPKPH33mCXRhTYUMJIRUHbap7bHA4h_55NfgKb0IqvWm9sH/exec";
  const url = "https://script.google.com/macros/s/AKfycbx0JuYi-5OpbbSLrzijL_fCa1hMewXn5ieMPxAjPY3DZ8qTBfXzMCxHOCeXrw-Ni-fS/exec";

  console.log("📤 Sending POST to:", url);
  console.log("🧾 Payload:", payload);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log("📄 Raw response text:");
    console.log(rawText);

    try {
      const result = JSON.parse(rawText);
      console.log("✅ Parsed JSON:");
      console.log(JSON.stringify(result, null, 2));
    } catch (jsonErr: any) {
      console.error("❌ Failed to parse JSON:", jsonErr.message);
    }

  } catch (networkErr: any) {
    console.error("❌ Network error:", networkErr.message);
  }
}

testHRSearch(); */

/* async function testGetAllHRDataFromGAS() {
  const url = "https://script.google.com/macros/s/AKfycbw56VfthtnBI3J4xb6CooELTJC09-d7ZZDeCweWEVJE-97zu6l62WRuhFxVrMNqOYep/exec"; // 👈 Thay bằng link thật

  const payload = {
    mode: "ALL"
  };

  console.log("📤 Sending request to GAS with payload:", payload);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const rawText = await response.text();
    console.log("📄 Raw response text:");
    console.log(rawText);

    try {
      const result = JSON.parse(rawText);
      console.log("✅ Parsed result:");
      console.log(JSON.stringify(result, null, 2));
    } catch (parseErr: any) {
      console.error("❌ Failed to parse JSON:", parseErr.message);
    }

  } catch (err: any) {
    console.error("❌ Network error:", err.message);
  }
}

testGetAllHRDataFromGAS(); */