const tests = [
  {
    id: "reach",
    name: "FUNCTION REACH TEST",
    subtitle: "การเอื้อมแขนไปด้านหน้า",
    description: "ประเมินการทรงตัวและระยะการเคลื่อนไหว โดยยืนมั่นคงแล้วเอื้อมแขนไปด้านหน้า",
    measure: "ระยะเอื้อม",
    unit: "ซม.",
    advice: "ฝึกยืนทรงตัวใกล้ผนัง แล้วยื่นแขนไปด้านหน้าอย่างช้า ๆ 8–10 ครั้งต่อข้าง เสริมด้วยท่า heel-to-toe balance เพื่อพัฒนาการทรงตัว",
  },
  {
    id: "sit-stand",
    name: "30 SEC SIT TO STAND",
    subtitle: "ลุกนั่งเก้าอี้ใน 30 วินาที",
    description: "นับจำนวนครั้งที่ลุกขึ้นยืนและนั่งลงจากเก้าอี้ได้อย่างปลอดภัยภายใน 30 วินาที",
    measure: "จำนวนครั้ง",
    unit: "ครั้ง",
    advice: "ฝึกลุกนั่งจากเก้าอี้ที่มั่นคง 2–3 เซต เซตละ 8–12 ครั้ง พักระหว่างเซต และใช้มือช่วยพยุงได้หากจำเป็น",
  },
  {
    id: "board-jump",
    name: "BOARD JUMP",
    subtitle: "กระโดดไปข้างหน้า",
    description: "วัดระยะกระโดดไปข้างหน้าจากจุดเริ่มต้น ลงพื้นด้วยเข่างอและทรงตัวให้มั่นคง",
    measure: "ระยะกระโดด",
    unit: "ซม.",
    advice: "เริ่มจากฝึก squat และ calf raise เพื่อเสริมกำลังขา จากนั้นฝึกกระโดดระยะสั้นบนพื้นไม่ลื่น เน้นลงพื้นเบา ๆ และมั่นคง",
  },
  {
    id: "dead-hang",
    name: "DEADHANG CHALLENGE",
    subtitle: "ห้อยตัวบนบาร์",
    description: "จับบาร์ที่มั่นคงแล้วห้อยตัวค้างไว้ วัดเวลาที่ทำได้โดยไม่ฝืนอาการเจ็บ",
    measure: "เวลาที่ทำได้",
    unit: "วินาที",
    advice: "เสริมแรงจับด้วยการบีบลูกบอลนุ่ม ค้างครั้งละ 10–20 วินาที และฝึกห้อยตัวแบบลงน้ำหนักบางส่วนโดยให้เท้าแตะพื้น",
  },
];

const levels = [
  { value: "1", label: "น้อย", className: "level-red" },
  { value: "2", label: "ปานกลาง", className: "level-yellow" },
  { value: "3", label: "มาก", className: "level-green" },
];

const storageKey = "rangdee-assessment-v1";
const profileForm = document.querySelector("#profile-form");
const testGrid = document.querySelector("#test-grid");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const resultsSection = document.querySelector("#results");

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
    const choices = levels.map((level) => `
      <label class="level-option ${level.className}">
        <input type="radio" name="level-${test.id}" value="${level.value}" ${result.level === level.value ? "checked" : ""} aria-label="${level.label}" />
        <span>${level.value} ${level.label}</span>
      </label>`).join("");
    return `
      <article class="test-card" id="station-${test.id}">
        <div class="test-card-header">
          <span class="test-number">0${index + 1}</span>
          <div><h3 class="test-name">${test.name}</h3><p class="test-subtitle">${test.subtitle}</p></div>
        </div>
        <p class="test-description">${test.description}</p>
        <div class="test-measure">
          <label for="measure-${test.id}">${test.measure}</label>
          <span class="measure-input-wrap"><input id="measure-${test.id}" type="number" min="0" step="any" inputmode="decimal" placeholder="—" value="${escapeAttribute(result.measure ?? "")}" aria-label="${test.measure} (${test.unit})" /><span>${test.unit}</span></span>
        </div>
        <div class="level-picker" role="radiogroup" aria-label="ระดับผลทดสอบ ${test.name}">${choices}</div>
      </article>`;
  }).join("");

  testGrid.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", (event) => {
      const card = event.target.closest(".test-card");
      const id = card.id.replace("station-", "");
      state.results[id] = {
        ...state.results[id],
        level: card.querySelector(`input[name="level-${id}"]:checked`)?.value || "",
        measure: card.querySelector(`#measure-${id}`).value,
      };
      saveState();
      updateProgress();
    });
    if (input.type === "number") {
      input.addEventListener("input", (event) => {
        const card = event.target.closest(".test-card");
        const id = card.id.replace("station-", "");
        state.results[id] = {
          ...state.results[id],
          measure: event.target.value,
          level: card.querySelector(`input[name="level-${id}"]:checked`)?.value || "",
        };
        saveState();
      });
    }
  });
  updateProgress();
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function updateProgress() {
  const completed = tests.filter((test) => state.results[test.id]?.level).length;
  progressLabel.textContent = `บันทึกแล้ว ${completed} จาก 4 ฐาน`;
  progressBar.style.width = `${completed * 25}%`;
}

