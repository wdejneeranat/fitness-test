const tests = [
  {
    id: "reach",
    name: "FUNCTIONAL REACH TEST",
    subtitle: "ทดสอบความยืดหยุ่นและการทรงตัว",
    description: "ยืนมั่นคง แล้วยื่นแขนไปด้านหน้าให้ไกลที่สุดโดยไม่ก้าวเท้า",
    capacity: "Mobility และ dynamic balance",
    lowMayReflect: "การเคลื่อนไหวของข้อเท้า สะโพก ทรวงอก และไหล่ รวมถึงการถ่ายน้ำหนักและการควบคุมลำตัว",
    trainingGoal: "เคลื่อนไหวได้ดีขึ้นและคุมลำตัวระหว่างเอื้อม",
    measure: "ระยะเอื้อม",
    unit: "ซม.",
    image: "assets/forward-reach.jpg",
    imageAlt: "ภาพการ์ตูนทดสอบ Functional Reach",
    cutoff: "ชาย 18–54 ปี: แดง <30, เหลือง 30–40, เขียว >40 ซม. · หญิง 18–54 ปี: แดง <25, เหลือง 25–35, เขียว >35 ซม. · ชาย 55+ ปี: แดง <25, เหลือง 25–30, เขียว >30 ซม. · หญิง 55+ ปี: แดง <20, เหลือง 20–25, เขียว >25 ซม.",
  },
  {
    id: "sit-stand",
    name: "30-SECOND SIT-TO-STAND",
    subtitle: "ทดสอบความแข็งแรงของขาและช่วงล่าง",
    description: "นับจำนวนครั้งที่ลุกขึ้นยืนและนั่งลงจากเก้าอี้ภายใน 30 วินาที",
    capacity: "Lower-body strength/endurance",
    lowMayReflect: "ความแข็งแรงขาและสะโพก การควบคุม squat pattern และความทนทานการทำงาน",
    trainingGoal: "ลุก นั่ง ย่อ และออกแรงผ่านขาได้ดีขึ้น",
    measure: "จำนวนครั้ง",
    unit: "ครั้ง",
    image: "assets/sit-to-stand.jpg",
    imageAlt: "ภาพการ์ตูนทดสอบลุกนั่งเก้าอี้ 30 วินาที",
    cutoff: "ชาย 18–54 ปี: แดง <20, เหลือง 20–29, เขียว >30 ครั้ง · หญิง 18–54 ปี: แดง <18, เหลือง 18–25, เขียว >25 ครั้ง · ชาย 60+ ปี: แดง <14, เหลือง 14–20, เขียว >20 ครั้ง · หญิง 60+ ปี: แดง <12, เหลือง 12–17, เขียว >17 ครั้ง",
  },
  {
    id: "vertical-jump",
    name: "VERTICAL JUMP",
    subtitle: "ทดสอบพลังระเบิดช่วงล่าง",
    description: "วัดความสูงที่กระโดดขึ้นในแนวดิ่ง ลงพื้นอย่างนุ่มนวลและทรงตัวให้มั่นคง",
    capacity: "Lower-body power",
    lowMayReflect: "อัตราการออกแรง การถ่ายแรงผ่านขาและลำตัว การลงพื้น และแรงสัมพันธ์ต่อน้ำหนักตัว",
    trainingGoal: "สร้าง strength ก่อน แล้วพัฒนาแรงเร็วและ landing quality",
    measure: "ความสูงที่กระโดด",
    unit: "ซม.",
    image: "assets/vertical-jump.jpg",
    imageAlt: "ภาพการ์ตูนทดสอบ Vertical Jump",
    cutoff: "ชาย 15–45 ปี: แดง ≤30, เหลือง 50–60, เขียว >60 ซม. · หญิง 15–45 ปี: แดง ≤25, เหลือง 40–50, เขียว >50 ซม. · ชาย 45+ ปี: แดง ≤17, เหลือง 18–35, เขียว >35 ซม. · หญิง 45+ ปี: แดง ≤15, เหลือง 15–20, เขียว >25 ซม. · ชีตระบุช่วงทับซ้อนที่อายุ 45 ปี ระบบใช้เกณฑ์ 45+",
  },
  {
    id: "dead-hang",
    name: "DEAD HANG",
    subtitle: "ทดสอบความแข็งแรงของแรงจับและช่วงบน",
    description: "จับบาร์ที่มั่นคงและห้อยตัวค้างไว้ จับเวลาที่ทำได้โดยไม่ฝืนอาการเจ็บ",
    capacity: "Upper-body capacity",
    lowMayReflect: "Grip endurance, scapular control, shoulder capacity และ relative upper-body strength",
    trainingGoal: "สร้างแรงดึง–ดัน–จับ และความมั่นคงของไหล่",
    measure: "เวลาที่ทำได้",
    unit: "วินาที",
    image: "assets/dead-hang.jpg",
    imageAlt: "ภาพการ์ตูนทดสอบ Dead Hang",
    cutoff: "ชายอายุไม่เกิน 50 ปี: แดง <30, เหลือง 30–60, เขียว >60 วินาที · หญิงอายุไม่เกิน 50 ปี: แดง <20, เหลือง 20–40, เขียว >40 วินาที · อายุ 50+ ปี ลดเกณฑ์ลง 10 วินาทีทุก 10 ปีที่เพิ่ม",
  },
];

