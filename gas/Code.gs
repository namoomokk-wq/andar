/**
 * ANDAR IN. MOTION 신청 접수용 Google Apps Script
 * 스프레드시트에 연결된 스크립트(확장 프로그램 > Apps Script)에 붙여넣고 웹앱으로 배포하세요. (gas/README.md 참고)
 */
var SHEET_NAME = "신청";
var MAX_SESSIONS = 2;
var MIN_ELAPSED_SEC = 3;
// 신청 마감: 10/14(수) 24:00 = 10/15 00:00 (KST). config.js의 DEADLINE과 동일하게 유지
var DEADLINE = new Date("2026-10-15T00:00:00+09:00");
// 시간표 (config.js의 DATES / SCHEDULE과 동일하게 유지). 사이트가 보내는 세션 값은 "날짜 시간 세션명" 형식
var DATES = ["10/24", "10/25"];
var SCHEDULE = [
  { time: "10:30", sessions: ["STRETCH YOUR RUN", "STRETCH YOUR RUN"] },
  { time: "12:30", sessions: ["MUSIC FLOW YOGA", "POWER PILATES"] },
  { time: "16:30", sessions: ["BURN BOOT CAMP", "MOVE & RESET YOGA"] },
  { time: "19:30", sessions: ["K - SOUND BATH", "K - SOUND BATH"] }
];
var VALID_SESSIONS = (function () {
  var list = [];
  SCHEDULE.forEach(function (row) {
    row.sessions.forEach(function (name, i) { list.push(DATES[i] + " " + row.time + " " + name); });
  });
  return list;
})();
var SIZES = {
  top: ["S", "M", "L", "XL", "2XL"],
  bra: ["S", "M", "L", "XL"],
  bottom: ["S", "M", "L", "XL", "2XL"],
  shoes: ["230", "235", "240", "245", "250", "255", "260", "265", "270", "275"]
};
// 기존 열 순서(1~11열)는 유지하고 새 항목은 뒤에 추가한다 (운영 시트 호환)
var HEADERS = ["접수시각", "성함", "연락처", "안다르 아이디", "세션1", "세션2", "성별", "브라탑", "상의", "하의", "신발", "인스타 아이디", "마케팅 동의"];
var COL = { phone: 3, andarId: 4, insta: 12 };

// 중복 비교용 정규화: safe()가 붙인 ' 접두어 제거, 공백 제거, 소문자
function norm(v) { return String(v == null ? "" : v).replace(/^'/, "").replace(/\s/g, "").toLowerCase(); }
function normInsta(v) { return norm(v).replace(/^@/, ""); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // 오픈 직후 동시 접수 대비
    var d = JSON.parse(e.postData.contents);

    // 봇 의심(허니팟 입력·너무 빠른 제출)은 저장하지 않고 성공처럼 응답
    if (d.website || (typeof d.elapsed === "number" && d.elapsed < MIN_ELAPSED_SEC)) return out({ ok: true });

    if (new Date() >= DEADLINE) return out({ ok: false, error: "클래스 신청이 마감되었습니다." });

    var required = ["name", "gender", "phone", "andarId", "top", "bottom"];
    for (var i = 0; i < required.length; i++) {
      if (!d[required[i]] || String(d[required[i]]).trim() === "") return out({ ok: false, error: "필수 항목이 비어 있어요." });
    }
    if (d.gender !== "남" && d.gender !== "여") return out({ ok: false, error: "성별을 확인해주세요." });
    var phone = String(d.phone).replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phone)) return out({ ok: false, error: "연락처 형식을 확인해주세요." });
    var sessions = d.sessions || [];
    if (sessions.length < 1 || sessions.length > MAX_SESSIONS) return out({ ok: false, error: "세션은 1~" + MAX_SESSIONS + "개 선택해주세요." });
    var insta = d.instaId ? String(d.instaId).trim() : "";
    if (String(d.name).length > 30 || String(d.andarId).length > 50 || insta.length > 50) return out({ ok: false, error: "입력 길이를 확인해주세요." });
    for (var s = 0; s < sessions.length; s++) {
      if (VALID_SESSIONS.indexOf(sessions[s]) < 0 || sessions.indexOf(sessions[s]) !== s) return out({ ok: false, error: "세션 선택을 확인해주세요." });
    }
    var hasRun = sessions.some(function (x) { return / STRETCH YOUR RUN$/.test(x); });
    var bra = d.gender === "여" ? String(d.bra || "") : "-";
    var shoes = hasRun ? String(d.shoes || "") : "-";
    if (SIZES.top.indexOf(String(d.top)) < 0 || SIZES.bottom.indexOf(String(d.bottom)) < 0 ||
        (d.gender === "여" && SIZES.bra.indexOf(bra) < 0) || (hasRun && SIZES.shoes.indexOf(shoes) < 0)) return out({ ok: false, error: "사이즈 선택을 확인해주세요." });

    var sheet = getSheet();
    var last = sheet.getLastRow();
    if (last > 1) {
      var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
      var nId = norm(d.andarId), nInsta = normInsta(insta);
      for (var r = 0; r < rows.length; r++) {
        var row = rows[r];
        if (String(row[COL.phone - 1]).replace(/\D/g, "") === phone) return out({ ok: false, error: "이미 신청된 연락처입니다." });
        if (norm(row[COL.andarId - 1]) === nId) return out({ ok: false, error: "이미 신청된 안다르 아이디입니다." });
        if (nInsta && normInsta(row[COL.insta - 1]) === nInsta) return out({ ok: false, error: "이미 신청된 인스타 아이디입니다." });
      }
    }

    // 연락처는 앞자리 0이 사라지지 않도록 텍스트로 저장
    sheet.appendRow([new Date(), safe(d.name), "'" + phone, safe(d.andarId), sessions[0] || "", sessions[1] || "", d.gender, bra, d.top, d.bottom, shoes,
      safe(insta), d.agreedMarketing === true ? "Y" : "N"]);
    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: "서버 오류: " + err });
  } finally {
    lock.releaseLock();
  }
}

// 배포 URL을 브라우저에서 열었을 때 동작 확인용
function doGet() {
  return out({ ok: true, message: "ANDAR IN. MOTION apply endpoint" });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 시트에서 수식으로 실행되지 않도록 = + - @ 로 시작하는 값 앞에 ' 를 붙인다
function safe(v) {
  v = String(v).trim();
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
