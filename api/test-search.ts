async function testHRSearch() {
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

testHRSearch();

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