const testOrder = ["reach", "dead-hang", "sit-stand", "vertical-jump"];
tests.sort((first, second) => testOrder.indexOf(first.id) - testOrder.indexOf(second.id));

const levels = {
  1: { label: "แดง · ควรเริ่มเสริม", className: "level-red" },
  2: { label: "เหลือง · พอใช้/พัฒนาได้", className: "level-yellow" },
  3: { label: "เขียว · ดี", className: "level-green" },
};

const actionRules = [
  {
    id: "red-two",
    matches: (counts) => counts.red >= 2,
    title: "สีแดง 2 ฐานขึ้นไป",
    summary: "ควรเริ่มจากการขยับข้อต่อให้ดีขึ้นและเรียนรู้พื้นฐานการเคลื่อนไหว ก่อนพัฒนาความแข็งแรง",
    recommendations: [
      "แนะนำพบนักกายภาพบำบัดเพื่อคัดกรองหรือประเมินร่างกายเพิ่มเติม",
      "เริ่มจาก Stretching/Mobility และ Movement foundation เช่น Squat, Hip hinge, Push หรือ Pull 1–2 ท่า",
    ],
  },
  {
    id: "red-one",
    matches: (counts) => counts.red === 1,
    title: "สีแดง 1 ฐาน",
    summary: "ภาพรวมทำได้ค่อนข้างดี แต่ยังมีพื้นฐานสมรรถภาพที่พัฒนาได้ เพื่อให้เคลื่อนไหวและออกกำลังกายได้ดีขึ้น",
    recommendations: [
      "ฝึก Movement foundation ด้วยน้ำหนักตัว เวท หรือยางยืด 1–2 ท่า และเรียนรู้การสังเกตความล้า (RPE 4–5/10)",
      "สะสมกิจกรรมทางกายความหนักปานกลางประมาณ 150 นาทีต่อสัปดาห์ และฝึกแรงต้านอย่างน้อย 2 วันต่อสัปดาห์",
    ],
  },
  {
    id: "yellow-two",
    matches: (counts) => counts.yellow >= 2,
    title: "สีเหลือง 2 ฐานขึ้นไป",
    summary: "พื้นฐานมาดีแล้ว สามารถต่อยอดความแข็งแรงและพัฒนา Performance ให้เชื่อมกับกิจกรรมที่สนใจ",
    recommendations: [
      "ทบทวนทักษะ Squat, Hip hinge, Push และ Pull เพื่อเลือกแนวทางฝึกที่เหมาะสม",
      "ต่อยอดการฝึกแรงต้าน เช่น Hypertrophy, Strength หรือ Strength endurance และเลือกใช้เครื่องหรือ Free weight ตามเป้าหมาย",
    ],
  },
  {
    id: "green-two",
    matches: (counts) => counts.green >= 2,
    title: "สีเขียว 2 ฐานขึ้นไป",
    summary: "มีพื้นฐานการเคลื่อนไหวและความแข็งแรงที่ดี สามารถต่อยอดสู่ Performance ตามกิจกรรมหรือกีฬาที่สนใจ",
    recommendations: [
      "เพิ่มความท้าทายด้วย Velocity-based, Tempo, Speed-strength หรือ Strength-speed training",
      "พิจารณาฝึก Agility หรือ Plyometric และพัฒนาสู่ Performance ของกิจกรรมหรือกีฬาที่ต้องการ",
    ],
  },
];

