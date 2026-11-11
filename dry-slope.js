const storageKey = "rangdee-assessment-v2";
const profileFields = ["name", "gender", "age", "weight", "height", "phone", "email"];
const agreementForm = document.querySelector("#agreement-form");
const agreementStatus = document.querySelector("#agreement-status");
const agreementButton = document.querySelector("#agreement-submit");

function readState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { profile: null, profileDraft: null, results: {} };
  } catch (error) {
    console.error("Could not read shared profile data.", error);
    return { profile: null, profileDraft: null, results: {} };
  }
}

let state = readState();

function storeState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error("Could not save shared profile data.", error);
    agreementStatus.dataset.state = "error";
    agreementStatus.textContent = "บันทึกข้อมูลในเบราว์เซอร์ไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บ";
    return false;
  }
}

function loadProfile() {
  const profile = { ...state.profile, ...state.profileDraft };
  profileFields.forEach((name) => {
    const field = agreementForm.elements.namedItem(name);
    if (field && profile[name] != null) field.value = profile[name];
  });
}

function createRecordId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateProfileDraft() {
  const profile = Object.fromEntries(profileFields.map((name) => [
    name,
    agreementForm.elements.namedItem(name).value,
  ]));
  state.profileDraft = {
    ...profile,
    recordId: state.profile?.recordId || state.profileDraft?.recordId,
  };
  storeState();
}

agreementForm.addEventListener("input", updateProfileDraft);
agreementForm.addEventListener("change", updateProfileDraft);

window.addEventListener("storage", (event) => {
  if (event.key !== storageKey) return;
  state = readState();
  loadProfile();
});

function getSheetsEndpoint() {
  const configuredUrl = window.APP_CONFIG?.googleSheetsUrl;
  if (!configuredUrl) return null;

  try {
    const endpoint = new URL(configuredUrl);
    if (
      endpoint.protocol !== "https:"
      || endpoint.hostname !== "script.google.com"
      || !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)
    ) {
      return null;
    }
    return endpoint.href;
  } catch {
    return null;
  }
}

function validatePhone() {
  const phoneField = agreementForm.elements.namedItem("phone");
  const phone = phoneField.value.trim();
  const digits = phone.replace(/\D/g, "").length;
  const valid = /^[+0-9() .-]{7,20}$/.test(phone) && digits >= 7 && digits <= 15;
  phoneField.setCustomValidity(valid ? "" : "กรุณากรอกเบอร์โทรศัพท์ 7–15 หลัก");
  return agreementForm.reportValidity();
}

agreementForm.elements.namedItem("phone").addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});

agreementForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validatePhone()) return;

  const endpoint = getSheetsEndpoint();
  if (!endpoint) {
    agreementStatus.dataset.state = "error";
    agreementStatus.textContent = "ยังไม่ได้ตั้งค่า Google Apps Script URL กรุณาตั้งค่า config.js ก่อนส่งข้อมูล";
    return;
  }

  const profile = Object.fromEntries(profileFields.map((name) => [
    name,
    agreementForm.elements.namedItem(name).value.trim(),
  ]));
  profile.age = Number(profile.age);
  profile.weight = Number(profile.weight);
  profile.height = Number(profile.height);
  const recordId = state.profile?.recordId || state.profileDraft?.recordId || createRecordId();
  state.profileDraft = { ...profile, recordId };
  if (!storeState()) return;

  agreementButton.disabled = true;
  agreementStatus.dataset.state = "";
  agreementStatus.textContent = "กำลังบันทึกการยอมรับข้อตกลง...";

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({
        stage: "agreement",
        recordId,
        consented: agreementForm.elements.namedItem("consented").checked,
        agreementAccepted: agreementForm.elements.namedItem("agreementAccepted").checked,
        profile,
      }),
    });
    agreementStatus.dataset.state = "sent";
    agreementStatus.textContent = "ส่งคำขอบันทึกข้อตกลง สร้าง PDF ใน Google Drive และส่งอีเมลพร้อมแนบไฟล์แล้ว ข้อมูลส่วนตัวจะเติมให้อัตโนมัติในหน้าแบบประเมิน ทั้งนี้เบราว์เซอร์ยืนยันผลไม่ได้ กรุณาตรวจสอบ Google Sheet โฟลเดอร์ Dry Slope และอีเมล";
  } catch (error) {
    console.error("Could not submit the Dry Slope agreement.", error);
    agreementStatus.dataset.state = "error";
    agreementStatus.textContent = "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง";
  } finally {
    agreementButton.disabled = false;
  }
});

loadProfile();