function loadProfile() {
  if (!state.profile) return;
  Object.entries(state.profile).forEach(([name, value]) => {
    const field = profileForm.elements.namedItem(name);
    if (field) field.value = value;
  });
}

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!profileForm.reportValidity()) return;
  const formData = new FormData(profileForm);
  state.profile = Object.fromEntries(formData.entries());
  saveState();
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
    const shortName = ["Reach test", "Sit to stand", "Board jump", "Dead hang"][index];
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
  const scored = tests
    .map((test) => ({ ...test, level: Number(state.results[test.id]?.level || 0) }))
    .filter((test) => test.level > 0)
    .sort((a, b) => a.level - b.level);
  const adviceList = document.querySelector("#advice-list");
  const adviceIntro = document.querySelector("#advice-intro");
  if (!scored.length) {
    adviceIntro.textContent = "บันทึกผลเพื่อรับคำแนะนำเฉพาะตัว";
    adviceList.innerHTML = `<p class="empty-advice">เลือกผลทดสอบทั้ง 4 ฐานเพื่อดูแนวทางที่เหมาะกับคุณ</p>`;
    return;
  }
  adviceIntro.textContent = "เริ่มจากด้านที่อยากพัฒนา แล้วค่อยเพิ่มความท้าทาย";
  adviceList.innerHTML = scored.slice(0, 3).map((test, index) => `
    <div class="advice-item">
      <span class="advice-index">0${index + 1}</span>
      <div><h4>${test.name} · ระดับ ${test.level}</h4><p>${test.advice}</p></div>
    </div>`).join("");
}

function showResults() {
  if (!state.profile) {
    window.alert("กรุณาบันทึกข้อมูลผู้เข้ารับการทดสอบก่อนดูสรุปผล");
    profileForm.scrollIntoView({ behavior: "smooth", block: "center" });
    profileForm.elements.namedItem("name").focus({ preventScroll: true });
    return;
  }
  if (tests.some((test) => !state.results[test.id]?.level)) {
    const firstIncomplete = tests.find((test) => !state.results[test.id]?.level);
    window.alert("กรุณาเลือกระดับผลทดสอบให้ครบทั้ง 4 ฐานก่อนดูสรุปผล");
    document.querySelector(`#station-${firstIncomplete.id}`).scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  renderChart();
  renderAdvice();
  document.querySelector("#result-profile").textContent =
    `${state.profile.name} · อายุ ${state.profile.age} ปี · ${state.profile.weight} กก. · ${state.profile.height} ซม.`;
  resultsSection.hidden = false;
  resultsSection.scrollIntoView({ behavior: "smooth" });
}

document.querySelector("#results-button").addEventListener("click", showResults);
document.querySelector("#print-button").addEventListener("click", () => window.print());
document.querySelector("#edit-results").addEventListener("click", () => document.querySelector("#tests").scrollIntoView({ behavior: "smooth" }));

loadProfile();
renderTests();
