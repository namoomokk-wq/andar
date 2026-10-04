// 서비스 설정값 — 실제 자료 수령 후 여기만 수정하면 됩니다.
window.APP_CONFIG = {
  // Google Apps Script 웹앱 URL (gas/README.md 참고). 비워두면 mock 모드(브라우저 localStorage에 저장)로 동작합니다.
  GAS_URL: "https://script.google.com/macros/s/AKfycbyO-Dy0yDqlmeddPecLY282XrCAH4SDUElwa5KW6MlxzMrucCj4I8OPTrA6pbImtANHJA/exec",

  ANNOUNCE_DATE: "10/16(금)",
  MAX_SESSIONS: 2,

  // 1P 행사 정보
  EVENT: { period: "2026.10.24(토) ~ 2026.10.25(일)", place: "Y173 - 성수동 연무장17길 3" },

  // 사이즈표 이미지 경로 (10/7 확정 전달 예정). 비워두면 안내 문구가 표시됩니다.
  SIZE_CHART_IMAGE: "",

  // 시간표: 행 = 시간대, 열 = 날짜. 각 셀은 세션명.
  DATES: ["10/24", "10/25"],
  SCHEDULE: [
    { time: "10:30", sessions: ["STRETCH YOUR CITY", "STRETCH YOUR CITY"] },
    { time: "10:30", sessions: ["MUSIC FLOW YOGA", "MOTION PILATES"] },
    { time: "14:00", sessions: ["BOOT CAMP", "BURN BARRE"] },
    { time: "19:30", sessions: ["K-SOUND BATH", "K-SOUND BATH"] },
  ],

  // 드롭다운 옵션 (가정값 — 실제 사이즈표로 교체 필요)
  SIZES: {
    bra: ["XS", "S", "M", "L", "XL"],
    zipup: ["XS", "S", "M", "L", "XL"],
    leggings: [
      "숏 XS", "숏 S", "숏 M", "숏 L", "숏 XL",
      "레귤러 XS", "레귤러 S", "레귤러 M", "레귤러 L", "레귤러 XL",
      "롱 XS", "롱 S", "롱 M", "롱 L", "롱 XL",
    ],
    shoes: ["225", "230", "235", "240", "245", "250", "255", "260", "265", "270", "275", "280"],
  },

  // 3P 세션 정보 (이미지/문구는 자료 수령 후 교체. image에 경로를 넣으면 표시됩니다)
  MAIN_MOTION: [
    { title: "STRETCH YOUR CITY", text: "도시 속에서 몸을 깨우는 스트레치", image: "" },
    { title: "MUSIC FLOW YOGA", text: "음악과 함께 흐르는 요가", image: "" },
    { title: "MOTION PILATES", text: "움직임에 집중하는 필라테스", image: "" },
    { title: "BOOT CAMP · BURN BARRE", text: "에너지를 끌어올리는 강도 높은 세션", image: "" },
  ],
  STRETCH_YOUR_RUN: {
    subtitle: "트레이닝 + 슬로우조깅",
    text: "가볍게 달리고, 충분히 늘리고, 함께 완주하는 러닝 세션",
    image: "",
  },
  K_SOUND_BATH: {
    subtitle: "사운드 배스",
    text: "이미지·문구는 10/7 확정 후 전달 예정입니다.",
    image: "",
  },
  SPECIAL_GIFT: {
    subtitle: "참가자 전원 증정",
    text: "이미지·문구는 10/7 확정 후 전달 예정입니다.",
    image: "",
  },
};