const storageKey = "rangdee-assessment-v2";
const profileForm = document.querySelector("#profile-form");
const testGrid = document.querySelector("#test-grid");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const resultsSection = document.querySelector("#results");
const profileSaveButton = document.querySelector("#profile-save-button");
const profileSheetStatus = document.querySelector("#profile-sheet-status");
const resultsSheetStatus = document.querySelector("#results-sheet-status");
const resultsButton = document.querySelector("#results-button");

function readState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { profile: null, results: {} };
  } catch (error) {
    console.error("Could not read saved assessment data.", error);
    return { profile: null, results: {} };
  }
}

let state = readState();

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.error("Could not save assessment data.", error);
    window.alert("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบพื้นที่จัดเก็บของเบราว์เซอร์");
  }
}

function renderTests() {
  testGrid.innerHTML = tests.map((test, index) => {
    const result = state.results[test.id] || {};
    return `
      <article class="test-card" id="station-${test.id}">
        <div class="test-card-header">
          <img class="test-art" src="${test.image}" alt="${test.imageAlt}" />
          <span class="test-number">0${index + 1}</span>
          <div><h3 class="test-name">${test.name}</h3><p class="test-subtitle">${test.subtitle}</p></div>
        </div>
        <p class="test-description">${test.description}</p>
        <div class="test-measure">
          <label for="measure-${test.id}">${test.measure}</label>
          <span class="measure-input-wrap"><input id="measure-${test.id}" type="number" min="0" max="100000" step="${test.id === "sit-stand" ? "1" : "any"}" inputmode="decimal" placeholder="—" value="${escapeAttribute(result.measure ?? "")}" aria-label="${test.measure} (${test.unit})" /><span>${test.unit}</span></span>
        </div>
        <p class="test-cutoff">${test.cutoff}</p>
        ${test.id === "vertical-jump" ? '<p class="test-warning">ผู้สูงอายุ: ชีตแนะนำให้พิจารณา Sit-to-Stand Power หรือ Step-up แทน และไม่ใช้ Jump เป็นฐานหลักโดยไม่ผ่านการคัดกรอง</p>' : ""}
        <div class="assessment-result" id="classification-${test.id}" aria-live="polite"></div>
        <div class="test-context"><p><strong>สมรรถภาพหลัก:</strong> ${test.capacity}</p><p><strong>ผลต่ำอาจสะท้อน:</strong> ${test.lowMayReflect}</p><p><strong>เป้าหมายการฝึก:</strong> ${test.trainingGoal}</p></div>
      </article>`;
  }).join("");

  testGrid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", (event) => {
      const card = event.target.closest(".test-card");
      const id = card.id.replace("station-", "");
      state.results[id] = { ...state.results[id], measure: event.target.value };
      saveState();
      updateClassification(tests.find((test) => test.id === id), card);
      updateProgress();
    });
  });
  tests.forEach((test) => updateClassification(test, document.querySelector(`#station-${test.id}`)));
  updateProgress();
}

