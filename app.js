(function () {
  const C = window.APP_CONFIG;
  const app = document.getElementById("app");

  // 페이지 이동 간에 유지되는 입력 상태
  const state = { selected: [], form: {}, agree: false, submitting: false, error: "", lastChosen: [] };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const sessionId = (date, time, name) => `${date} ${time} ${name}`;
  const DOW = { "10/24": "SAT", "10/25": "SUN" };

  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 12 12" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6.4l2.6 2.6L10 3.4"/></svg>',
    chevron: '<svg viewBox="0 0 14 9" fill="none"><path d="M1 1.5l6 6 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const mesh = () => '<div class="mesh"><i></i><i></i><i></i></div><div class="grain"></div>';

  // ---------- pages ----------
  function Home() {
    return `
      <section class="hero view">
        ${mesh()}
        <div class="bar"><span>Capsule 001</span><span>2026.10</span></div>
        <div class="mark">
          <h1 class="word">andar</h1>
          <div class="sub">In Motion · Special Session</div>
        </div>
        <div class="foot">
          <div class="when">
            <div class="big">10.24 <span>—</span> 10.25</div>
            <p>움직임으로 이어지는 특별한 이틀,<br />ANDAR IN. MOTION에 초대합니다.</p>
          </div>
          <button class="cta" data-go="/apply"><span>세션 신청</span><span class="arrow">${ICON.arrow}</span></button>
        </div>
      </section>`;
  }

  function tiles() {
    const full = state.selected.length >= C.MAX_SESSIONS;
    const days = `<div class="days"><span></span>${C.DATES.map((d) => `<div class="day"><b>${d.replace("/", ".")}</b><span>${DOW[d] || ""}</span></div>`).join("")}</div>`;
    const rows = C.SCHEDULE.map((row) => {
      const cells = row.sessions.map((name, i) => {
        const id = sessionId(C.DATES[i], row.time, name);
        const on = state.selected.includes(id);
        return `<button type="button" class="tile ${on ? "on" : full ? "dim" : ""}" data-session="${esc(id)}" aria-pressed="${on}"><span class="chk">${ICON.check}</span><span>${esc(name)}</span></button>`;
      }).join("");
      const part = row.time < "12" ? "AM" : row.time < "17" ? "PM" : "EVE";
      return `<div class="slot"><div class="time">${row.time}<small>${part}</small></div>${cells}</div>`;
    }).join("");
    return days + `<div class="slots">${rows}</div>`;
  }

  function selectField(name, label, options) {
    const val = state.form[name] || "";
    const opts = options.map((o) => `<button type="button" class="dd-opt ${val === o ? "on" : ""}" data-value="${esc(o)}" role="option" aria-selected="${val === o}">${esc(o)}</button>`).join("");
    return `<div class="f" data-field="${name}"><label>${label}</label>
      <div class="dd">
        <button type="button" class="in dd-btn ${val ? "" : "empty"}" aria-haspopup="listbox" aria-expanded="false"><span class="dd-label">${val ? esc(val) : "선택"}</span><span class="dd-arrow">${ICON.chevron}</span></button>
        <div class="dd-list" role="listbox">${opts}</div>
      </div>
    </div>`;
  }
  function inputField(name, label, attrs) {
    return `<div class="f" data-field="${name}"><label>${label}</label><input class="in" name="${name}" value="${esc(state.form[name] || "")}" ${attrs || ""} /></div>`;
  }

  function Apply() {
    return `
      <div class="split view">
      <div class="page main">
        <div class="top"><button class="back" data-go="/" aria-label="뒤로">${ICON.back}</button><div class="ttl">Session Application<small>ANDAR. IN MOTION</small></div></div>
        <div class="wrap">
          <h1 class="lead">함께 움직일<br /><em>세션</em>을 골라주세요</h1>
          <p class="lead-sub">최대 ${C.MAX_SESSIONS}개까지 선택할 수 있어요. 선택 후 정보를 입력하고 신청을 완료해주세요.</p>

          <section class="sec">
            <div class="sec-h"><span class="no">01</span><h2>Session</h2><span class="aux" id="count"></span></div>
            <div id="tiles">${tiles()}</div>
            <div class="hint"><span>시간표는 언제든 바꿀 수 있어요</span><button type="button" class="link" data-go="/sessions">세션 정보 확인하기</button></div>
          </section>

          <form id="form" novalidate>
            <section class="sec">
              <div class="sec-h"><span class="no">02</span><h2>Information</h2></div>
              <div class="form">
                ${inputField("name", "성함", 'autocomplete="name" placeholder="홍길동"')}
                ${inputField("phone", "연락처", 'type="tel" inputmode="numeric" placeholder="010-0000-0000" autocomplete="tel"')}
                ${inputField("andarId", "안다르 아이디", 'autocapitalize="off" autocomplete="off" placeholder="andar_id"')}
              </div>
            </section>
            <section class="sec">
              <div class="sec-h"><span class="no">03</span><h2>Size</h2><span class="aux">착용 사이즈</span></div>
              <div class="form">
                <div class="row2">${selectField("bra", "브라탑", C.SIZES.bra)}${selectField("zipup", "집업", C.SIZES.zipup)}</div>
                ${selectField("leggings", "레깅스 <em>기장 · 사이즈</em>", C.SIZES.leggings)}
                ${selectField("shoes", "신발 <em>mm</em>", C.SIZES.shoes)}
              </div>
            </section>
            <section class="sec">
              <label class="agree"><input type="checkbox" name="agree" ${state.agree ? "checked" : ""} /><span class="box">${ICON.check}</span>
                <span><b>[필수] 개인정보 수집·이용 동의</b><br />참가자 선정 및 안내를 위해 성함, 연락처, 안다르 아이디, 사이즈 정보를 수집하며 행사 종료 후 파기합니다.</span></label>
            </section>
          </form>
        </div>
        <div class="dock"><p class="msg" id="err">${esc(state.error)}</p><button class="submit" id="submit" type="submit" form="form"></button></div>
      </div>
      </div>`;
  }

  function art(item, i, cls) {
    const img = item.image ? `<img src="${esc(item.image)}" alt="${esc(item.title || "")}" />` : `<div class="mesh"><i></i><i></i><i></i></div><div class="grain"></div>`;
    return `<div class="art v${(i % 4) + 1} ${cls || ""}">${img}<span class="no">${String(i + 1).padStart(2, "0")}</span></div>`;
  }

  function Sessions() {
    const cards = C.MAIN_MOTION.map((m, i) => `
      <div class="card">${art(m, i)}<div class="body"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></div></div>`).join("");
    const r = C.STRETCH_YOUR_RUN;
    return `
      <div class="page sessions-page view" style="padding-bottom:48px">
        <div class="top"><button class="back" data-go="/apply" aria-label="뒤로">${ICON.back}</button><div class="ttl">Special Session<small>ANDAR. IN MOTION</small></div></div>
        <div class="wrap">
          <div class="banner">${mesh()}<div class="k">10.24 — 10.25</div><h1>Move with<br /><em>andar</em></h1></div>
          <section class="group"><div class="group-h"><h2>MAIN MOTION</h2></div><div class="cards">${cards}</div></section>
          <section class="group"><div class="group-h"><h2>STRETCH YOUR RUN</h2></div>
            <div class="cards"><div class="card wide">${art(r, 0)}<div class="body"><span class="tag">${esc(r.subtitle)}</span><h3>STRETCH YOUR RUN</h3><p>${esc(r.text)}</p></div></div></div>
          </section>
        </div>
      </div>`;
  }

  function Done() {
    const chosen = state.lastChosen.map((s) => {
      const [date, time, ...name] = s.split(" ");
      return `<div>${esc(name.join(" "))}<span>${esc(date)} · ${esc(time)}</span></div>`;
    }).join("");
    return `
      <div class="done view">
        ${mesh()}
        <div class="ring"><svg viewBox="0 0 42 42"><path d="M10 22.5l8 8L32 13"/></svg></div>
        <h2>신청이<br /><em>완료되었습니다</em></h2>
        <p class="msg2">당첨자는 <b>${esc(C.ANNOUNCE_DATE)}</b><br />개별 안내드릴 예정입니다.</p>
        ${chosen ? `<div class="chosen">${chosen}</div>` : ""}
        <button class="cta" data-go="/"><span>처음으로</span></button>
      </div>`;
  }

  // ---------- routing ----------
  const routes = { "/": Home, "/apply": Apply, "/sessions": Sessions, "/done": Done };
  function route() {
    const path = location.hash.replace(/^#/, "") || "/";
    app.innerHTML = (routes[path] || Home)();
    window.scrollTo(0, 0);
    if (path === "/apply") { bindApply(); syncSelection(); }
  }
  window.addEventListener("hashchange", route);

  document.addEventListener("click", (e) => {
    const ddBtn = e.target.closest(".dd-btn");
    const opt = e.target.closest(".dd-opt");
    const keepOpen = ddBtn ? ddBtn.closest(".dd") : opt ? opt.closest(".dd") : null;
    document.querySelectorAll(".dd.open").forEach((d) => { if (d !== keepOpen) closeDropdown(d); });
    if (ddBtn) return toggleDropdown(ddBtn.closest(".dd"));
    if (opt) return selectOption(opt);
    const go = e.target.closest("[data-go]");
    if (go) { readForm(); location.hash = go.dataset.go; return; }
    const tile = e.target.closest("[data-session]");
    if (tile) toggleSession(tile.dataset.session);
  });

  function closeDropdown(dd) {
    dd.classList.remove("open");
    dd.querySelector(".dd-btn").setAttribute("aria-expanded", "false");
  }
  function toggleDropdown(dd) {
    const open = !dd.classList.contains("open");
    dd.classList.toggle("open", open);
    dd.querySelector(".dd-btn").setAttribute("aria-expanded", String(open));
  }
  function selectOption(opt) {
    const dd = opt.closest(".dd");
    const field = dd.closest(".f");
    const name = field.dataset.field;
    const value = opt.dataset.value;
    state.form[name] = value;
    const btn = dd.querySelector(".dd-btn");
    btn.querySelector(".dd-label").textContent = value;
    btn.classList.remove("empty");
    dd.querySelectorAll(".dd-opt").forEach((o) => {
      const on = o.dataset.value === value;
      o.classList.toggle("on", on);
      o.setAttribute("aria-selected", String(on));
    });
    closeDropdown(dd);
    field.classList.remove("err");
  }

  // 선택 상태는 화면을 다시 그리지 않고 제자리에서 갱신 (스크롤 유지)
  function toggleSession(id) {
    const i = state.selected.indexOf(id);
    if (i >= 0) state.selected.splice(i, 1);
    else if (state.selected.length < C.MAX_SESSIONS) state.selected.push(id);
    else return shake();
    state.error = "";
    document.getElementById("tiles").innerHTML = tiles();
    syncSelection();
  }
  function shake() {
    const el = document.getElementById("tiles");
    el.animate([{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 260 });
    setMsg(`세션은 최대 ${C.MAX_SESSIONS}개까지 선택할 수 있어요.`);
  }
  function setMsg(t, info) { const m = document.getElementById("err"); if (m) { m.textContent = t; m.classList.toggle("info", !!info); } state.error = t; }

  function syncSelection() {
    const n = state.selected.length;
    const c = document.getElementById("count");
    if (c) c.textContent = `${n} / ${C.MAX_SESSIONS} 선택`;
    renderSubmit();
  }
  function renderSubmit() {
    const b = document.getElementById("submit");
    if (!b) return;
    const n = state.selected.length;
    b.classList.toggle("ready", n > 0);
    b.disabled = state.submitting;
    b.innerHTML = state.submitting
      ? '<span class="spin"></span><span>신청 중...</span>'
      : `<span>신청하기</span>${n ? `<span class="pill">${n}개 세션</span>` : ""}`;
  }

  // ---------- form ----------
  const FIELDS = ["name", "phone", "andarId", "bra", "zipup", "leggings", "shoes"];
  const TEXT_FIELDS = ["name", "phone", "andarId"];
  function readForm() {
    const f = document.getElementById("form");
    if (!f) return;
    TEXT_FIELDS.forEach((k) => { state.form[k] = f.elements[k].value.trim(); });
    state.agree = f.elements.agree.checked;
  }
  function bindApply() {
    const f = document.getElementById("form");
    f.addEventListener("submit", onSubmit);
    f.addEventListener("input", (e) => {
      const fld = e.target.closest(".f");
      if (fld) fld.classList.remove("err");
      if (e.target.name === "phone") e.target.value = fmtPhone(e.target.value);
    });
  }

  const normPhone = (p) => p.replace(/\D/g, "");
  function fmtPhone(v) {
    const d = normPhone(v).slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  }
  const LABELS = { name: "성함", phone: "연락처", andarId: "안다르 아이디", bra: "브라탑 사이즈", zipup: "집업 사이즈", leggings: "레깅스 기장 및 사이즈", shoes: "신발 사이즈" };

  function validate() {
    const f = state.form;
    if (state.selected.length === 0) return { scroll: "tiles", msg: "참여할 세션을 1개 이상 선택해주세요." };
    for (const k of FIELDS) if (!f[k]) return { field: k, msg: `${LABELS[k]}을(를) ${["bra", "zipup", "leggings", "shoes"].includes(k) ? "선택" : "입력"}해주세요.` };
    if (!/^01[016789]\d{7,8}$/.test(normPhone(f.phone))) return { field: "phone", msg: "연락처 형식을 확인해주세요." };
    if (!state.agree) return { scroll: "form", msg: "개인정보 수집·이용에 동의해주세요." };
    return null;
  }
  function showError(v) {
    document.querySelectorAll(".f.err").forEach((el) => el.classList.remove("err"));
    setMsg(v.msg);
    const target = v.field ? document.querySelector(`[data-field="${v.field}"]`) : document.getElementById(v.scroll);
    if (v.field) { target.classList.add("err"); void target.offsetWidth; }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (state.submitting) return;
    readForm();
    const v = validate();
    if (v) return showError(v);
    setMsg("");
    state.submitting = true;
    renderSubmit();
    try {
      await submit({
        name: state.form.name,
        phone: normPhone(state.form.phone),
        andarId: state.form.andarId,
        sessions: state.selected,
        bra: state.form.bra,
        zipup: state.form.zipup,
        leggings: state.form.leggings,
        shoes: state.form.shoes,
        agreed: true,
      });
      state.lastChosen = state.selected.slice();
      state.selected = []; state.form = {}; state.agree = false; state.submitting = false;
      location.hash = "/done";
    } catch (err) {
      state.submitting = false;
      renderSubmit();
      setMsg(err.message || "신청 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  // 접수가 몰려 서버가 바쁠 때(락 대기 초과·네트워크 끊김)는 자동으로 다시 시도한다
  const MAX_ATTEMPTS = 6;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const isBusy = (msg) => /서버 오류|잠금/.test(msg || "");

  async function postOnce(payload) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    try {
      // text/plain 으로 보내 CORS preflight를 피한다 (Apps Script 웹앱 관례)
      const res = await fetch(C.GAS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctrl.signal });
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  async function submit(payload) {
    if (!C.GAS_URL) return mockSubmit(payload);
    let unsure = false; // 응답을 못 받아서 저장됐는지 모르는 상태
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let data = null;
      try { data = await postOnce(payload); } catch (_) { /* 네트워크/시간초과 */ }

      if (data && data.ok) return;
      // 재시도 중 "이미 신청"이 나오면 앞선 시도가 저장된 것으로 본다
      if (data && unsure && /이미 신청/.test(data.error || "")) return;
      // 검증 실패 등 다시 해도 소용없는 오류는 바로 알린다
      if (data && !isBusy(data.error)) throw new Error(data.error || "신청에 실패했어요.");

      if (!data) unsure = true;
      if (attempt === MAX_ATTEMPTS) break;
      setMsg("접수 중이에요. 잠시만 기다려주세요.", true);
      await sleep(2000 + Math.random() * 3000); // 동시에 재시도가 몰리지 않게 분산
    }
    throw new Error("접수가 몰려 처리하지 못했어요. 잠시 후 다시 시도해주세요.");
  }

  // GAS_URL이 없을 때: 브라우저에 저장 (시연용). 콘솔에서 localStorage.mockApplications 확인 가능
  function mockSubmit(payload) {
    return new Promise((resolve, reject) => setTimeout(() => {
      const list = JSON.parse(localStorage.getItem("mockApplications") || "[]");
      if (list.some((a) => a.phone === payload.phone)) return reject(new Error("이미 신청된 연락처입니다."));
      list.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem("mockApplications", JSON.stringify(list));
      resolve();
    }, 700));
  }

  route();
})();
