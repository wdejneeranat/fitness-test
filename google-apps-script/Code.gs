const CONFIG = {
  spreadsheetId: "10v-weiEiAkpQte9R1AoNs-YgYaf_FupvWMuRh3qRsb0",
  sheetId: 0,
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

    if (stage === "profile") {
      if (rowNumber) {
        updateRow(sheet, headers, rowNumber, fields);
      } else {
        sheet.appendRow(createRowValues(headers, fields));
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
  const htmlResults = results.map(function (result) {
    return "<tr><td style=\"padding:8px;border:1px solid #dfe5dc\">" + escapeHtml(result.name)
      + "</td><td style=\"padding:8px;border:1px solid #dfe5dc\">" + escapeHtml(result.measure)
      + "</td><td style=\"padding:8px;border:1px solid #dfe5dc\">" + escapeHtml(result.grade) + "</td></tr>";
  }).join("");
  const htmlInterpretations = results.map(function (result) {
    return "<li><strong>" + escapeHtml(result.name) + "</strong><br>สมรรถภาพหลัก: "
      + escapeHtml(result.capacity) + "<br>ผลต่ำอาจสะท้อน: " + escapeHtml(result.lowMayReflect)
      + "<br>เป้าหมายการฝึก: " + escapeHtml(result.trainingGoal) + "</li>";
  }).join("");
  const htmlBody = "<div style=\"font:14px Arial,sans-serif;color:#173c34;line-height:1.6\">"
    + "<h2>ผลประเมินสมรรถภาพเบื้องต้น</h2><p>สวัสดี " + escapeHtml(name) + "</p>"
    + "<table style=\"border-collapse:collapse\"><thead><tr><th style=\"padding:8px;border:1px solid #dfe5dc\">ฐานทดสอบ</th>"
    + "<th style=\"padding:8px;border:1px solid #dfe5dc\">ค่าที่วัด</th><th style=\"padding:8px;border:1px solid #dfe5dc\">ผลแปลสี</th></tr></thead><tbody>"
    + htmlResults + "</tbody></table><h3>สิ่งที่แต่ละฐานสะท้อนและเป้าหมายการฝึก</h3><ul>"
    + htmlInterpretations + "</ul><h3>" + escapeHtml(action.title) + "</h3><p>"
    + escapeHtml(action.summary) + "</p><ul>" + action.recommendations.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul><p style=\"color:#7a6841\">เป็นค่าที่สำหรับการทดสอบอย่างง่ายเท่านั้น ไม่ใช่ค่าในการวินิจฉัย</p></div>";
  const pdfHtml = "<!doctype html><html><head><meta charset=\"UTF-8\"><style>"
    + "body{font:12px Arial,sans-serif;color:#173c34;line-height:1.55;margin:28px}"
    + "h2{font-size:20px}h3{font-size:15px;margin-top:22px}"
    + "table{width:100%;border-collapse:collapse;margin:14px 0}"
    + "th{background:#edf2e5;text-align:left}th,td{padding:8px;border:1px solid #dfe5dc;vertical-align:top}"
    + "li{margin:0 0 8px}.disclaimer{margin-top:22px;color:#7a6841;font-weight:bold}"
    + "</style></head><body>" + htmlBody + "</body></html>";
  const attachment = HtmlService.createHtmlOutput(pdfHtml)
    .getBlob()
    .getAs(MimeType.PDF)
    .setName("fitness-assessment.pdf");
  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: textBody + "\n\nแนบไฟล์รายงานผลประเมินฉบับ PDF แล้ว",
    htmlBody: htmlBody,
    attachments: [attachment],
  });
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
