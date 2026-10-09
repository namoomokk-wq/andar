/**
 * ANDAR IN. MOTION 신청 접수용 Google Apps Script
 * 스프레드시트에 연결된 스크립트(확장 프로그램 > Apps Script)에 붙여넣고 웹앱으로 배포하세요. (gas/README.md 참고)
 */
var SHEET_NAME = "신청";
var MIN_ELAPSED_SEC = 3;

// ---- config.js에서 생성됨: 직접 수정하지 말고 config.js 수정 후 `node gas/sync.js` 실행 ----
var MAX_SESSIONS = 2;
var DEADLINE = new Date("2026-10-15T00:00:00+09:00");
var DATES = ["10/24","10/25"];
var SCHEDULE = [
  {"time":"10:30","sessions":["STRETCH YOUR RUN","STRETCH YOUR RUN"]},
  {"time":"12:30","sessions":["MUSIC FLOW YOGA","POWER PILATES"]},
  {"time":"16:30","sessions":["BURN BOOT CAMP","MOVE & RESET YOGA"]},
  {"time":"19:30","sessions":["K - SOUND BATH","K - SOUND BATH"]}
];
var SIZES = {"male":{"top":["M","L","XL","2XL"],"bottom":["M","L","XL","2XL"]},"female":{"top":["S","M","L","XL"],"bra":["S","M","L","XL"],"bottom":["S","M","L","XL"]},"shoes":["230","235","240","245","250","255","260","265","270","275"]};
// ---- 생성 끝 ----

var GENDER_KEY = { "남": "male", "여": "female" };
// 사이트가 보내는 세션 값은 "날짜 시간 세션명" 형식
var VALID_SESSIONS = (function () {
  var list = [];
  SCHEDULE.forEach(function (row) {
    row.sessions.forEach(function (name, i) { list.push(DATES[i] + " " + row.time + " " + name); });
  });
  return list;
})();
// 기존 열 순서(1~11열)는 유지하고 새 항목은 뒤에 추가한다 (운영 시트 호환)
var HEADERS = ["접수시각", "성함", "연락처", "안다르 아이디", "세션1", "세션2", "성별", "브라탑", "상의", "하의", "신발", "인스타 아이디", "마케팅 동의"];
var COL = { phone: 3, andarId: 4, insta: 12 };

