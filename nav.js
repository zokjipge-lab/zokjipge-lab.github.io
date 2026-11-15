/* 유주아빠의 족집게 — 공용 상단 메뉴
 * 새 문제 페이지를 만들면 아래 PAGES 에 한 줄만 추가하면 모든 페이지 메뉴에 자동으로 뜬다.
 *   file  : 파일 이름 (사이트 맨 위 폴더 기준)
 *   name  : 메뉴에 보일 이름
 *   short : PC 상단 칩에 보일 짧은 이름
 *   sub   : 범위/난이도 같은 보조 설명
 *   date  : 시험 날짜 (YYYY-MM-DD) — '오늘 시험', '내일', '지난 시험' 표시에 씀
 *   alias : 주소를 이렇게 잘못 쳐도 이 페이지로 보내줄 단어들 (404.html 에서 사용)
 */
(function () {
  "use strict";

  var PAGES = [
    { file: "kor.html",   name: "국어편",        short: "국어",       sub: "품사",               date: "2026-11-16", alias: ["국어", "korean", "kr", "국어편", "품사"] },
    { file: "math.html",  name: "수학편 1회",    short: "수학 1회",   sub: "도형",               date: "2026-11-16", alias: ["수학", "수학1", "수학1회", "수학편", "math1", "도형"] },
    { file: "math2.html", name: "수학편 2회",    short: "수학 2회",   sub: "순서 섞음",          date: "2026-11-16", alias: ["수학2", "수학2회", "수학편2", "수학편2회", "mathtwo", "math02"] },
    { file: "index.html", name: "사회·과학 기본편", short: "사회·과학 기본", sub: "중~하 · 2교시 사회, 3교시 과학", date: "2026-11-17", alias: ["기본", "기본편", "home", "main", "basic", "사회", "과학", "사회과학", "index"] },
    { file: "real.html",  name: "사회·과학 실전편", short: "사회·과학 실전", sub: "중~상 · 2교시 사회, 3교시 과학", date: "2026-11-17", alias: ["실전", "실전편", "real", "hard", "사회실전", "과학실전"] },
    { file: "info.html",  name: "정보편",        short: "정보",       sub: "실전",               date: "2026-11-13", alias: ["정보", "정보편", "information", "computer", "코딩"] }
  ];

  /* ---------- 날짜 계산 (한국 시간 기준) ---------- */
  var DAY = 86400000;
  function kstToday() {
    var now = new Date(Date.now() + 9 * 3600000);
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  }
  function dayValue(s) { var p = s.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  function dateLabel(s) { var d = new Date(dayValue(s)); return (d.getUTCMonth() + 1) + "월 " + d.getUTCDate() + "일 (" + WEEK[d.getUTCDay()] + ")"; }
  function status(s) {
    var diff = Math.round((dayValue(s) - kstToday()) / DAY);
    if (diff < 0) return { key: "past", text: "시험 끝" };
    if (diff === 0) return { key: "today", text: "오늘 시험" };
    if (diff === 1) return { key: "soon", text: "내일 시험" };
    return { key: "later", text: "D-" + diff };
  }

  /* ---------- 현재 페이지 / 주소 정리 ---------- */
  function stem(file) { return file.replace(/\.html?$/i, "").toLowerCase(); }
  function currentFile() {
    var seg = decodeURIComponent(location.pathname).split("/").pop().toLowerCase();
    if (!seg) return "index.html";
    if (!/\.html?$/.test(seg)) seg += ".html";
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].file === seg.replace(/\.htm$/, ".html")) return PAGES[i].file;
    return null;
  }
  function norm(s) {
    return String(s).toLowerCase().normalize("NFC")
      .replace(/\.[a-z]{2,5}$/i, "")
      .replace(/[^0-9a-z가-힣]/g, "");
  }
  function lev(a, b) {
    var m = a.length, n = b.length, prev = [], cur, i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }
  /* 잘못 친 주소 → { page, sure } 또는 후보 목록 */
  function match(path) {
    var segs = decodeURIComponent(path || "").split(/[\/\\]+/).filter(Boolean).reverse();
    if (!segs.length) return { page: PAGES[3], sure: true, candidates: [] };
    var best = null, bestD = 99, tie = false, scored = [];
    segs.forEach(function (seg) {
      var q = norm(seg);
      if (!q) return;
      PAGES.forEach(function (p) {
        var keys = [stem(p.file)].concat(p.alias).map(norm);
        var d = 99;
        keys.forEach(function (k) {
          if (k === q) d = 0;
          else d = Math.min(d, lev(q, k));
        });
        scored.push({ page: p, d: d, len: q.length });
        if (d < bestD) { best = p; bestD = d; tie = false; }
        else if (d === bestD && best !== p) tie = true;
      });
    });
    if (!best) return { page: null, sure: false, candidates: [] };
    var lenOk = scored.filter(function (s) { return s.page === best && s.d === bestD; })[0].len;
    var limit = lenOk <= 3 ? 1 : 2;
    var sure = !tie && bestD <= limit;
    var candidates = scored
      .filter(function (s) { return s.d <= Math.max(limit, 2); })
      .sort(function (a, b) { return a.d - b.d; })
      .map(function (s) { return s.page; })
      .filter(function (p, i, arr) { return arr.indexOf(p) === i; });
    return { page: sure ? best : null, sure: sure, candidates: candidates };
  }

  /* ---------- 그룹 (시험일별, 지난 시험은 아래로) ---------- */
  function groups() {
    var map = {}, order = [];
    PAGES.forEach(function (p) {
      var st = status(p.date), key = st.key === "past" ? "past" : p.date;
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(p);
    });
    order.sort(function (a, b) {
      if (a === "past") return 1;
      if (b === "past") return -1;
      return dayValue(a) - dayValue(b);
    });
    return order.map(function (k) {
      if (k === "past") return { title: "지난 시험", st: { key: "past", text: "" }, pages: map[k] };
      var st = status(k);
      return { title: dateLabel(k), st: st, pages: map[k] };
    });
  }
  function ordered() { return groups().reduce(function (a, g) { return a.concat(g.pages); }, []); }

  /* ---------- 스타일 ---------- */
  var css = [
    ":root{--zk-nav-h:52px}",
    ".zk-nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:6;height:var(--zk-nav-h);background:var(--night,#121838);color:var(--night-ink,#EEF0FF);border-bottom:1px solid #ffffff1f;font-family:var(--body,'Noto Sans KR',system-ui,sans-serif)}",
    ".zk-nav *{box-sizing:border-box}",
    ".zk-nav .zk-in{max-width:720px;height:100%;margin:0 auto;display:flex;align-items:center;gap:10px;padding:0 max(12px,env(safe-area-inset-right,0px)) 0 max(12px,env(safe-area-inset-left,0px))}",
    ".zk-brand{flex:none;display:flex;align-items:baseline;gap:4px;color:inherit;text-decoration:none;white-space:nowrap}",
    ".zk-brand small{font-size:11px;color:var(--night-muted,#A9AFD6)}",
    ".zk-brand b{font-family:var(--display,'Black Han Sans',sans-serif);font-weight:400;font-size:19px;color:var(--star,#F0B24A);letter-spacing:.02em}",
    ".zk-chips{flex:1;min-width:0;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0}",
    ".zk-chips::-webkit-scrollbar{display:none}",
    ".zk-chip{flex:none;font-size:13px;font-weight:700;line-height:1;padding:9px 12px;border-radius:999px;color:var(--night-ink,#EEF0FF);background:#ffffff14;border:1px solid #ffffff24;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}",
    ".zk-chip:hover{background:#ffffff26}",
    ".zk-chip[aria-current=page]{background:var(--star,#F0B24A);border-color:var(--star,#F0B24A);color:#1a1300}",
    ".zk-chip.past{opacity:.6}",
    ".zk-dot{width:7px;height:7px;border-radius:50%;background:#FF7D8F;flex:none}",
    ".zk-chip[aria-current=page] .zk-dot{background:#7a1020}",
    ".zk-here{display:none;flex:1;min-width:0;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".zk-here span{color:var(--night-muted,#A9AFD6);font-weight:500;margin-right:4px}",
    ".zk-all{flex:none;display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:14px;font-weight:700;padding:9px 14px;min-height:40px;border-radius:12px;border:0;background:var(--accent,#3B4CC6);color:#fff;cursor:pointer}",
    ".zk-all svg{width:16px;height:16px}",
    ".zk-all:focus-visible,.zk-chip:focus-visible,.zk-item:focus-visible,.zk-x:focus-visible{outline:3px solid var(--star,#F0B24A);outline-offset:2px}",
    "@media (max-width:700px){.zk-chips{display:none}.zk-here{display:block}.zk-brand small{display:none}}",
    "@media (min-width:701px){.zk-nav .zk-in{max-width:880px}}",
    "@media (min-width:701px) and (max-width:900px){.zk-brand small{display:none}.zk-chip{padding:9px 10px}}",
    /* 시트 */
    ".zk-scrim{position:fixed;inset:0;z-index:60;background:var(--scrim,rgba(14,17,36,.55));display:flex;align-items:flex-end;justify-content:center;font-family:var(--body,'Noto Sans KR',system-ui,sans-serif)}",
    ".zk-scrim[hidden]{display:none!important}",
    ".zk-sheet{width:100%;max-width:560px;max-height:min(82vh,720px);overflow:auto;overscroll-behavior:contain;background:var(--surface,#fff);color:var(--ink,#171A33);border-radius:22px 22px 0 0;padding:8px 16px calc(18px + env(safe-area-inset-bottom,0px));box-shadow:0 -12px 40px -12px rgba(0,0,0,.45)}",
    "@media (min-width:701px){.zk-scrim{align-items:flex-start;padding-top:72px}.zk-sheet{border-radius:22px;padding-bottom:18px}}",
    ".zk-grab{width:40px;height:4px;border-radius:4px;background:var(--line,#DCDFEE);margin:4px auto 6px}",
    "@media (min-width:701px){.zk-grab{display:none}}",
    ".zk-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 2px 4px}",
    ".zk-head h2{margin:0;font-family:var(--display,'Black Han Sans',sans-serif);font-weight:400;font-size:22px}",
    ".zk-x{width:40px;height:40px;border-radius:12px;border:1px solid var(--line,#DCDFEE);background:var(--surface,#fff);color:var(--ink,#171A33);display:grid;place-items:center;cursor:pointer;font:inherit}",
    ".zk-x svg{width:18px;height:18px}",
    ".zk-g{margin-top:14px}",
    ".zk-gh{display:flex;align-items:center;gap:8px;margin:0 2px 8px;font-size:13px;font-weight:700;color:var(--muted,#5B6084)}",
    ".zk-badge{font-size:11.5px;font-weight:700;padding:2px 8px;border-radius:999px;line-height:1.5}",
    ".zk-badge.today{background:var(--bad,#C3364A);color:#fff}",
    ".zk-badge.soon{background:var(--star-soft,#FBEFD9);color:var(--star,#C77A12)}",
    ".zk-badge.later{background:var(--accent-soft,#E5E8FB);color:var(--accent,#3B4CC6)}",
    ".zk-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}",
    ".zk-item{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;border:1px solid var(--line,#DCDFEE);background:var(--surface,#fff);color:inherit;text-decoration:none;min-height:60px}",
    ".zk-item:hover{border-color:var(--accent,#3B4CC6)}",
    ".zk-item .zk-t{flex:1;min-width:0;display:grid;gap:2px}",
    ".zk-item b{font-size:16px}",
    ".zk-item small{font-size:12.5px;color:var(--muted,#5B6084);word-break:keep-all}",
    ".zk-item .zk-go{flex:none;color:var(--muted,#5B6084)}",
    ".zk-item[aria-current=page]{background:var(--accent-soft,#E5E8FB);border-color:var(--accent,#3B4CC6);box-shadow:inset 0 0 0 1px var(--accent,#3B4CC6)}",
    ".zk-item[aria-current=page] .zk-go{font-size:12px;font-weight:700;color:var(--accent,#3B4CC6)}",
    ".zk-g.past .zk-item{opacity:.7}",
    ".zk-foot{margin:16px 2px 0;font-size:12px;color:var(--muted,#5B6084);text-align:center;word-break:keep-all}",
    /* 기존 페이지의 고정 답안바를 메뉴 아래로 내림 */
    ".bar{top:calc(env(safe-area-inset-top,0px) + var(--zk-nav-h))!important}",
    ".card{scroll-margin-top:calc(150px + var(--zk-nav-h))!important}",
    "@media (prefers-reduced-motion:no-preference){.zk-sheet{animation:zkUp .22s ease-out}}",
    "@keyframes zkUp{from{transform:translateY(24px);opacity:.5}to{transform:none;opacity:1}}"
  ].join("\n");

  /* ---------- 마크업 ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var ICON_GRID = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>';
  var ICON_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>';

  function sheetHTML(cur) {
    return '<div class="zk-sheet" role="dialog" aria-modal="true" aria-labelledby="zk-title">' +
      '<div class="zk-grab"></div>' +
      '<div class="zk-head"><h2 id="zk-title">전체 문제</h2><button type="button" class="zk-x" aria-label="닫기">' + ICON_X + '</button></div>' +
      groups().map(function (g) {
        return '<section class="zk-g' + (g.st.key === "past" ? " past" : "") + '">' +
          '<h3 class="zk-gh">' + esc(g.title) + (g.st.text ? ' <span class="zk-badge ' + g.st.key + '">' + esc(g.st.text) + '</span>' : "") + '</h3>' +
          '<ul class="zk-list">' + g.pages.map(function (p) {
            var here = p.file === cur;
            return '<li><a class="zk-item" href="./' + p.file + '"' + (here ? ' aria-current="page"' : "") + '>' +
              '<span class="zk-t"><b>' + esc(p.name) + '</b><small>' + esc(p.sub) + '</small></span>' +
              '<span class="zk-go">' + (here ? "지금 보는 중" : "›") + '</span></a></li>';
          }).join("") + '</ul></section>';
      }).join("") +
      '<p class="zk-foot">다른 문제로 넘어가도 푼 답안은 이 기기에 그대로 남아 있어.</p>' +
      '</div>';
  }

  function build() {
    var cur = currentFile();
    var curPage = PAGES.filter(function (p) { return p.file === cur; })[0];

    var style = document.createElement("style");
    style.id = "zk-nav-style";
    style.textContent = css;

    var nav = document.createElement("nav");
    nav.className = "zk-nav";
    nav.setAttribute("aria-label", "문제 이동");
    nav.innerHTML = '<div class="zk-in">' +
      '<a class="zk-brand" href="./index.html"><small>유주아빠의</small><b>족집게</b></a>' +
      '<div class="zk-chips">' + ordered().map(function (p) {
        var st = status(p.date);
        return '<a class="zk-chip' + (st.key === "past" ? " past" : "") + '" href="./' + p.file + '"' + (p.file === cur ? ' aria-current="page"' : "") + ' title="' + esc(p.name + " · " + dateLabel(p.date) + " · " + st.text) + '">' +
          (st.key === "today" ? '<span class="zk-dot" aria-hidden="true"></span>' : "") + esc(p.short) + '</a>';
      }).join("") + '</div>' +
      '<div class="zk-here">' + (curPage ? '<span>지금</span>' + esc(curPage.name) : '문제 고르기') + '</div>' +
      '<button type="button" class="zk-all" aria-haspopup="dialog" aria-expanded="false" aria-controls="zk-sheet">' + ICON_GRID + '전체 문제</button>' +
      '</div>';

    var scrim = document.createElement("div");
    scrim.className = "zk-scrim";
    scrim.id = "zk-sheet";
    scrim.hidden = true;
    scrim.innerHTML = sheetHTML(cur);

    var btn = nav.querySelector(".zk-all");
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      scrim.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      document.documentElement.style.overflow = "hidden";
      var first = scrim.querySelector(".zk-item[aria-current]") || scrim.querySelector(".zk-item");
      if (first) { first.focus({ preventScroll: true }); first.scrollIntoView({ block: "nearest" }); }
    }
    function close() {
      scrim.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      document.documentElement.style.overflow = "";
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    btn.addEventListener("click", open);
    scrim.addEventListener("click", function (e) { if (e.target === scrim || e.target.closest(".zk-x")) close(); });
    scrim.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      if (e.key === "Tab") {
        var f = scrim.querySelectorAll("a,button"), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });

    // PC 칩: 지금 페이지가 보이게 가로 스크롤 맞춤
    requestAnimationFrame(function () {
      var on = nav.querySelector(".zk-chip[aria-current]");
      if (on) on.scrollIntoView({ block: "nearest", inline: "center" });
    });

    return { style: style, nav: nav, scrim: scrim, open: open };
  }

  var ui = build();
  var me = document.currentScript;
  (document.head || document.documentElement).appendChild(ui.style);
  if (me && me.parentNode && me.parentNode !== document.head) me.insertAdjacentElement("afterend", ui.nav);
  else document.body.insertBefore(ui.nav, document.body.firstChild);
  document.body ? document.body.appendChild(ui.scrim) : document.addEventListener("DOMContentLoaded", function () { document.body.appendChild(ui.scrim); });

  window.ZK = { PAGES: PAGES, match: match, status: status, dateLabel: dateLabel, openMenu: ui.open };
})();
