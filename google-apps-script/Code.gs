const CONFIG = {
  spreadsheetId: "10v-weiEiAkpQte9R1AoNs-YgYaf_FupvWMuRh3qRsb0",
  sheetId: 0,
};

const HEADERS = [
  "Timestamp",
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
  "Dead Hang (sec)",
  "Dead Hang Level",
];

function doPost(event) {
  let lock;

  try {
    const body = event && event.postData ? event.postData.contents : "";
    const payload = JSON.parse(body || "");
    const row = createRow(payload);
    lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetById(CONFIG.sheetId);
    if (!sheet) {
      throw new Error("The configured sheet tab was not found.");
    }
    const headers = ensureHeaders(sheet);
    sheet.appendRow(headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(row, header) ? row[header] : "";
    }));

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

function createRow(payload) {
  if (!payload || !payload.profile || !payload.results) {
    throw new Error("Submission is missing profile or test results.");
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

  const reach = requiredResult(payload.results.reach);
  const sitStand = requiredResult(payload.results["sit-stand"]);
  const boardJump = requiredResult(payload.results["board-jump"]);
  const deadHang = requiredResult(payload.results["dead-hang"]);

  return {
    Timestamp: new Date(),
    Name: safeCell(name),
    Gender: safeCell(gender),
    Age: age,
    "Weight (kg)": weight,
    "Height (cm)": height,
    Phone: safeCell(phone),
    Email: safeCell(email),
    "Function Reach (cm)": reach.measure,
    "Function Reach Level": reach.level,
    "30 Sec Sit To Stand (reps)": sitStand.measure,
    "30 Sec Sit To Stand Level": sitStand.level,
    "Board Jump (cm)": boardJump.measure,
    "Board Jump Level": boardJump.level,
    "Dead Hang (sec)": deadHang.measure,
    "Dead Hang Level": deadHang.level,
  };
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

function requiredResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("A test result is missing.");
  }

  const level = requiredNumber(result.level, 1, 3);
  if (!Number.isInteger(level)) {
    throw new Error("A test level is invalid.");
  }

  let measure = "";
  if (result.measure !== null && result.measure !== "") {
    measure = requiredNumber(result.measure, 0, 100000);
  }
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