function getApplicableRanges(test, profile) {
  if (!profile || !profile.age || !profile.gender) return { error: "กรุณาบันทึกอายุและเพศเพื่อใช้เกณฑ์ตามกลุ่ม" };
  const age = Number(profile.age);
  const isMale = profile.gender === "ชาย";
  const isFemale = profile.gender === "หญิง";
  if (!isMale && !isFemale) return { error: "ชีตค่า Cut-off ยังไม่ได้ระบุเกณฑ์สำหรับเพศที่เลือก" };

  if (test.id === "reach") {
    if (age < 18) return { error: "ชีตค่า Cut-off ไม่ได้ระบุเกณฑ์ Functional Reach สำหรับอายุต่ำกว่า 18 ปี" };
    const [redMax, yellowMax] = age <= 54
      ? (isMale ? [30, 40] : [25, 35])
      : (isMale ? [25, 30] : [20, 25]);
    return { ranges: [
      { level: 1, max: redMax, maxInclusive: false },
      { level: 2, min: redMax, max: yellowMax },
      { level: 3, min: yellowMax, minInclusive: false },
    ] };
  }

  if (test.id === "dead-hang") {
    if (age < 18) return { error: "ชีตค่า Cut-off ระบุเกณฑ์ Dead Hang สำหรับวัยผู้ใหญ่เท่านั้น" };
    const adjustment = age > 50 ? Math.floor((age - 50) / 10) * 10 : 0;
    const redLimit = (isMale ? 30 : 20) - adjustment;
    const yellowLimit = (isMale ? 60 : 40) - adjustment;
    return { ranges: [
      { level: 1, max: redLimit, maxInclusive: false },
      { level: 2, min: redLimit, max: yellowLimit },
      { level: 3, min: yellowLimit, minInclusive: false },
    ] };
  }

  if (test.id === "sit-stand") {
    let redLimit;
    let yellowLimit;
    if (age >= 18 && age <= 54) {
      [redLimit, yellowLimit] = isMale ? [20, 29] : [18, 25];
    } else if (age >= 60) {
      [redLimit, yellowLimit] = isMale ? [14, 20] : [12, 17];
    } else {
      return { error: "ชีตค่า Cut-off ไม่ได้ระบุเกณฑ์ Sit-to-Stand สำหรับช่วงอายุนี้" };
    }
    return { ranges: [
      { level: 1, max: redLimit, maxInclusive: false },
      { level: 2, min: redLimit, max: yellowLimit },
      { level: 3, min: age <= 54 && isMale ? 30 : yellowLimit, minInclusive: false },
    ] };
  }

  if (test.id === "vertical-jump") {
    if (age < 15) return { error: "ชีตค่า Cut-off ไม่ได้ระบุเกณฑ์ Vertical Jump สำหรับอายุต่ำกว่า 15 ปี" };
    if (age >= 60) return { error: "สำหรับผู้สูงอายุ ชีตแนะนำ Sit-to-Stand Power หรือ Step-up และไม่แนะนำ Jump เป็นฐานหลัก" };
    const olderGroup = age >= 45;
    if (!olderGroup) {
      if (isMale) return { ranges: [
        { level: 1, max: 30 },
        { level: 2, min: 50, max: 60 },
        { level: 3, min: 60, minInclusive: false },
      ] };
      return { ranges: [
        { level: 1, max: 25 },
        { level: 2, min: 40, max: 50 },
        { level: 3, min: 50, minInclusive: false },
      ] };
    }
    if (isMale) return { ranges: [
      { level: 1, max: 17 },
      { level: 2, min: 18, max: 35 },
      { level: 3, min: 35, minInclusive: false },
    ] };
    return { ranges: [
      { level: 1, max: 15 },
      { level: 2, min: 15, minInclusive: false, max: 20 },
      { level: 3, min: 25, minInclusive: false },
    ] };
  }

  return { error: "ไม่พบเกณฑ์สำหรับฐานทดสอบนี้" };
}

function classifyTest(test, measure, profile) {
  if (measure === "" || measure == null || !Number.isFinite(Number(measure))) {
    return { level: 0, message: "กรอกค่าที่วัดเพื่อแปลผลตามเกณฑ์" };
  }
  const applicable = getApplicableRanges(test, profile);
  if (applicable.error) return { level: 0, message: applicable.error };
  const value = Number(measure);
  if (test.id === "sit-stand" && !Number.isInteger(value)) {
    return { level: 0, message: "จำนวนครั้งต้องเป็นจำนวนเต็ม" };
  }
  const matched = applicable.ranges.find((range) => (
    (range.min == null || value > range.min || (range.minInclusive !== false && value === range.min))
    && (range.max == null || value < range.max || (range.maxInclusive !== false && value === range.max))
  ));
  if (!matched) return { level: 0, message: "ค่าที่วัดอยู่นอกช่วงที่ระบุในชีตค่า Cut-off จึงไม่จัดระดับ" };
  return { level: matched.level, message: levels[matched.level].label };
}

