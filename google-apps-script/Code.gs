const CONFIG = {
  spreadsheetId: "1_km-l77IVk5IuCMVsFxIfa-56opsh8elOtNkEVFTrhw",
  sheetId: 0,
  drySlopeFolderId: "1jyCtZ4mWK3pf6fpLv1tfwkXvICksb3Xm",
  fitnessFolderId: "1J0dOJnkD6HwMsSIVOfFL9LwecUYPkoep",
};

const HEADERS = [
  "Timestamp",
  "Record ID",
  "Name",
  "Gender",
  "Age",
  "Weight (kg)",
  "Height (cm)",
  "Phone",
  "Email",
  "Function Reach (cm)",
  "Function Reach Level",
  "30 Sec Sit To Stand (reps)",
  "30 Sec Sit To Stand Level",
  "Board Jump (cm)",
  "Board Jump Level",
  "Vertical Jump (cm)",
  "Vertical Jump Level",
  "Dead Hang (sec)",
  "Dead Hang Level",
  "Action Rule",
  "Profile Saved At",
  "Results Saved At",
  "Consent Given At",
  "Dry Slope Agreement Accepted At",
  "Dry Slope Agreement Version",
];

function doPost(event) {
  let lock;

  try {
    const body = event && event.postData ? event.postData.contents : "";
    const payload = JSON.parse(body || "");
    const stage = payload.stage || "legacy";
    const recordId = stage === "legacy"
      ? Utilities.getUuid()
      : requiredRecordId(payload.recordId);
    let fields;
    if (stage === "profile") {
      requireConsent(payload);
      fields = createProfileFields(payload, recordId);
    } else if (stage === "agreement") {
      requireConsent(payload);
      if (payload.agreementAccepted !== true) {
        throw new Error("The Dry Slope agreement must be accepted.");
      }
      fields = Object.assign(
        createProfileFields(payload, recordId),
        createAgreementFields()
      );
    } else if (stage === "results") {
      fields = createResultFields(payload);
    } else if (stage === "legacy") {
      requireConsent(payload);
      fields = Object.assign(
        createProfileFields(payload, recordId),
        createResultFields(payload)
      );
    } else {
      throw new Error("Submission stage is invalid.");
    }

    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetById(CONFIG.sheetId);
    if (!sheet) {
      throw new Error("The configured sheet tab was not found.");
    }
    const headers = ensureHeaders(sheet);
    if (stage === "legacy") {
      sheet.appendRow(createRowValues(headers, fields));
      return createResponse({ ok: true });
    }

    const rowNumber = findRecordRow(sheet, headers, recordId);

    if (stage === "profile" || stage === "agreement") {
      if (rowNumber) {
        updateRow(sheet, headers, rowNumber, fields);
      } else {
        sheet.appendRow(createRowValues(headers, fields));
      }
      if (stage === "agreement") {
        const agreementPdf = createDrySlopeAgreementPdf(payload.profile, recordId);
        sendDrySlopeAgreementEmail(payload.profile, agreementPdf);
      }
    } else if (payload.stage === "results") {
      if (!rowNumber) {
        throw new Error("The profile row must be saved before its test results.");
      }
      requireConsent(payload);
      const consentColumn = headers.indexOf("Consent Given At") + 1;
      if (
        consentColumn === 0
        || !sheet.getRange(rowNumber, consentColumn).getValue()
      ) {
        throw new Error("The profile row has no recorded consent.");
      }
      updateRow(sheet, headers, rowNumber, fields);
      sendAssessmentEmail(sheet, headers, rowNumber, payload);
    }

    return createResponse({ ok: true });
  } catch (error) {
    console.error(error);
    return createResponse({ ok: false });
  } finally {
    if (lock && lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function requireConsent(payload) {
  if (payload.consented !== true) {
    throw new Error("Submission requires recorded consent.");
  }
}

function createAgreementFields() {
  return {
    "Dry Slope Agreement Accepted At": new Date(),
    "Dry Slope Agreement Version": "2026-11-11",
  };
}

function authorizeAssessmentPermissions() {
  MailApp.getRemainingDailyQuota();
  HtmlService.createHtmlOutput("PDF permission check")
    .getBlob()
    .getAs(MimeType.PDF);
  getDrySlopeFolder();
  getFitnessFolder();
}

function createProfileFields(payload, recordId) {
  if (!payload.profile) {
    throw new Error("Submission is missing the profile.");
  }

  const profile = payload.profile;
  const name = requiredText(profile.name, 60);
  const gender = requiredText(profile.gender, 20);
  const age = requiredNumber(profile.age, 5, 120);
  const weight = requiredNumber(profile.weight, 10, 400);
  const height = requiredNumber(profile.height, 50, 250);
  const phone = requiredText(profile.phone, 20);
  const email = requiredText(profile.email, 254);

  if (!/^[+0-9() .-]{7,20}$/.test(phone)) {
    throw new Error("Phone number is invalid.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email address is invalid.");
  }

  const timestamp = new Date();
  return {
    Timestamp: timestamp,
    "Record ID": recordId,
    Name: safeCell(name),
    Gender: safeCell(gender),
    Age: age,
    "Weight (kg)": weight,
    "Height (cm)": height,
    Phone: safeCell(phone),
    Email: safeCell(email),
    "Profile Saved At": timestamp,
    "Consent Given At": timestamp,
  };
}

function createResultFields(payload) {
  if (!payload.results) {
    throw new Error("Submission is missing the test results.");
  }

  const isLegacy = payload.stage === "legacy";
  const reach = requiredResult(payload.results.reach, isLegacy);
  const sitStand = requiredResult(payload.results["sit-stand"], isLegacy);
  const isLegacyBoardJump = payload.stage === "legacy" && !payload.results["vertical-jump"];
  const jump = requiredResult(isLegacyBoardJump ? payload.results["board-jump"] : payload.results["vertical-jump"], isLegacy);
  const deadHang = requiredResult(payload.results["dead-hang"], isLegacy);
  const fields = {
    "Function Reach (cm)": reach.measure,
    "Function Reach Level": reach.level,
    "30 Sec Sit To Stand (reps)": sitStand.measure,
    "30 Sec Sit To Stand Level": sitStand.level,
    "Dead Hang (sec)": deadHang.measure,
    "Dead Hang Level": deadHang.level,
    "Results Saved At": new Date(),
  };
  if (isLegacyBoardJump) {
    fields["Board Jump (cm)"] = jump.measure;
    fields["Board Jump Level"] = jump.level;
    return fields;
  }
  const actionRule = getActionRuleId([reach.level, sitStand.level, jump.level, deadHang.level]);

  fields["Vertical Jump (cm)"] = jump.measure;
  fields["Vertical Jump Level"] = jump.level;
  fields["Action Rule"] = actionRule;
  return fields;
}

function getActionRuleId(levels) {
  const counts = { red: 0, yellow: 0, green: 0 };
  levels.forEach(function (level) {
    if (Number(level) === 1) counts.red += 1;
    if (Number(level) === 2) counts.yellow += 1;
    if (Number(level) === 3) counts.green += 1;
  });
  if (counts.red >= 2) return "red-two";
  if (counts.red === 1) return "red-one";
  if (counts.yellow >= 2) return "yellow-two";
  if (counts.green >= 2) return "green-two";
  return "no-match";
}

function sendAssessmentEmail(sheet, headers, rowNumber, payload) {
  const row = sheet.getRange(rowNumber, 1, 1, headers.length).getDisplayValues()[0];
  const valueFor = function (header) {
    const column = headers.indexOf(header);
    if (column < 0) throw new Error("The saved profile is missing " + header + ".");
    return row[column];
  };
  const email = requiredText(valueFor("Email"), 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("The saved email address is invalid.");
  }

  const name = valueFor("Name").replace(/^'/, "");
  const action = getEmailAction(getActionRuleId([
    payload.results.reach.level,
    payload.results["sit-stand"].level,
    payload.results["vertical-jump"].level,
    payload.results["dead-hang"].level,
  ]));
  const entries = [
    {
      name: "Functional Reach Test",
      measure: "Function Reach (cm)",
      level: "Function Reach Level",
      unit: "ซม.",
      capacity: "Mobility และ dynamic balance",
      lowMayReflect: "การเคลื่อนไหวของข้อเท้า สะโพก ทรวงอก และไหล่ รวมถึงการถ่ายน้ำหนักและการควบคุมลำตัว",
      trainingGoal: "เคลื่อนไหวได้ดีขึ้นและคุมลำตัวระหว่างเอื้อม",
    },
    {
      name: "Dead Hang",
      measure: "Dead Hang (sec)",
      level: "Dead Hang Level",
      unit: "วินาที",
      capacity: "Upper-body capacity",
      lowMayReflect: "Grip endurance, scapular control, shoulder capacity และ relative upper-body strength",
      trainingGoal: "สร้างแรงดึง–ดัน–จับ และความมั่นคงของไหล่",
    },
    {
      name: "30-Second Sit-to-Stand",
      measure: "30 Sec Sit To Stand (reps)",
      level: "30 Sec Sit To Stand Level",
      unit: "ครั้ง",
      capacity: "Lower-body strength/endurance",
      lowMayReflect: "ความแข็งแรงขาและสะโพก การควบคุม squat pattern และความทนทานการทำงาน",
      trainingGoal: "ลุก นั่ง ย่อ และออกแรงผ่านขาได้ดีขึ้น",
    },
    {
      name: "Vertical Jump",
      measure: "Vertical Jump (cm)",
      level: "Vertical Jump Level",
      unit: "ซม.",
      capacity: "Lower-body power",
      lowMayReflect: "อัตราการออกแรง การถ่ายแรงผ่านขาและลำตัว การลงพื้น และแรงสัมพันธ์ต่อน้ำหนักตัว",
      trainingGoal: "สร้าง strength ก่อน แล้วพัฒนาแรงเร็วและ landing quality",
    },
  ];
  const results = entries.map(function (entry) {
    const measure = valueFor(entry.measure);
    const level = Number(valueFor(entry.level));
    const grade = level === 1 ? "แดง · ควรเริ่มเสริม"
      : level === 2 ? "เหลือง · พอใช้/พัฒนาได้"
        : level === 3 ? "เขียว · ดี"
          : "ไม่มีระดับสีตามเกณฑ์";
    return {
      name: entry.name,
      measure: measure ? measure + " " + entry.unit : "ไม่ได้ระบุ",
      grade: grade,
      capacity: entry.capacity,
      lowMayReflect: entry.lowMayReflect,
      trainingGoal: entry.trainingGoal,
    };
  });

  const subject = "ผลประเมินสมรรถภาพเบื้องต้น - " + name.replace(/[\r\n]/g, " ");
  const textResults = results.map(function (result) {
    return result.name + ": " + result.measure + " (" + result.grade + ")";
  }).join("\n");
  const textInterpretations = results.map(function (result) {
    return result.name
      + "\nสมรรถภาพหลัก: " + result.capacity
      + "\nผลต่ำอาจสะท้อน: " + result.lowMayReflect
      + "\nเป้าหมายการฝึก: " + result.trainingGoal;
  }).join("\n\n");
  const textBody = [
    "สวัสดี " + name,
    "",
    "ผลประเมินสมรรถภาพเบื้องต้น",
    textResults,
    "",
    "สิ่งที่แต่ละฐานสะท้อนและเป้าหมายการฝึก",
    textInterpretations,
    "",
    "แนวทางตามผลรวม: " + action.title,
    action.summary,
    action.recommendations.map(function (item, index) { return (index + 1) + ". " + item; }).join("\n"),
    "",
    "เป็นค่าที่สำหรับการทดสอบอย่างง่ายเท่านั้น ไม่ใช่ค่าในการวินิจฉัย",
  ].join("\n");
  const htmlBreakdown = results.map(function (result, index) {
    return "<tr><td class=\"score\">" + (Number(valueFor(entries[index].level)) || "—") + "</td><td>"
      + "<strong>" + escapeHtml(result.name) + " · " + escapeHtml(result.measure) + "</strong>"
      + "<div class=\"grade\">" + escapeHtml(result.grade) + "</div>"
      + "<div><b>สมรรถภาพหลัก:</b> " + escapeHtml(result.capacity) + "</div>"
      + "<div><b>ผลต่ำอาจสะท้อน:</b> " + escapeHtml(result.lowMayReflect) + "</div>"
      + "<div><b>เป้าหมายการฝึก:</b> " + escapeHtml(result.trainingGoal) + "</div></td></tr>";
  }).join("");
  const actionItems = action.recommendations.map(function (item) {
    return "<li>" + escapeHtml(item) + "</li>";
  }).join("");
  const reportHtml = "<div class=\"report-header\"><div class=\"eyebrow\">RANGDEE · FITNESS ASSESSMENT</div>"
    + "<h1>ผลประเมินสมรรถภาพเบื้องต้น</h1><p>" + escapeHtml(name)
    + " · อายุ " + escapeHtml(valueFor("Age")) + " ปี · " + escapeHtml(valueFor("Gender")) + "</p></div>"
    + "<table class=\"panels\"><tr><td class=\"panel chart-panel\"><h2>ภาพรวมสมรรถภาพ</h2>"
    + "<p>ระดับสีตามเกณฑ์ค่า Cut-off</p><div class=\"radar\">" + buildRadarSvg(payload) + "</div>"
    + "<div class=\"legend\"><span class=\"red-dot\"></span>แดง · ควรเริ่มเสริม&nbsp;&nbsp; "
    + "<span class=\"yellow-dot\"></span>เหลือง · พอใช้/พัฒนาได้&nbsp;&nbsp; "
    + "<span class=\"green-dot\"></span>เขียว · ดี</div></td>"
    + "<td class=\"panel advice-panel\"><h2>แนวทางพัฒนาต่อ</h2><p>แนวทางตามจำนวนผลสีแดง เหลือง และเขียว ตามเกณฑ์การแปลผล</p>"
    + "<div class=\"action\"><h3>" + escapeHtml(action.title) + "</h3><p>"
    + escapeHtml(action.summary) + "</p><ul>" + actionItems + "</ul></div></td></tr></table>"
    + "<h2 class=\"breakdown-title\">ผลรายฐาน</h2><table class=\"breakdown\"><tbody>" + htmlBreakdown
    + "</tbody></table><p class=\"disclaimer\">เป็นค่าที่สำหรับการทดสอบอย่างง่ายเท่านั้น ไม่ใช่ค่าในการวินิจฉัย</p>";
  const pdfHtml = "<!doctype html><html><head><meta charset=\"UTF-8\"><style>"
    + "body{font:10px Arial,sans-serif;color:#173c34;line-height:1.55;margin:24px}"
    + ".report-header{border-bottom:1px solid #e6e9e2;padding-bottom:10px;margin-bottom:12px}.eyebrow{font-size:8px;letter-spacing:1.4px;color:#788678;font-weight:bold}"
    + "h1{font-size:21px;margin:6px 0 2px}h2{font-size:13px;margin:0 0 4px}h3{font-size:12px;margin:0 0 6px}.report-header p,.panel>p{margin:0;color:#78827b;font-size:9px}"
    + ".panels{width:100%;border-collapse:separate;border-spacing:8px 0;margin:0 -8px 13px}.panels td{width:50%;vertical-align:top}"
    + ".panel{padding:13px;border:1px solid #e6e9e2;border-radius:8px;background:#fff}.chart-panel{height:245px}.radar{height:185px;text-align:center}.radar svg{width:100%;height:185px}"
    + ".legend{font-size:7px;color:#78827b;text-align:center}.legend span{display:inline-block;width:7px;height:7px;border-radius:50%}.red-dot{background:#df706a}.yellow-dot{background:#e6bd52}.green-dot{background:#63a879}"
    + ".action{margin-top:13px;padding:12px;border-radius:7px;background:#f7f8f3}.action p,.action li{font-size:9px;color:#78827b}.action ul{padding-left:16px;margin:6px 0 0}.action li{margin-bottom:5px}"
    + ".breakdown-title{margin:15px 0 5px}.breakdown{width:100%;border-collapse:collapse}.breakdown td{padding:8px 5px;border-top:1px solid #e6e9e2;vertical-align:top;font-size:8.5px}.breakdown .score{width:28px;text-align:center;font-weight:bold;color:#69825d}.grade{color:#78827b;margin:2px 0}.breakdown div{margin-top:2px}.disclaimer{margin-top:12px;color:#7a6841;font-weight:bold;font-size:8px}"
    + "</style></head><body>" + reportHtml + "</body></html>";
  const htmlBody = "<div style=\"font:13px Arial,sans-serif;color:#173c34;line-height:1.6\">"
    + "<h2>ผลประเมินสมรรถภาพเบื้องต้น</h2><p>สวัสดี " + escapeHtml(name)
    + " รายงานฉบับเต็มอยู่ในไฟล์ PDF ที่แนบมากับอีเมลนี้</p><p>บันทึก PDF ใน Google Drive โฟลเดอร์ที่กำหนดแล้ว</p></div>";
  const fileName = "Fitness-Assessment-" + sanitizeFileName(name)
    + "-" + valueFor("Record ID") + ".pdf";
  const pdfBlob = HtmlService.createHtmlOutput(pdfHtml)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName(fileName);
  const driveFile = getFitnessFolder().createFile(pdfBlob);
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: textBody + "\n\nบันทึกไฟล์ PDF ไว้ใน Google Drive โฟลเดอร์ "
      + CONFIG.fitnessFolderId + " และแนบไฟล์รายงานมาพร้อมอีเมลนี้แล้ว",
    htmlBody: htmlBody,
    attachments: [driveFile.getBlob()],
  });
}

function getDrySlopeFolder() {
  return DriveApp.getFolderById(CONFIG.drySlopeFolderId);
}

function getFitnessFolder() {
  return DriveApp.getFolderById(CONFIG.fitnessFolderId);
}

function createDrySlopeAgreementPdf(profile, recordId) {
  const clauses = [
    {
      title: "ความปลอดภัยเป็นสิ่งสำคัญสูงสุด",
      items: [
        "ใช้สถานที่ด้วยความระมัดระวัง คำนึงถึงความปลอดภัยของตนเองและผู้อื่นอยู่เสมอ",
        "สวมใส่อุปกรณ์ป้องกันที่เหมาะสมครบถ้วน เช่น หมวกกันกระแทก สนับเข่า สนับศอก และอุปกรณ์ที่สนามกำหนด",
        "ประเมินความพร้อมของร่างกายและสภาพอุปกรณ์ก่อนใช้งานทุกครั้ง",
      ],
    },
    {
      title: "ความรับผิดชอบต่อการกระทำของตนเอง",
      items: [
        "ท่านยอมรับว่าการเล่นสกีและสโนว์บอร์ดมีความเสี่ยงโดยธรรมชาติ",
        "รับผิดชอบต่อสวัสดิภาพและความปลอดภัยของตนเองตลอดระยะเวลาที่ใช้สนาม",
        "รับผิดชอบต่อความเสียหายหรือผลกระทบใด ๆ ที่เกิดขึ้นกับผู้อื่น อันเนื่องมาจากการกระทำโดยประมาทหรือไม่ปฏิบัติตามกฎของสนาม",
      ],
    },
    {
      title: "การปฏิบัติตามกฎระเบียบของสนามอย่างเคร่งครัด",
      items: [
        "ปฏิบัติตามกฎ ข้อบังคับ และคำแนะนำของเจ้าหน้าที่ทุกประการ",
        "ใช้สนามตามช่วงเวลาที่ได้ทำการจองเท่านั้น",
        "หยุดใช้งานทันทีเมื่อเจ้าหน้าที่เห็นว่าเกิดความเสี่ยงหรือสถานการณ์ไม่ปลอดภัย",
      ],
    },
    {
      title: "มารยาทในการใช้สถานที่ร่วมกับผู้อื่น",
      items: [
        "ให้ความเคารพสิทธิ์ของผู้ใช้งานท่านอื่น",
        "หลีกเลี่ยงพฤติกรรมที่อาจก่อให้เกิดอันตราย รบกวน หรือสร้างความเดือดร้อนแก่ผู้อื่น",
        "รักษาระยะห่างที่ปลอดภัยระหว่างการฝึกซ้อม",
      ],
    },
    {
      title: "การดูแลรักษาทรัพย์สินและสถานที่",
      items: [
        "ดูแลรักษาอุปกรณ์ สิ่งของ และทรัพย์สินของสนามเสมือนเป็นทรัพย์สินของตนเอง",
        "ห้ามกระทำการใด ๆ ที่ก่อให้เกิดความเสียหายต่อพื้นผิว Dry Slope อุปกรณ์ หรือสิ่งปลูกสร้าง",
        "รักษาความสะอาดและความเรียบร้อยของสถานที่",
      ],
    },
    {
      title: "สภาพร่างกายและพฤติกรรมที่เหมาะสม",
      items: [
        "งดใช้สนามหากอยู่ในสภาพร่างกายไม่พร้อม เช่น อ่อนเพลีย บาดเจ็บ หรือเจ็บป่วย",
        "ห้ามใช้สนามขณะอยู่ภายใต้ฤทธิ์แอลกอฮอล์ ยาเสพติด หรือสารที่มีผลต่อการควบคุมสติ",
      ],
    },
    {
      title: "สิทธิ์ของสนามในการระงับการใช้งาน",
      items: [
        "สนามขอสงวนสิทธิ์ในการเพิกถอนสิทธิ์สมาชิก หรือระงับการใช้งานทันที หากพบว่ามีการฝ่าฝืนกฎ หรือมีพฤติกรรมที่เสี่ยงต่อความปลอดภัย",
        "การตัดสินใจของเจ้าหน้าที่ถือเป็นที่สิ้นสุด",
      ],
    },
  ];
  const clauseHtml = clauses.map(function (clause, index) {
    return "<section><h2>" + (index + 1) + ". " + escapeHtml(clause.title) + "</h2><ul>"
      + clause.items.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("")
      + "</ul></section>";
  }).join("");
  const html = "<!doctype html><html><head><meta charset=\"UTF-8\"><style>"
    + "body{font:12px Arial,sans-serif;color:#173c34;line-height:1.65;margin:32px}"
    + "h1{font-size:21px;margin:6px 0 15px}h2{font-size:14px;margin:14px 0 5px}"
    + ".profile{padding:10px 12px;border:1px solid #dfe5dc;background:#f7f8f3}"
    + ".profile p{margin:3px 0}ul{margin:4px 0;padding-left:22px}li{margin:0 0 4px}"
    + ".accept{margin-top:16px;padding:12px;border-top:1px solid #dfe5dc;font-weight:bold}"
    + ".signature{margin-top:28px;padding-top:10px;border-top:1px solid #dfe5dc}"
    + "</style></head><body><div style=\"font-size:9px;letter-spacing:1px;color:#788678\">RANGDEE · DRY SLOPE</div>"
    + "<h1>ข้อตกลงและเงื่อนไขสำหรับสมาชิกผู้ผ่านการฝึกทักษะการใช้งาน Dry Slope อย่างปลอดภัย</h1>"
    + "<div class=\"profile\"><p><b>ชื่อ:</b> " + escapeHtml(profile.name) + "</p>"
    + "<p><b>เพศ:</b> " + escapeHtml(profile.gender) + " &nbsp; <b>อายุ:</b> " + escapeHtml(profile.age)
    + " ปี &nbsp; <b>น้ำหนัก:</b> " + escapeHtml(profile.weight) + " กก. &nbsp; <b>ส่วนสูง:</b> "
    + escapeHtml(profile.height) + " ซม.</p><p><b>โทรศัพท์:</b> " + escapeHtml(profile.phone)
    + " &nbsp; <b>อีเมล:</b> " + escapeHtml(profile.email) + "</p></div>"
    + "<p>ภายหลังจากที่ท่านได้ผ่านการฝึกทักษะการใช้งาน Dry Slope ตามมาตรฐานความปลอดภัยของสนามเรียบร้อยแล้ว ท่านจะได้รับสติ๊กเกอร์รับรองสถานะสมาชิก และสิทธิ์ในการจองเวลาเข้าใช้งานสนามเพื่อฝึกซ้อมด้วยตนเอง โดยไม่จำเป็นต้องมีผู้สอนดูแลตลอดเวลา</p>"
    + "<p>การใช้สิทธิ์ดังกล่าว ท่านยินยอมและตกลงปฏิบัติตามข้อกำหนดต่อไปนี้อย่างเคร่งครัด</p>"
    + clauseHtml
    + "<p>การได้รับสิทธิ์เข้าใช้งานสนามด้วยตนเองนี้ ถือเป็นความไว้วางใจที่สนามมอบให้แก่ท่านในฐานะสมาชิกที่มีความรู้ ความเข้าใจ และมีวินัยด้านความปลอดภัยอย่างเพียงพอ จึงขอความร่วมมือจากท่านในการปฏิบัติตามข้อกำหนดดังกล่าวอย่างเคร่งครัด เพื่อความปลอดภัยและประสบการณ์ที่ดีของผู้ใช้งานทุกท่านร่วมกัน</p>"
    + "<p class=\"accept\">ผู้ยื่นแบบฟอร์มได้อ่าน เข้าใจ และยอมรับข้อกำหนดการใช้ Dry Slope</p>"
    + "<p class=\"signature\">บันทึกการยอมรับทางอิเล็กทรอนิกส์ · " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss")
    + " · Record ID: " + escapeHtml(recordId) + "</p></body></html>";
  const fileName = "Dry-Slope-Agreement-" + sanitizeFileName(profile.name)
    + "-" + recordId + ".pdf";
  const pdfBlob = HtmlService.createHtmlOutput(html)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName(fileName);
  return getDrySlopeFolder().createFile(pdfBlob);
}

function sendDrySlopeAgreementEmail(profile, pdfFile) {
  const email = requiredText(profile.email, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email address is invalid.");
  }
  const name = requiredText(profile.name, 60).replace(/^'/, "");

  MailApp.sendEmail({
    to: email,
    subject: "สำเนาข้อตกลงการใช้ Dry Slope - " + name.replace(/[\r\n]/g, " "),
    body: [
      "สวัสดี " + name,
      "",
      "แนบมาพร้อมอีเมลนี้คือ PDF สำเนาข้อตกลงการใช้ Dry Slope ที่คุณยืนยันแล้ว",
      "กรุณาเก็บไฟล์นี้ไว้เป็นหลักฐานการยอมรับข้อตกลง",
    ].join("\n"),
    attachments: [pdfFile.getBlob()],
  });
}

function buildRadarSvg(payload) {
  const centerX = 180;
  const centerY = 112;
  const radius = 65;
  const levels = [
    payload.results.reach && payload.results.reach.level,
    payload.results["dead-hang"] && payload.results["dead-hang"].level,
    payload.results["sit-stand"] && payload.results["sit-stand"].level,
    payload.results["vertical-jump"] && payload.results["vertical-jump"].level,
  ].map(function (level) {
    return Math.max(0, Math.min(3, Number(level) || 0));
  });
  const point = function (index, scale) {
    const angle = -Math.PI / 2 + index * Math.PI / 2;
    return [
      centerX + Math.cos(angle) * radius * scale,
      centerY + Math.sin(angle) * radius * scale,
    ];
  };
  const polygon = function (scale) {
    return [0, 1, 2, 3].map(function (index) {
      return point(index, scale).map(function (coordinate) {
        return coordinate.toFixed(1);
      }).join(",");
    }).join(" ");
  };
  const resultPoints = levels.map(function (level, index) {
    return point(index, level / 3).map(function (coordinate) {
      return coordinate.toFixed(1);
    }).join(",");
  }).join(" ");
  const labels = [
    "<text x=\"180\" y=\"20\" text-anchor=\"middle\">Forward reach</text>",
    "<text x=\"264\" y=\"115\" text-anchor=\"start\">Dead hang</text>",
    "<text x=\"180\" y=\"218\" text-anchor=\"middle\">Sit-to-stand</text>",
    "<text x=\"96\" y=\"115\" text-anchor=\"end\">Vertical jump</text>",
  ].join("");
  const dots = levels.map(function (level, index) {
    if (!level) return "";
    const coordinates = point(index, level / 3);
    return "<circle cx=\"" + coordinates[0].toFixed(1) + "\" cy=\""
      + coordinates[1].toFixed(1) + "\" r=\"4\" fill=\"#fff\" stroke=\"#4f8d62\" stroke-width=\"2\"/>";
  }).join("");
  return "<svg viewBox=\"0 0 360 235\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"กราฟระดับสมรรถภาพ 4 ฐาน\">"
    + [1, 2, 3].map(function (level) {
      return "<polygon points=\"" + polygon(level / 3) + "\" fill=\"none\" stroke=\"#e6eae2\"/>";
    }).join("")
    + [0, 1, 2, 3].map(function (index) {
      const end = point(index, 1);
      return "<line x1=\"" + centerX + "\" y1=\"" + centerY + "\" x2=\""
        + end[0].toFixed(1) + "\" y2=\"" + end[1].toFixed(1) + "\" stroke=\"#e6eae2\"/>";
    }).join("")
    + "<polygon points=\"" + resultPoints + "\" fill=\"#93b983\" fill-opacity=\".29\" stroke=\"#4f8d62\" stroke-width=\"2\"/>"
    + dots + "<g font-family=\"Arial,sans-serif\" font-size=\"11\" fill=\"#173c34\">" + labels + "</g></svg>";
}

function sanitizeFileName(value) {
  const sanitized = String(value)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return sanitized || "participant";
}

function getEmailAction(ruleId) {
  const actions = {
    "red-two": {
      title: "สีแดง 2 ฐานขึ้นไป",
      summary: "ควรเริ่มจากการขยับข้อต่อให้ดีขึ้นและเรียนรู้พื้นฐานการเคลื่อนไหว ก่อนพัฒนาความแข็งแรง",
      recommendations: [
        "แนะนำพบนักกายภาพบำบัดเพื่อคัดกรองหรือประเมินร่างกายเพิ่มเติม",
        "เริ่มจาก Stretching/Mobility และ Movement foundation เช่น Squat, Hip hinge, Push หรือ Pull 1–2 ท่า",
      ],
    },
    "red-one": {
      title: "สีแดง 1 ฐาน",
      summary: "ภาพรวมทำได้ค่อนข้างดี แต่ยังมีพื้นฐานสมรรถภาพที่พัฒนาได้",
      recommendations: [
        "ฝึก Movement foundation ด้วยน้ำหนักตัว เวท หรือยางยืด 1–2 ท่า และเรียนรู้การสังเกตความล้า (RPE 4–5/10)",
        "สะสมกิจกรรมทางกายความหนักปานกลางประมาณ 150 นาทีต่อสัปดาห์ และฝึกแรงต้านอย่างน้อย 2 วันต่อสัปดาห์",
      ],
    },
    "yellow-two": {
      title: "สีเหลือง 2 ฐานขึ้นไป",
      summary: "พื้นฐานมาดีแล้ว สามารถต่อยอดความแข็งแรงและพัฒนา Performance ให้เชื่อมกับกิจกรรมที่สนใจ",
      recommendations: [
        "ทบทวนทักษะ Squat, Hip hinge, Push และ Pull เพื่อเลือกแนวทางฝึกที่เหมาะสม",
        "ต่อยอดการฝึกแรงต้าน เช่น Hypertrophy, Strength หรือ Strength endurance และเลือกใช้เครื่องหรือ Free weight ตามเป้าหมาย",
      ],
    },
    "green-two": {
      title: "สีเขียว 2 ฐานขึ้นไป",
      summary: "มีพื้นฐานการเคลื่อนไหวและความแข็งแรงที่ดี สามารถต่อยอดสู่ Performance ตามกิจกรรมหรือกีฬาที่สนใจ",
      recommendations: [
        "เพิ่มความท้าทายด้วย Velocity-based, Tempo, Speed-strength หรือ Strength-speed training",
        "พิจารณาฝึก Agility หรือ Plyometric และพัฒนาสู่ Performance ของกิจกรรมหรือกีฬาที่ต้องการ",
      ],
    },
    "no-match": {
      title: "ยังไม่มี Action Rule ที่ตรงเงื่อนไข",
      summary: "ใช้ผลรายฐานตั้งเป้าหมายร่วมกับผู้ดูแลการทดสอบ",
      recommendations: [],
    },
  };
  return actions[ruleId];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    }[character];
  });
}