// 중복 비교용 정규화: safe()가 붙인 ' 접두어 제거, 공백 제거, 소문자
function norm(v) { return String(v == null ? "" : v).replace(/^'/, "").replace(/\s/g, "").toLowerCase(); }
function normInsta(v) { return norm(v).replace(/^@/, ""); }

// 중복 확인: 연락처·안다르 아이디·인스타 아이디. 걸리면 {field, error}, 없으면 null
// 필요한 열(연락처·안다르 아이디, 인스타 아이디)만 읽는다
function findDup(sheet, phone, andarId, insta) {
  var n = sheet.getLastRow() - 1;
  if (n < 1) return null;
  var ids = sheet.getRange(2, COL.phone, n, COL.andarId - COL.phone + 1).getValues();
  var instas = sheet.getRange(2, COL.insta, n, 1).getValues();
  var nId = norm(andarId), nInsta = normInsta(insta);
  for (var r = 0; r < n; r++) {
    if (String(ids[r][0]).replace(/\D/g, "") === phone) return { field: "phone", error: "이미 신청된 연락처입니다." };
    if (norm(ids[r][COL.andarId - COL.phone]) === nId) return { field: "andarId", error: "이미 신청된 안다르 아이디입니다." };
    if (nInsta && normInsta(instas[r][0]) === nInsta) return { field: "instaId", error: "이미 신청된 인스타 아이디입니다." };
  }
  return null;
}

// 1단계 사전 확인용: 연락처와 안다르 아이디가 같은 행에서 함께 일치할 때만 중복으로 본다.
// (한 항목만으로 응답하면 아무 연락처나 넣어 신청 여부를 알아낼 수 있으므로. 한 항목만 겹치는 경우는 최종 신청에서 걸러진다)
function findSamePerson(sheet, phone, andarId) {
  var n = sheet.getLastRow() - 1;
  if (n < 1 || !phone || !norm(andarId)) return false;
  var ids = sheet.getRange(2, COL.phone, n, COL.andarId - COL.phone + 1).getValues();
  var nId = norm(andarId);
  for (var r = 0; r < n; r++) {
    if (String(ids[r][0]).replace(/\D/g, "") === phone && norm(ids[r][COL.andarId - COL.phone]) === nId) return true;
  }
  return false;
}

// 내부 오류 내용은 실행 로그(Apps Script > 실행)에만 남기고, 응답에는 일반 문구만 보낸다.
// "서버 오류"로 시작해야 사이트가 일시적 오류로 보고 자동 재시도한다.
function serverError(err) {
  console.error(err && err.stack ? err.stack : err);
  return out({ ok: false, error: "서버 오류: 잠시 후 다시 시도해주세요." });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { d = null; }
  if (!d || typeof d !== "object") return out({ ok: false, error: "요청 형식이 올바르지 않아요." });

  // 1단계 NEXT 시 중복 사전 확인 (읽기 전용이라 잠금 없이 바로 처리 — 빠르게 응답)
  if (d.action === "check") {
    try {
      if (new Date() >= DEADLINE) return out({ ok: false, error: "클래스 신청이 마감되었습니다." });
      var same = findSamePerson(getSheet(), String(d.phone || "").replace(/\D/g, ""), d.andarId);
      return out(same ? { ok: false, field: "phone", error: "이미 신청하신 연락처와 안다르 아이디입니다." } : { ok: true });
    } catch (err) { return serverError(err); }
  }

  // 봇 의심(허니팟 입력·너무 빠른 제출)은 저장하지 않고 성공처럼 응답
  if (d.website || (typeof d.elapsed === "number" && d.elapsed < MIN_ELAPSED_SEC)) return out({ ok: true });
  if (new Date() >= DEADLINE) return out({ ok: false, error: "클래스 신청이 마감되었습니다." });

  // 입력 검증은 잠금 밖에서 끝낸다 (잠금은 중복 검사·기록 구간에만 잡아 대기열을 짧게 유지)
  var v = validate(d);
  if (v.error) return out({ ok: false, error: v.error });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // 오픈 직후 동시 접수 대비
  } catch (err) {
    return serverError(err); // 잠금 대기 초과 — 사이트가 자동 재시도한다
  }
  try {
    var sheet = getSheet();
    var dup = findDup(sheet, v.phone, d.andarId, v.insta);
    if (dup) return out({ ok: false, field: dup.field, error: dup.error });

    // 연락처는 앞자리 0이 사라지지 않도록 텍스트로 저장
    sheet.appendRow([new Date(), safe(d.name), "'" + v.phone, safe(d.andarId), v.sessions[0] || "", v.sessions[1] || "", d.gender, v.bra, d.top, d.bottom, v.shoes,
      safe(v.insta), d.agreedMarketing === true ? "Y" : "N"]);
    // 잠금을 풀기 전에 기록을 확정해야 바로 다음 요청의 중복 검사에 이 행이 보인다
    SpreadsheetApp.flush();
    return out({ ok: true });
  } catch (err) {
    return serverError(err);
  } finally {
    lock.releaseLock();
  }
}

// 통과하면 { phone, insta, sessions, bra, shoes }, 실패하면 { error }
function validate(d) {
  var required = ["name", "gender", "phone", "andarId", "top", "bottom"];
  for (var i = 0; i < required.length; i++) {
    if (!d[required[i]] || String(d[required[i]]).trim() === "") return { error: "필수 항목이 비어 있어요." };
  }
  var sz = SIZES[GENDER_KEY[d.gender]];
  if (!sz) return { error: "성별을 확인해주세요." };
  var phone = String(d.phone).replace(/\D/g, "");
  if (!/^01[016789]\d{7,8}$/.test(phone)) return { error: "연락처 형식을 확인해주세요." };
  var sessions = Array.isArray(d.sessions) ? d.sessions : [];
  if (sessions.length < 1 || sessions.length > MAX_SESSIONS) return { error: "세션은 1~" + MAX_SESSIONS + "개 선택해주세요." };
  var insta = d.instaId ? String(d.instaId).trim() : "";
  if (String(d.name).length > 30 || String(d.andarId).length > 50 || insta.length > 50) return { error: "입력 길이를 확인해주세요." };
  for (var s = 0; s < sessions.length; s++) {
    if (VALID_SESSIONS.indexOf(sessions[s]) < 0 || sessions.indexOf(sessions[s]) !== s) return { error: "세션 선택을 확인해주세요." };
  }
  var hasRun = sessions.some(function (x) { return / STRETCH YOUR RUN$/.test(x); });
  var bra = sz.bra ? String(d.bra || "") : "-";
  var shoes = hasRun ? String(d.shoes || "") : "-";
  if (sz.top.indexOf(String(d.top)) < 0 || sz.bottom.indexOf(String(d.bottom)) < 0 ||
      (sz.bra && sz.bra.indexOf(bra) < 0) || (hasRun && SIZES.shoes.indexOf(shoes) < 0)) return { error: "사이즈 선택을 확인해주세요." };
  return { phone: phone, insta: insta, sessions: sessions, bra: bra, shoes: shoes };
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