function updateClassification(test, card) {
  const result = state.results[test.id] || {};
  const classification = classifyTest(test, result.measure, state.profile);
  const target = card.querySelector(`#classification-${test.id}`);
  const level = levels[classification.level];
  target.className = `assessment-result ${level ? level.className : "level-unavailable"}`;
  target.textContent = classification.message;
  result.level = classification.level;
  state.results[test.id] = result;
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function updateProgress() {
  const completed = tests.filter((test) => state.results[test.id]?.measure !== "" && state.results[test.id]?.measure != null).length;
  progressLabel.textContent = `กรอกค่าที่วัดแล้ว ${completed} จาก 4 ฐาน`;
  progressBar.style.width = `${completed * 25}%`;
}

function loadProfile() {
  if (!state.profile) return;
  Object.entries(state.profile).forEach(([name, value]) => {
    if (name === "recordId" || name === "consented") return;
    const field = profileForm.elements.namedItem(name);
    if (field) field.value = value;
  });
  profileForm.elements.namedItem("consented").checked = Boolean(state.profile.consented);
}

function validateProfile() {
  const phoneField = profileForm.elements.namedItem("phone");
  const phone = phoneField.value.trim();
  const digits = phone.replace(/\D/g, "").length;
  const validPhone = /^[+0-9() .-]{7,20}$/.test(phone) && digits >= 7 && digits <= 15;
  phoneField.setCustomValidity(validPhone ? "" : "กรุณากรอกเบอร์โทรศัพท์ 7–15 หลัก");
  return profileForm.reportValidity();
}

profileForm.elements.namedItem("phone").addEventListener("input", (event) => {
  event.currentTarget.setCustomValidity("");
});

function createRecordId() {
  return globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getProfileFormValues() {
  const values = Object.fromEntries(new FormData(profileForm).entries());
  delete values.consented;
  return values;
}

function hasUnsavedProfileChanges() {
  if (!state.profile) return true;
  const currentProfile = getProfileFormValues();
  return ["name", "gender", "age", "weight", "height", "phone", "email"]
    .some((field) => String(state.profile[field] ?? "") !== String(currentProfile[field] ?? ""));
}

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateProfile()) return;
  state.profile = {
    ...getProfileFormValues(),
    recordId: state.profile?.recordId || createRecordId(),
    consented: true,
  };
  saveState();
  renderTests();
  await submitToSheet("profile");
  document.querySelector("#tests").scrollIntoView({ behavior: "smooth" });
});