function requiredRecordId(value) {
  if (typeof value !== "string" || !/^[a-zA-Z0-9-]{16,80}$/.test(value)) {
    throw new Error("Record ID is invalid.");
  }
  return value;
}

function ensureHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (sheet.getLastRow() === 0 || lastColumn === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    return HEADERS.slice();
  }

  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
  const headers = existingHeaders.slice();
  HEADERS.forEach(function (header) {
    if (headers.indexOf(header) === -1) {
      headers.push(header);
    }
  });
  if (headers.length > lastColumn) {
    sheet.getRange(1, lastColumn + 1, 1, headers.length - lastColumn)
      .setValues([headers.slice(lastColumn)]);
  }
  return headers;
}

function findRecordRow(sheet, headers, recordId) {
  const column = headers.indexOf("Record ID") + 1;
  const lastRow = sheet.getLastRow();
  if (column === 0 || lastRow < 2) return 0;

  const recordIds = sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  const index = recordIds.findIndex(function (row) {
    return row[0] === recordId;
  });
  return index < 0 ? 0 : index + 2;
}

function createRowValues(headers, fields) {
  return headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(fields, header) ? fields[header] : "";
  });
}

function updateRow(sheet, headers, rowNumber, fields) {
  const existing = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function (header, index) {
    if (Object.prototype.hasOwnProperty.call(fields, header)) {
      existing[index] = fields[header];
    }
  });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([existing]);
}

function requiredResult(result, allowMissingMeasure) {
  if (!result || typeof result !== "object") {
    throw new Error("A test result is missing.");
  }

  let level = "";
  if (result.level !== null && result.level !== "") {
    level = requiredNumber(result.level, 1, 3);
    if (!Number.isInteger(level)) {
      throw new Error("A test level is invalid.");
    }
  }

  const hasMeasure = result.measure !== null && result.measure !== "" && result.measure !== undefined;
  if (!allowMissingMeasure && !hasMeasure) {
    throw new Error("A test measurement is missing.");
  }
  const measure = hasMeasure ? requiredNumber(result.measure, 0, 100000) : "";
  return { measure: measure, level: level };
}

function requiredText(value, maxLength) {
  if (typeof value !== "string") {
    throw new Error("A required text field is missing.");
  }
  const text = value.trim();
  if (!text || text.length > maxLength) {
    throw new Error("A text field is empty or too long.");
  }
  return text;
}

function requiredNumber(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new Error("A numeric field is outside its allowed range.");
  }
  return number;
}

function safeCell(value) {
  const text = String(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function createResponse(message) {
  return ContentService.createTextOutput(JSON.stringify(message))
    .setMimeType(ContentService.MimeType.JSON);
}
