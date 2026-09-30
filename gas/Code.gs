/**
 * ANDAR IN. MOTION 신청 접수용 Google Apps Script
 * 스프레드시트에 연결된 스크립트(확장 프로그램 > Apps Script)에 붙여넣고 웹앱으로 배포하세요. (gas/README.md 참고)
 */
var SHEET_NAME = "신청";
var MAX_SESSIONS = 2;
var HEADERS = ["접수시각", "성함", "연락처", "안다르 아이디", "세션1", "세션2", "브라탑", "집업", "레깅스", "신발", "동의"];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // 오픈 직후 동시 접수 대비
    var d = JSON.parse(e.postData.contents);

    var required = ["name", "phone", "andarId", "bra", "zipup", "leggings", "shoes"];
    for (var i = 0; i < required.length; i++) {
      if (!d[required[i]] || String(d[required[i]]).trim() === "") return out({ ok: false, error: "필수 항목이 비어 있어요." });
    }
    var phone = String(d.phone).replace(/\D/g, "");
    if (!/^01[016789]\d{7,8}$/.test(phone)) return out({ ok: false, error: "연락처 형식을 확인해주세요." });
    var sessions = d.sessions || [];
    if (sessions.length < 1 || sessions.length > MAX_SESSIONS) return out({ ok: false, error: "세션은 1~" + MAX_SESSIONS + "개 선택해주세요." });
    if (d.agreed !== true) return out({ ok: false, error: "개인정보 수집·이용 동의가 필요해요." });

    var sheet = getSheet();
    var last = sheet.getLastRow();
    if (last > 1) {
      var phones = sheet.getRange(2, 3, last - 1, 1).getValues();
      for (var r = 0; r < phones.length; r++) {
        if (String(phones[r][0]).replace(/\D/g, "") === phone) return out({ ok: false, error: "이미 신청된 연락처입니다." });
      }
    }

    // 연락처는 앞자리 0이 사라지지 않도록 텍스트로 저장
    sheet.appendRow([new Date(), d.name, "'" + phone, d.andarId, sessions[0] || "", sessions[1] || "", d.bra, d.zipup, d.leggings, d.shoes, "Y"]);
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

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