function renderChart() {
  const width = 370;
  const height = 280;
  const center = { x: width / 2, y: 137 };
  const radius = 83;
  const angles = tests.map((_, index) => -Math.PI / 2 + (Math.PI * 2 * index) / tests.length);
  const point = (angle, distance) => ({
    x: center.x + Math.cos(angle) * distance,
    y: center.y + Math.sin(angle) * distance,
  });
  const polygonPoints = (distance) => angles.map((angle) => {
    const current = point(angle, distance);
    return `${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }).join(" ");
  const values = tests.map((test) => Number(state.results[test.id]?.level || 0));
  const resultPoints = angles.map((angle, index) => {
    const current = point(angle, radius * values[index] / 3);
    return `${current.x.toFixed(1)},${current.y.toFixed(1)}`;
  }).join(" ");
  const labels = tests.map((test, index) => {
    const current = point(angles[index], radius + 30);
    const anchor = Math.abs(current.x - center.x) < 10 ? "middle" : current.x < center.x ? "end" : "start";
    const shortName = ["Forward reach", "Dead hang", "Sit-to-stand", "Vertical jump"][index];
    return `<text x="${current.x.toFixed(1)}" y="${current.y.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="middle" class="radar-label">${shortName}</text>`;
  }).join("");
  const dots = angles.map((angle, index) => {
    if (!values[index]) return "";
    const current = point(angle, radius * values[index] / 3);
    return `<circle cx="${current.x.toFixed(1)}" cy="${current.y.toFixed(1)}" r="4" fill="#fff" stroke="#4f8d62" stroke-width="2"/>`;
  }).join("");
  document.querySelector("#radar-chart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="กราฟเรดาร์แสดงคะแนนความแข็งแรง 4 ฐาน จากระดับ 1 ถึง 3">
      ${[1, 2, 3].map((level) => `<polygon points="${polygonPoints(radius * level / 3)}" fill="none" stroke="#e6eae2" stroke-width="1"/>`).join("")}
      ${angles.map((angle) => { const end = point(angle, radius); return `<line x1="${center.x}" y1="${center.y}" x2="${end.x.toFixed(1)}" y2="${end.y.toFixed(1)}" stroke="#e6eae2"/>`; }).join("")}
      ${[1, 2, 3].map((level) => `<text x="${center.x + 5}" y="${center.y - radius * level / 3 - 3}" class="radar-scale">${level}</text>`).join("")}
      ${values.some(Boolean) ? `<polygon points="${resultPoints}" fill="#93b983" fill-opacity=".29" stroke="#4f8d62" stroke-width="2"/>${dots}` : ""}
      ${labels}
    </svg>`;
}

function renderAdvice() {
  const counts = { red: 0, yellow: 0, green: 0 };
  tests.forEach((test) => {
    const level = Number(state.results[test.id]?.level || 0);
    if (level === 1) counts.red += 1;
    if (level === 2) counts.yellow += 1;
    if (level === 3) counts.green += 1;
  });
  const action = actionRules.find((rule) => rule.matches(counts));
  const adviceList = document.querySelector("#advice-list");
  const adviceIntro = document.querySelector("#advice-intro");
  adviceIntro.textContent = "แนวทางตามจำนวนผลสีแดง เหลือง และเขียว ตามชีตแนวทางการแปลผล";
  adviceList.innerHTML = action
    ? `<div class="action-summary"><h4>${action.title}</h4><p>${action.summary}</p><ul>${action.recommendations.map((item) => `<li>${item}</li>`).join("")}</ul></div>`
    : `<p class="empty-advice">ผลยังไม่เข้าเงื่อนไข Action Rule ที่ระบุในชีต ให้ใช้ผลรายฐานตั้งเป้าหมายร่วมกับผู้ดูแลการทดสอบ</p>`;

  const resultRows = tests.map((test) => {
    const result = state.results[test.id] || {};
    const level = levels[Number(result.level)];
    const measure = result.measure === "" || result.measure == null
      ? "—"
      : `${escapeAttribute(result.measure)} ${test.unit}`;
    return `<div class="advice-item"><span class="advice-index">${level ? Number(result.level) : "—"}</span><div><h4>${test.name} · ${measure}</h4><p>${level ? level.label : "ไม่มีระดับสี"}${level ? "" : ` · ${classifyTest(test, result.measure, state.profile).message}`}</p><p><strong>สมรรถภาพหลัก:</strong> ${test.capacity}</p><p><strong>ผลต่ำอาจสะท้อน:</strong> ${test.lowMayReflect}</p><p><strong>เป้าหมายการฝึก:</strong> ${test.trainingGoal}</p></div></div>`;
  }).join("");
  adviceList.insertAdjacentHTML("beforeend", `<div class="result-breakdown"><h4>ผลรายฐาน</h4>${resultRows}</div>`);
}

function showResults() {
  if (!validateProfile()) {
    window.alert("กรุณากรอกข้อมูลส่วนตัว เบอร์โทรศัพท์ และอีเมลให้ครบก่อนดูสรุปผล");
    profileForm.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (!state.profile) {
    window.alert("กรุณาบันทึกข้อมูลผู้เข้ารับการทดสอบก่อนดูสรุปผล");
    profileForm.scrollIntoView({ behavior: "smooth", block: "center" });
    profileForm.elements.namedItem("name").focus({ preventScroll: true });
    return;
  }
  if (hasUnsavedProfileChanges()) {
    window.alert("มีการแก้ไขข้อมูลส่วนตัว กรุณากดบันทึกข้อมูลก่อนดูสรุปผล");
    profileForm.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  if (tests.some((test) => !document.querySelector(`#measure-${test.id}`).value)) {
    const firstIncomplete = tests.find((test) => !document.querySelector(`#measure-${test.id}`).value);
    window.alert("กรุณากรอกค่าที่วัดให้ครบทั้ง 4 ฐานก่อนดูสรุปผล");
    document.querySelector(`#station-${firstIncomplete.id}`).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const invalidMeasure = tests.find((test) => !document.querySelector(`#measure-${test.id}`).validity.valid);
  if (invalidMeasure) {
    const input = document.querySelector(`#measure-${invalidMeasure.id}`);
    input.reportValidity();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  tests.forEach((test) => updateClassification(test, document.querySelector(`#station-${test.id}`)));
  renderChart();
  renderAdvice();
  document.querySelector("#result-profile").textContent =
    `${state.profile.name} · อายุ ${state.profile.age} ปี · ${state.profile.weight} กก. · ${state.profile.height} ซม.`;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

resultsButton.addEventListener("click", showResults);
const pdfSubmitButton = document.querySelector("#print-button");
pdfSubmitButton.addEventListener("click", () => {
  void submitToSheet("results");
});
document.querySelector("#edit-results").addEventListener("click", () => document.querySelector("#tests").scrollIntoView({ behavior: "smooth" }));

function getSheetsEndpoint() {
  const configuredUrl = window.APP_CONFIG?.googleSheetsUrl;
  if (!configuredUrl) return null;

  try {
    const endpoint = new URL(configuredUrl);
    if (
      endpoint.protocol !== "https:" ||
      endpoint.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)
    ) {
      return null;
    }
    return endpoint.href;
  } catch {
    return null;
  }
}

function buildSheetPayload(stage) {
  const profile = state.profile;
  return {
    stage,
    recordId: profile.recordId,
    consented: Boolean(profile.consented),
    ...(stage === "profile" ? { profile: {
      name: profile.name.trim(),
      gender: profile.gender,
      age: Number(profile.age),
      weight: Number(profile.weight),
      height: Number(profile.height),
      phone: profile.phone.trim(),
      email: profile.email.trim(),
    } } : {}),
    ...(stage === "results" ? { results: Object.fromEntries(tests.map((test) => {
      const result = state.results[test.id];
      return [test.id, {
        measure: result.measure === "" || result.measure == null ? null : Number(result.measure),
        level: Number(result.level) || null,
      }];
    })) } : {}),
  };
}

async function submitToSheet(stage) {
  const status = stage === "profile" ? profileSheetStatus : resultsSheetStatus;
  const button = stage === "profile" ? profileSaveButton : pdfSubmitButton;
  const endpoint = getSheetsEndpoint();
  if (!endpoint) {
    status.dataset.state = "error";
    status.textContent = "ยังไม่ได้ตั้งค่า Google Apps Script URL กรุณาตั้งค่า config.js ก่อนส่งข้อมูล";
    return;
  }

  button.disabled = true;
  status.dataset.state = "";
  status.textContent = stage === "profile"
    ? "กำลังบันทึกข้อมูล..."
    : "กำลังสร้าง PDF บันทึกลง Google Drive และส่งอีเมล...";

  try {
    await fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(buildSheetPayload(stage)),
    });
    status.dataset.state = "sent";
    status.textContent = stage === "profile"
      ? "ส่งคำขอบันทึกข้อมูลแล้ว แต่เบราว์เซอร์ยืนยันผลจาก Google Sheet ไม่ได้"
      : `ส่งคำขอบันทึกผล สร้างไฟล์ PDF ใน Drive และส่งอีเมลไปยัง ${state.profile.email} แล้ว แต่เบราว์เซอร์ยืนยันผลไม่ได้ กรุณาตรวจสอบอีเมลและโฟลเดอร์ Drive`;
  } catch (error) {
    console.error("Could not send assessment to Google Sheets.", error);
    status.dataset.state = "error";
    status.textContent = "ส่งข้อมูลไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง";
  } finally {
    button.disabled = false;
  }
}

loadProfile();
renderTests();
