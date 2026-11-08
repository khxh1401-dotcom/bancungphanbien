(function () {
  var $ = function (id) { return document.getElementById(id); };
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function load(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]; }); }
  function lf(s) { var c = s.charAt(1); return (c && c === c.toUpperCase() && c !== c.toLowerCase()) ? s : s.charAt(0).toLowerCase() + s.slice(1); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function extend(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function closest(el, sel) { return el && el.closest ? el.closest(sel) : null; }
  function reduceMotion() { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
  function scrollToEl(el, block) { if (el) el.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: block || "start" }); }
  function fmtNum(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function today() { var d = new Date(); return (d.getDate() < 10 ? "0" : "") + d.getDate() + "/" + (d.getMonth() < 9 ? "0" : "") + (d.getMonth() + 1) + "/" + d.getFullYear(); }
  /* Bỏ dấu để tìm kiếm: “điện thoại” và “dien thoai” cho cùng kết quả */
  function norm(s) {
    s = String(s || "").toLowerCase();
    if (s.normalize) s = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
    return s.replace(/đ/g, "d").replace(/\s+/g, " ").trim();
  }

  /* Trong khung của Google Apps Script, có lúc trang không được lưu gì vào trình duyệt */
  var storageOK = (function () { try { localStorage.setItem("bcpb-test", "1"); localStorage.removeItem("bcpb-test"); return true; } catch (e) { return false; } })();

  /* Sao chép: chép qua ô ẩn ngay trong cú bấm (iPhone chỉ cho phép cách này); nếu không được mới thử clipboard */
  function copyNow(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "-9999px"; ta.style.fontSize = "16px";
    document.body.appendChild(ta);
    ta.focus(); ta.select(); ta.setSelectionRange(0, text.length);
    var done = false;
    try { done = document.execCommand("copy"); } catch (e) { done = false; }
    document.body.removeChild(ta);
    return done;
  }
  function copyText(text, ok, fail) {
    if (copyNow(text)) { ok(); return; }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, fail);
      else fail();
    } catch (e) { fail(); }
  }
  /* Nút cần bấm hai lần mới làm (xóa, làm lại) */
  function twoStep(btn, armedText, fn) {
    if (btn.getAttribute("data-armed")) {
      clearTimeout(Number(btn.getAttribute("data-armed")));
      btn.removeAttribute("data-armed"); btn.textContent = btn.getAttribute("data-label");
      fn(); return;
    }
    btn.setAttribute("data-label", btn.textContent);
    btn.textContent = armedText;
    btn.setAttribute("data-armed", String(setTimeout(function () { btn.removeAttribute("data-armed"); btn.textContent = btn.getAttribute("data-label"); }, 4000)));
  }

  var LV_WORD = { 1: "Dễ", 2: "Vừa", 3: "Khó" };
  var TIER_NAME = { 1: "Làm quen", 2: "Vững vàng", 3: "Thử thách" };
  var P5 = [null, ["Phát biểu", "hs"], ["Phân tích", "ai"], ["Phản hồi", "ai"], ["Phản bác", "both"], ["Phát huy", "hs"]];
  function dotsHtml(n) { return "<span class=\"lvdots\" aria-hidden=\"true\">" + [1, 2, 3].map(function (k) { return "<i" + (k <= n ? " class=\"on\"" : "") + "></i>"; }).join("") + "</span>"; }
  function keysHtml(p) { return (p || []).map(function (k) { return "<i class=\"k " + P5[k][1] + "\"></i>"; }).join(""); }
  function stepLabel(p) {
    if (!p || !p.length) return "";
    return "Bước " + (p.length > 1 ? p[0] + "–" + p[p.length - 1] : p[0]) + " · " + p.map(function (k) { return P5[k][0]; }).join(", ");
  }

  /* ---------- Thông tin nhóm (sửa ở khối BCPB_INFO đầu trang) ---------- */
  var INFO = (typeof BCPB_INFO === "object" && BCPB_INFO) ? BCPB_INFO : {};
  function str(v, d) { v = typeof v === "string" ? v.replace(/\s+/g, " ").trim() : ""; return v || d; }
  var SCHOOL = str(INFO.truong, "Trường THPT Phan Văn Trị"), PLACE = str(INFO.diaPhuong, "thành phố Cần Thơ");
  var TEACHER = str(INFO.giaoVien, ""), YEAR = str(INFO.namHoc, "2026–2027");
  var PEOPLE = (typeof INFO.hocSinh === "string" ? [INFO.hocSinh] : Object.prototype.toString.call(INFO.hocSinh) === "[object Array]" ? INFO.hocSinh : [])
    .map(function (p) { return str(p, ""); }).filter(function (p) { return !!p; });
  function bare(n) { return n.replace(/\s*\([^)]*\)/g, "").replace(/\s+/g, " ").trim(); }
  function apaJoin(list) {
    if (list.length < 2) return list.join("");
    if (list.length === 2) return list[0] + ", & " + list[1];
    return list.slice(0, -1).join(", ") + ", & " + list[list.length - 1];
  }
  function renderInfo() {
    each(document.querySelectorAll("[data-info=\"namHoc\"]"), function (x) { x.textContent = YEAR; });
    var group = "Nhóm học sinh " + SCHOOL;
    $("paperAuthors").innerHTML = (PEOPLE.length ? "Học sinh thực hiện: " + PEOPLE.map(function (p) { return "<b>" + esc(p) + "</b>"; }).join(" · ") : "<b>" + esc(group) + "</b>") +
      (TEACHER ? "<br>Giáo viên hướng dẫn: " + esc(TEACHER) : "");
    $("paperAff").textContent = SCHOOL + ", " + PLACE;
    $("footSchool").textContent = SCHOOL + ", " + PLACE;
    var fp = [];
    if (PEOPLE.length) fp.push("Học sinh thực hiện: " + PEOPLE.join(", "));
    if (TEACHER) fp.push("Giáo viên hướng dẫn: " + TEACHER);
    $("footPeople").textContent = fp.join(" · ");
    $("footPeople").hidden = !fp.length;
    var authors = PEOPLE.length ? apaJoin(PEOPLE.map(bare)) : group;
    $("citeText").innerHTML = esc(authors.replace(/\.$/, "")) + ". (2026). <i>Bạn cùng phản biện: Mô hình đối thoại với trí tuệ nhân tạo rèn luyện tư duy phản biện cho học sinh trung học phổ thông</i> [Trang web]. " + esc(SCHOOL + ", " + PLACE) + ".";
  }

  /* ---------- Hình vòng 5P ở đầu trang (theo bản vẽ “Đối âm”) ---------- */
  function buildRing() {
    var host = $("heroRing");
    if (!host || !document.createElementNS) return;
    var NS = "http://www.w3.org/2000/svg", anim = !reduceMotion();
    function el(name, attrs, parent) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function f(n) { return Math.round(n * 100) / 100; }
    function tx(str, x, y, cls, parent) { var t = el("text", { x: f(x), y: f(y), "text-anchor": "middle", "class": cls }, parent); t.textContent = str; return t; }
    var cx = 280, cy = 280, r0 = 124, N = 180, PER = 36;
    var CLS = ["hs", "ai", "ai", "both", "hs"];
    function noise(i) { i *= 2; return 0.5 + 0.22 * Math.sin(i * 0.37 + 1.3) + 0.16 * Math.sin(i * 0.91 + 0.2) + 0.08 * Math.sin(i * 2.31 + 2.1) + 0.04 * Math.sin(i * 5.7); }
    function env(i) {
      var s = Math.floor(i / PER), j = (i % PER) / (PER - 1), n = noise(i);
      if (s === 0) return 0.18 + 0.42 * j * (0.7 + 0.3 * n);                       /* phát biểu: lớn dần */
      if (s === 1 || s === 2) { var pk = i % 4 === 0 ? 1 : i % 4 === 2 ? 0.3 : 0.55; return (0.22 + 0.38 * pk) * (0.75 + 0.25 * n); } /* AI hỏi: nhịp đều */
      if (s === 3) return 0.42 + 0.48 * n;                                         /* phản bác: dày, hai chiều */
      return 0.66 + 0.26 * (0.5 + 0.5 * Math.sin(j * Math.PI)) * (0.8 + 0.2 * n);  /* phát huy: vững, cao hơn lúc đầu */
    }
    var svg = el("svg", { viewBox: "0 0 560 560", "aria-hidden": "true", focusable: "false" });
    var g = el("g", {}, svg);
    for (var i = 0; i < N; i++) {
      var s = Math.floor(i / PER), a = (-90 + (i + 0.5) * 2) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), e = env(i), ln;
      if (s === 3 && i % 2 === 1) {
        var Li = 6 + 28 * e;
        ln = el("line", { x1: f(cx + (r0 - 5) * ca), y1: f(cy + (r0 - 5) * sa), x2: f(cx + (r0 - 5 - Li) * ca), y2: f(cy + (r0 - 5 - Li) * sa), "class": "tk " + CLS[s] }, g);
      } else {
        var L = 8 + 60 * e;
        ln = el("line", { x1: f(cx + r0 * ca), y1: f(cy + r0 * sa), x2: f(cx + (r0 + L) * ca), y2: f(cy + (r0 + L) * sa), "class": "tk " + CLS[s] }, g);
      }
      if (anim) ln.setAttribute("style", "animation-delay:" + (i * 7) + "ms");
    }
    el("circle", { cx: cx, cy: cy, r: r0 - 2, "class": "fine" }, svg);
    var grad = el("g", { "class": "fine" }, svg);
    for (var d = 0; d < 360; d += 6) {
      if (d > 216 && d < 288) continue;
      var ar = (-90 + d) * Math.PI / 180, inner = d % 30 === 0 ? r0 - 49 : r0 - 45;
      el("line", { x1: f(cx + (r0 - 40) * Math.cos(ar)), y1: f(cy + (r0 - 40) * Math.sin(ar)), x2: f(cx + inner * Math.cos(ar)), y2: f(cy + inner * Math.sin(ar)) }, grad);
    }
    var dots = el("g", { "class": "dotc" }, svg);
    for (var k = 0; k < 360; k += 3) {
      var ak = (-90 + k) * Math.PI / 180;
      el("circle", { cx: f(cx + 204 * Math.cos(ak)), cy: f(cy + 204 * Math.sin(ak)), r: 0.8 }, dots);
    }
    var NAMES = ["PHÁT BIỂU", "PHÂN TÍCH", "PHẢN HỒI", "PHẢN BÁC", "PHÁT HUY"], ROM = ["I", "II", "III", "IV", "V"];
    for (var q = 0; q < 5; q++) {
      var ab = (-90 + q * 72) * Math.PI / 180;
      (q === 0 ? [[r0 - 34, r0 - 9], [194, 214]] : [[194, 214]]).forEach(function (sg) {
        el("line", { x1: f(cx + sg[0] * Math.cos(ab)), y1: f(cy + sg[0] * Math.sin(ab)), x2: f(cx + sg[1] * Math.cos(ab)), y2: f(cy + sg[1] * Math.sin(ab)), "class": "fine" }, svg);
      });
      var am = (-90 + q * 72 + 36) * Math.PI / 180, lx = cx + 238 * Math.cos(am), ly = cy + 238 * Math.sin(am);
      tx(ROM[q], lx, ly - 2, "rom t-ink", svg);
      tx(NAMES[q], lx, ly + 15, "nm t-mut", svg);
    }
    tx("QUY TRÌNH 5P", cx, cy - 30, "ctr-k t-mut", svg);
    tx("AI hỏi,", cx, cy + 4, "ctr t-ink", svg);
    tx("em nghĩ.", cx, cy + 36, "ctr t-ink", svg);
    host.appendChild(svg);
    if (anim) host.classList.add("anim");
  }

  /* ---------- Thẻ (tab) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var TKEY = "bcpb-tab", navEl = $("tabs"), mainEl = document.querySelector("main");
  function panelTop() { return Math.max(0, mainEl.getBoundingClientRect().top + window.pageYOffset - navEl.offsetHeight); }
  function showTab(id, opt) {
    opt = opt || {};
    if (!$(id)) return;
    tabs.forEach(function (t) {
      var on = t.id === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    save(TKEY, id);
    if (id === "t-kt") renderCheck();
    var top = panelTop();
    if (opt.scroll !== "never" && (opt.scroll === "always" || window.pageYOffset > top + 2)) {
      try { window.scrollTo({ top: top, behavior: opt.scroll === "always" && !reduceMotion() ? "smooth" : "auto" }); } catch (e) { window.scrollTo(0, top); }
    }
    if (opt.focus) $(id).focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showTab(t.id); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight") n = tabs[(i + 1) % tabs.length];
      else if (k === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (k === "Home") n = tabs[0];
      else if (k === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); showTab(n.id, { focus: true }); }
    });
  });
  function jumpTo(id) {
    var el = $(id);
    if (!el) return;
    var card = el.classList.contains("fcard") || el.classList.contains("bcard");
    each(document.querySelectorAll(".fcard.lit, .bcard.lit"), function (x) { x.classList.remove("lit"); });
    if (card) el.classList.add("lit");
    scrollToEl(el, card ? "center" : "start");
  }

  /* ---------- Thiết lập và câu lệnh ---------- */
  var form = $("setup"), sel = $("topicSel"), custom = $("topicCustom"), out = $("prompt"), statusEl = $("status");
  var KEY = "bcpb-settings-v1", COPILOT_LIMIT = 4000;
  function radio(name, root) { var r = (root || form).querySelector("input[name=\"" + name + "\"]:checked"); return r ? r.value : null; }
  function setRadio(name, v, root) { var r = (root || form).querySelector("input[name=\"" + name + "\"][value=\"" + v + "\"]"); if (r) r.checked = true; }
  function modeTip(mode, level) {
    var lv = BCPB_LEVELS[level];
    if (mode === "trongtai") return "Sau khi AI chào, em dán đoạn lập luận tự viết về chủ đề, dài khoảng " + lv.para + ".";
    if (mode === "sanloi") return "5 lượt, khó dần. Chưa quen tên các lỗi? Chơi “Đoán lỗi ngụy biện” ở phần Trò chơi trước.";
    if (mode === "kiemchung") return "3 vụ tin giả định nên không tìm thấy trên mạng. Mục tiêu là luyện cách đặt câu hỏi và chọn nguồn đáng tin.";
    if (mode === "emphanbien") return "AI nói một ý kiến có " + lv.weak + " điểm yếu cài sẵn. Em tìm ra chỗ yếu và phản bác bằng lí lẽ; cuối cùng AI chấm phần phản biện của em.";
    return "";
  }

  function fillTopics() {
    var html = "";
    BCPB_FIELDS.forEach(function (f) {
      var items = [];
      BCPB_TOPICS.forEach(function (t, i) { if (t[0] === f.id) items.push("<option value=\"" + i + "\">" + esc(t[2]) + "</option>"); });
      if (items.length) html += "<optgroup label=\"" + esc(f.name) + "\">" + items.join("") + "</optgroup>";
    });
    html += "<optgroup label=\"Chủ đề khác\"><option value=\"__custom\">Tự nhập chủ đề khác…</option></optgroup>";
    sel.innerHTML = html;
    sel.value = "0";
  }

  function current() {
    var tv = sel.value || "0", t = tv === "__custom" ? null : (BCPB_TOPICS[Number(tv)] || BCPB_TOPICS[0]);
    return {
      mode: radio("mode") || "full", level: radio("level") || "lamquen",
      persona: radio("persona") || "ban", tone: radio("tone") || "vui", voice: radio("voice") === "voice",
      hints: $("hints").checked, local: $("local").checked, emoji: $("emoji").checked, compact: $("compact").checked,
      focus: $("focusSel").value, interest: $("interest").value,
      topicSel: tv, topicCustom: custom.value,
      topic: t ? t[2] : custom.value, field: t ? t[0] : "", views: t ? t[3] : "", tlv: t ? t[1] : 0
    };
  }

  function renderMeta(o) {
    var m = $("topicMeta");
    if (o.topicSel === "__custom") { m.innerHTML = "<span>Mẹo: viết chủ đề thành một câu hỏi có hai phía, ví dụ “Có nên…?”. AI sẽ tự tìm các bên liên quan.</span>"; return; }
    var f = bcpbField(o.field), lv = BCPB_LEVELS[o.level], note = "";
    if (lv.topicLv.indexOf(o.tlv) < 0) note = o.tlv > lv.tier ? "Lưu ý: chủ đề này khó hơn mức " + lv.name + ". Em vẫn thử được, hoặc bấm “Chủ đề ngẫu nhiên” để có chủ đề vừa sức." : "Lưu ý: chủ đề này khá dễ với mức " + lv.name + ", AI sẽ hỏi sâu hơn để bù.";
    m.innerHTML = "<span><b>" + esc(f ? f.name : "") + "</b> · độ khó " + dotsHtml(o.tlv) + " " + LV_WORD[o.tlv] + "</span>" +
      "<span>Góc nhìn có thể xét: " + esc(o.views.split(/\s*;\s*/).join(", ")) + "</span>" +
      "<span>Môn học liên quan: " + esc(f ? f.subj : "") + "</span>" + (note ? "<span class=\"tm-note\">" + esc(note) + "</span>" : "");
  }

  var lastMode = null;
  function render() {
    var o = current(), lv = BCPB_LEVELS[o.level];
    custom.hidden = o.topicSel !== "__custom";
    var tip = modeTip(o.mode, o.level);
    $("tip-mode").hidden = !tip;
    $("tip-mode").textContent = tip;
    $("tip-voice").hidden = !o.voice;
    out.value = bcpbBuildPrompt(o);
    $("promptLen").textContent = "· " + fmtNum(out.value.length) + " kí tự";
    renderMeta(o);
    var topic = (o.topic || "").trim();
    $("summary").innerHTML = "<dt>Vai AI</dt><dd>" + esc(BCPB_MODES[o.mode]) + "</dd><dt>Mức</dt><dd>" + esc(lv.name) + (o.voice ? " · nói bằng giọng nói" : "") + "</dd>" +
      "<dt>Chủ đề</dt><dd>" + (topic ? esc(topic) : "<span class=\"muted\">chưa nhập</span>") + "</dd>";
    statusEl.textContent = ""; statusEl.className = "status";
    $("tip-copilot").hidden = true;
    if (o.mode !== lastMode) { lastMode = o.mode; renderCmds(o.mode); renderCheck(); }
    markPath(o);
    save(KEY, o);
  }

  function restore() {
    fillTopics();
    var s = load(KEY);
    if (!s || typeof s !== "object") return;
    ["mode", "level", "persona", "tone"].forEach(function (k) { if (s[k]) setRadio(k, s[k]); });
    setRadio("voice", s.voice ? "voice" : "text");
    $("hints").checked = s.hints !== false; $("local").checked = !!s.local; $("emoji").checked = !!s.emoji; $("compact").checked = !!s.compact;
    if (typeof s.topicSel === "string" && s.topicSel !== "" && (s.topicSel === "__custom" || BCPB_TOPICS[Number(s.topicSel)])) sel.value = s.topicSel;
    custom.value = s.topicCustom || "";
    if (s.focus && BCPB_FOCUS[s.focus]) $("focusSel").value = s.focus;
    $("interest").value = s.interest || "";
  }

  form.addEventListener("change", function (e) {
    var t = e.target;
    render();
    $("pathStatus").textContent = "";
    if (t === sel && sel.value === "__custom") custom.focus();
    if (t && t.name === "level" && Q && !Q.marks.length && !Q.answered) startQuiz(BCPB_LEVELS[t.value].tier);
  });
  custom.addEventListener("input", render);
  $("interest").addEventListener("input", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  $("randTopic").addEventListener("click", function () {
    var o = current(), lv = BCPB_LEVELS[o.level], pool = [];
    BCPB_TOPICS.forEach(function (t, i) { if (lv.topicLv.indexOf(t[1]) >= 0 && String(i) !== o.topicSel) pool.push(i); });
    sel.value = String(pool[Math.floor(Math.random() * pool.length)]);
    render();
  });

  /* Trả về lời nhắc nếu chưa đủ để chép câu lệnh */
  function notReady() {
    var o = current();
    if (o.topicSel === "__custom" && !custom.value.trim()) return { msg: "Em chưa gõ chủ đề. Gõ chủ đề vào ô ở bước 3 rồi bấm lại.", el: custom };
    return null;
  }
  function warn(msg) { statusEl.className = "status warn"; statusEl.textContent = msg; }
  function showManualCopy() {
    $("promptBox").open = true;
    out.focus(); out.select(); out.setSelectionRange(0, out.value.length);
    warn("Trình duyệt chặn sao chép tự động. Câu lệnh đã được bôi đen bên dưới, hãy nhấn Ctrl + C (trên điện thoại: giữ ngón tay lên ô chữ rồi chọn Sao chép).");
  }
  $("copyBtn").addEventListener("click", function () {
    var nr = notReady();
    if (nr) { warn(nr.msg); scrollToEl(closest(nr.el, ".card") || nr.el); nr.el.focus({ preventScroll: true }); return; }
    copyText(out.value, function () {
      statusEl.className = "status"; statusEl.textContent = "Đã sao chép. Giờ mở ứng dụng AI và dán vào ô chat.";
    }, showManualCopy);
  });
  /* Bấm nút ứng dụng AI cũng chép luôn câu lệnh; Copilot nhận bản gọn khi câu lệnh đầy đủ quá dài */
  each(document.querySelectorAll("[data-ai]"), function (a) {
    a.addEventListener("click", function (e) {
      var nr = notReady();
      if (nr) { e.preventDefault(); warn(nr.msg); scrollToEl(closest(nr.el, ".card") || nr.el); return; }
      var o = current(), text = out.value, small = false;
      if (a.getAttribute("data-ai") === "copilot" && !o.compact && text.length > COPILOT_LIMIT) { text = bcpbBuildPrompt(extend(o, { compact: true })); small = true; }
      if (!copyNow(text)) {
        e.preventDefault();
        if (small) { $("compact").checked = true; render(); }
        showManualCopy();
        return;
      }
      statusEl.className = "status"; statusEl.textContent = "Đã sao chép câu lệnh. Dán vào ô chat của ứng dụng AI vừa mở.";
      var tc = $("tip-copilot");
      tc.hidden = !small;
      if (small) tc.textContent = "Copilot giới hạn độ dài tin nhắn nên trang đã chép bản gọn (" + fmtNum(text.length) + " kí tự). Bản gọn vẫn giữ đủ quy trình và luật chơi.";
    });
  });

  /* Chọn giúp theo điểm yếu */
  var WEAK = [
    ["trinhbay", "Nói ý kiến cho rõ ràng", "hoi"],
    ["bangchung", "Tìm lí lẽ, bằng chứng", "full"],
    ["dapphanbac", "Đáp lại khi bị phản bác", "doithu"],
    ["kiemchung", "Phân biệt tin thật, tin giả", "kiemchung"],
    ["nguybien", "Nhận ra lỗi ngụy biện", "sanloi"],
    ["gopy", "Góp ý người khác mà vẫn tôn trọng", "emphanbien"]
  ];
  $("weakList").innerHTML = WEAK.map(function (w) { return "<button type=\"button\" class=\"pill-btn\" data-weak=\"" + w[0] + "\">" + esc(w[1]) + "</button>"; }).join("");
  $("helpBtn").addEventListener("click", function () {
    var box = $("weakBox"), open = box.hidden;
    box.hidden = !open; this.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $("weakList").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-weak]");
    if (!b) return;
    var w = WEAK.filter(function (x) { return x[0] === b.getAttribute("data-weak"); })[0];
    each(this.querySelectorAll(".pill-btn"), function (x) { x.classList.toggle("on", x === b); });
    setRadio("mode", w[2]); $("focusSel").value = w[0];
    render();
    var tip = modeTip(w[2], current().level);
    $("tip-mode").hidden = false;
    $("tip-mode").textContent = "Trang đã chọn “" + BCPB_MODES[w[2]] + "” và ghi kĩ năng “" + w[1].toLowerCase() + "” vào câu lệnh." + (tip ? " " + tip : "");
  });

  /* ---------- Lộ trình 4 buổi (dùng chung cho phần Luyện và phần Trên lớp) ---------- */
  var SESSIONS = [
    { name: "Làm quen quy trình 5P", mode: "hoi", level: "lamquen", voice: false,
      goal: "Học sinh tự phát biểu trước, rồi trả lời câu hỏi gợi mở của AI để làm rõ và hoàn thiện ý của mình.",
      stages: [
        { name: "Mở đầu", min: 5, p: [], todo: "Nghe chủ đề thầy cô nêu. Ở phần Luyện với AI, bấm “Buổi 1” trong lộ trình, chọn đúng chủ đề, bấm Sao chép câu lệnh rồi dán vào ứng dụng AI." },
        { name: "Phát biểu", min: 5, p: [1], todo: "Tự viết ý kiến của em: “Mình cho rằng… vì… Ví dụ là…”, rồi gửi cho AI." },
        { name: "Trả lời câu hỏi của AI", min: 20, p: [2, 3], todo: "Trả lời từng câu hỏi gợi mở của AI, bổ sung lí lẽ và bằng chứng. Bí thì gõ GỢI Ý." },
        { name: "Viết lại", min: 10, p: [5], todo: "Gõ PHÁT HUY, viết lại ý kiến rõ hơn, có lí lẽ và ví dụ mới, rồi gửi để AI chấm." },
        { name: "Chia sẻ và ghi nhật ký", min: 5, p: [], todo: "Gõ NHẬT KÝ, chép phần AI ghi vào phần Tự kiểm tra. Hai bạn kể cho nhau điều mình học được." }
      ] },
    { name: "Luyện phản bác", mode: "doithu", level: "vungvang", voice: false,
      goal: "AI đứng ở phía ngược lại và phản bác khó dần; học sinh đáp trả bằng lí lẽ và được quyền điều chỉnh quan điểm.",
      stages: [
        { name: "Mở đầu", min: 5, p: [], todo: "Ở phần Luyện với AI, bấm “Buổi 2” trong lộ trình, chọn chủ đề, sao chép câu lệnh rồi dán vào ứng dụng AI." },
        { name: "Phát biểu", min: 5, p: [1], todo: "Tự viết ý kiến của em kèm ít nhất hai lí lẽ, rồi gửi cho AI." },
        { name: "Phản bác và đáp trả", min: 20, p: [4], todo: "Đáp lại từng ý phản bác của AI bằng lí lẽ. Thấy AI có lí thì điều chỉnh quan điểm. Muốn luyện thêm thì gõ PHẢN BÁC." },
        { name: "Phát huy", min: 10, p: [5], todo: "Gõ PHÁT HUY, viết lại bản mạnh hơn có đáp lại ý trái chiều, rồi để AI chấm." },
        { name: "Chia sẻ và ghi nhật ký", min: 5, p: [], todo: "Gõ NHẬT KÝ và ghi vào phần Tự kiểm tra. Kể một ý phản bác khó nhất em gặp và cách em đáp lại." }
      ] },
    { name: "Nhận diện ngụy biện, tranh biện bằng giọng nói", mode: "doithu", level: "vungvang", voice: true, game: true,
      goal: "Học sinh chơi “Đoán lỗi ngụy biện” trên trang, rồi tranh biện với AI bằng giọng nói và dùng lệnh SOI LỖI.",
      stages: [
        { name: "Mở đầu", min: 3, p: [], todo: "Nghe thầy cô giới thiệu buổi học và chủ đề tranh biện." },
        { name: "Trò chơi đoán lỗi", min: 10, p: [], todo: "Mở phần Trò chơi, chơi một lượt “Đoán lỗi ngụy biện” ở mức Vững vàng." },
        { name: "Tranh biện bằng giọng nói", min: 20, p: [4], todo: "Bấm “Buổi 3” trong lộ trình, dán câu lệnh, bật chế độ giọng nói của ứng dụng AI rồi tranh luận. Nghi mình mắc lỗi thì nói “soi lỗi”." },
        { name: "Phát huy", min: 7, p: [5], todo: "Gõ PHÁT HUY, viết lại ý kiến và bỏ các lỗi ngụy biện đã được chỉ ra, rồi gửi để AI chấm." },
        { name: "Chia sẻ và ghi nhật ký", min: 5, p: [], todo: "Gõ NHẬT KÝ và ghi vào phần Tự kiểm tra. Kể một lỗi ngụy biện em nhận ra hôm nay." }
      ] },
    { name: "Tranh biện độc lập đủ 5 bước", mode: "full", level: "thuthach", voice: false,
      goal: "Học sinh tự đi đủ năm bước, tự kiểm tra lập luận theo bảng kiểm, viết bản phát huy và ghi nhật ký.",
      stages: [
        { name: "Mở đầu", min: 3, p: [], todo: "Bấm “Buổi 4” trong lộ trình, chọn một chủ đề khó hơn, sao chép câu lệnh rồi dán vào ứng dụng AI." },
        { name: "Phát biểu", min: 4, p: [1], todo: "Tự viết ý kiến gồm luận điểm, lí lẽ và bằng chứng có nguồn." },
        { name: "Phân tích và phản hồi", min: 8, p: [2, 3], todo: "Xem AI bóc tách lập luận, trả lời câu hỏi và kiểm chứng số liệu ở hai nguồn." },
        { name: "Phản bác", min: 15, p: [4], todo: "Đáp trả các ý phản bác khó dần của AI. Gõ SOI LỖI nếu nghi lập luận của mình có lỗi." },
        { name: "Tự kiểm tra", min: 5, p: [], todo: "Mở phần Tự kiểm tra, trả lời 5 câu hỏi về lập luận và sửa những chỗ còn thiếu." },
        { name: "Phát huy", min: 7, p: [5], todo: "Gõ PHÁT HUY, viết bản cuối và so điểm bảng kiểm với bản đầu." },
        { name: "Tổng kết", min: 3, p: [], todo: "Gõ NHẬT KÝ, lưu vào sổ nhật ký và chia sẻ điểm tiến bộ của mình." }
      ] }
  ];
  function sessShort(s) { return BCPB_MODES[s.mode].replace(" 5 bước (5P)", " 5P") + " · " + BCPB_LEVELS[s.level].name + (s.voice ? " · giọng nói" : ""); }
  $("pathList").innerHTML = SESSIONS.map(function (s, i) {
    return "<li><button type=\"button\" class=\"path-btn\" data-path=\"" + i + "\" aria-pressed=\"false\"><span class=\"eyebrow\">Buổi " + (i + 1) + "</span><b>" + esc(s.name) + "</b><small>" + esc(sessShort(s)) + "</small></button></li>";
  }).join("");
  function applySession(i) {
    var s = SESSIONS[i];
    setRadio("mode", s.mode); setRadio("level", s.level); setRadio("voice", s.voice ? "voice" : "text");
    if (s.voice) $("moreBox").open = true;
    render();
  }
  function markPath(o) {
    each($("pathList").querySelectorAll("[data-path]"), function (b) {
      var s = SESSIONS[Number(b.getAttribute("data-path"))];
      b.setAttribute("aria-pressed", s.mode === o.mode && s.level === o.level && !!s.voice === o.voice ? "true" : "false");
    });
  }
  $("pathList").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-path]");
    if (!b) return;
    var i = Number(b.getAttribute("data-path")), s = SESSIONS[i];
    applySession(i);
    $("pathStatus").textContent = "Đã chọn sẵn Buổi " + (i + 1) + ": " + BCPB_MODES[s.mode] + ", mức " + BCPB_LEVELS[s.level].name + (s.voice ? ", nói bằng giọng nói" : "") + "." +
      (s.game ? " Nhớ chơi “Đoán lỗi ngụy biện” ở phần Trò chơi trước." : "");
  });

  /* ---------- Lệnh nhanh ---------- */
  var TOP_CMDS = ["GỢI Ý", "CHẬM LẠI", "NHỚ VAI", "NHẬT KÝ"];
  function cmdBtn(c) {
    return "<li><button type=\"button\" class=\"cmd\" data-cmd=\"" + esc(c.key) + "\" aria-label=\"Chép lệnh " + esc(c.key) + ". " + esc(c.hs) + "\">" +
      "<kbd>" + esc(c.key) + "</kbd><span class=\"cmd-text\"><span class=\"cmd-does\">" + esc(c.hs) + "</span><span class=\"cmd-when\">Dùng khi: " + esc(lf(c.when)) + "</span></span>" +
      "<span class=\"cmd-copy\" aria-hidden=\"true\">Chép</span></button></li>";
  }
  function renderCmds(mode) {
    var cmds = bcpbCommands(mode);
    $("cmdCount").textContent = "· " + cmds.length + " lệnh cho “" + BCPB_MODES[mode] + "”";
    $("cmdTop").innerHTML = cmds.filter(function (c) { return TOP_CMDS.indexOf(c.key) >= 0; }).map(function (c) {
      return "<button type=\"button\" class=\"cmd-chip\" data-cmd=\"" + esc(c.key) + "\" title=\"" + esc(c.hs) + "\"><kbd>" + esc(c.key) + "</kbd><span>" + esc(c.hs) + "</span></button>";
    }).join("");
    var board = $("cmdBoard");
    board.innerHTML = "";
    Object.keys(BCPB_CMD_GROUPS).forEach(function (g) {
      var items = cmds.filter(function (c) { return c.group === g; });
      if (!items.length) return;
      var box = document.createElement("div"); box.className = "cmd-group";
      box.innerHTML = "<h4>" + esc(BCPB_CMD_GROUPS[g]) + "</h4><ul class=\"cmds\">" + items.map(cmdBtn).join("") + "</ul>";
      board.appendChild(box);
    });
  }
  function copyCmd(b) {
    var key = b.getAttribute("data-cmd");
    var holder = closest(b, "[data-status]"), st = holder ? $(holder.getAttribute("data-status")) : $("cmdStatus");
    copyText(key, function () {
      each(document.querySelectorAll(".cmd.copied"), function (x) { x.classList.remove("copied"); x.querySelector(".cmd-copy").textContent = "Chép"; });
      if (b.classList.contains("cmd")) { b.classList.add("copied"); b.querySelector(".cmd-copy").textContent = "Đã chép"; }
      if (st) { st.className = "status"; st.textContent = "Đã chép “" + key + "”. Dán vào ô chat với AI rồi gửi."; }
    }, function () { if (st) { st.className = "status warn"; st.textContent = "Không chép tự động được. Em gõ: " + key; } });
  }

  /* Bấm ở bất kì đâu: chuyển thẻ, nhảy tới mục, chép lệnh, chọn sẵn vai AI */
  document.addEventListener("click", function (e) {
    var g = closest(e.target, "[data-goto]");
    if (g) {
      e.preventDefault();
      /* Nút vừa chuyển thẻ vừa nhảy tới một mục (ví dụ sáu cơ sở khoa học ở đầu trang) */
      var gj = g.getAttribute("data-jump");
      showTab(g.getAttribute("data-goto"), { scroll: gj ? "never" : "always" });
      if (gj) jumpTo(gj);
      return;
    }
    var j = closest(e.target, "[data-jump]");
    if (j) { e.preventDefault(); jumpTo(j.getAttribute("data-jump")); return; }
    var m = closest(e.target, "[data-setmode]");
    if (m) {
      setRadio("mode", m.getAttribute("data-setmode")); render();
      showTab("t-luyen", { scroll: "always" });
      statusEl.className = "status"; statusEl.textContent = "Đã chọn “" + BCPB_MODES[m.getAttribute("data-setmode")] + "”. Chọn mức, chủ đề rồi bấm Sao chép câu lệnh.";
      return;
    }
    var c = closest(e.target, "[data-cmd]");
    if (c) copyCmd(c);
  });

  /* ---------- Thư viện chủ đề ---------- */
  var LIB = { field: "", lv: 0, q: "" };
  var libIndex = BCPB_TOPICS.map(function (t) { var f = bcpbField(t[0]); return norm(t[2] + " " + t[3] + " " + (f ? f.name + " " + f.subj : "")); });
  function renderFieldChips() {
    var counts = {};
    BCPB_TOPICS.forEach(function (t) { counts[t[0]] = (counts[t[0]] || 0) + 1; });
    $("libFields").innerHTML = "<button type=\"button\" class=\"chip-btn\" data-field=\"\" aria-pressed=\"" + (LIB.field === "") + "\">Tất cả<span class=\"c\">" + BCPB_TOPICS.length + "</span></button>" +
      BCPB_FIELDS.map(function (f) {
        return "<button type=\"button\" class=\"chip-btn\" data-field=\"" + f.id + "\" aria-pressed=\"" + (LIB.field === f.id) + "\">" + esc(f.name) + "<span class=\"c\">" + (counts[f.id] || 0) + "</span></button>";
      }).join("");
  }
  function libMatches() {
    var q = norm(LIB.q), words = q ? q.split(" ") : [], res = [];
    BCPB_TOPICS.forEach(function (t, i) {
      if (LIB.field && t[0] !== LIB.field) return;
      if (LIB.lv && t[1] !== LIB.lv) return;
      for (var k = 0; k < words.length; k++) if (libIndex[i].indexOf(words[k]) < 0) return;
      res.push(i);
    });
    return res;
  }
  function renderLib(pick) {
    var res = libMatches();
    $("libCount").textContent = res.length === BCPB_TOPICS.length ? "Tất cả " + res.length + " chủ đề" : "Tìm thấy " + res.length + " trên " + BCPB_TOPICS.length + " chủ đề";
    if (!res.length) { $("libList").innerHTML = "<li class=\"lib-empty\">Không tìm thấy chủ đề phù hợp. Thử từ khóa khác, chọn “Mọi mức” hoặc lĩnh vực “Tất cả”.</li>"; return; }
    $("libList").innerHTML = res.map(function (i) {
      var t = BCPB_TOPICS[i], f = bcpbField(t[0]);
      return "<li id=\"cd-" + i + "\"" + (i === pick ? " class=\"pick\"" : "") + "><div class=\"lt\"><span>" + esc(f.name) + "</span><span class=\"lvd\">" + dotsHtml(t[1]) + " " + LV_WORD[t[1]] + "</span></div>" +
        "<p class=\"q\">" + esc(t[2]) + "</p>" +
        "<p class=\"v\"><b>Góc nhìn:</b> " + esc(t[3].split(/\s*;\s*/).join(", ")) + "</p>" +
        "<p class=\"v\"><b>Môn học:</b> " + esc(f.subj) + "</p>" +
        "<button type=\"button\" class=\"btn ghost small\" data-use=\"" + i + "\">Luyện chủ đề này</button></li>";
    }).join("");
  }
  $("libQ").addEventListener("input", function () { LIB.q = this.value; renderLib(); });
  $("libLv").addEventListener("change", function (e) { if (e.target.name === "liblv") { LIB.lv = Number(e.target.value); renderLib(); } });
  $("libFields").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-field]");
    if (!b) return;
    LIB.field = b.getAttribute("data-field");
    renderFieldChips(); renderLib();
  });
  $("libRand").addEventListener("click", function () {
    var res = libMatches();
    if (!res.length) return;
    var i = res[Math.floor(Math.random() * res.length)];
    renderLib(i);
    var li = $("cd-" + i);
    scrollToEl(li, "center");
    li.querySelector("button").focus({ preventScroll: true });
  });
  $("libList").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-use]");
    if (!b) return;
    sel.value = b.getAttribute("data-use");
    render();
    showTab("t-luyen");
    statusEl.className = "status"; statusEl.textContent = "Đã chọn chủ đề. Kiểm tra vai AI và mức, rồi bấm Sao chép câu lệnh.";
    scrollToEl(closest(sel, ".card"), "center");
    sel.focus({ preventScroll: true });
  });

  /* ---------- Thẻ ngụy biện ---------- */
  var FBY = {};
  BCPB_FALLACIES.forEach(function (f) { FBY[f.id] = f; });
  $("fallacyGrid").innerHTML = BCPB_FALLACIES.map(function (f) {
    return "<article class=\"fcard\" id=\"loi-" + f.id + "\"><div class=\"fhead\"><h4>" + esc(f.name) + "</h4><span class=\"tier\">" + TIER_NAME[f.tier] + "</span></div>" +
      "<p class=\"feasy\">" + esc(f.easy) + "</p><p class=\"fsign\">" + esc(f.sign) + "</p><blockquote class=\"fex\">" + esc(f.ex) + "</blockquote>" +
      "<p class=\"ffix\"><b>Câu hỏi giúp nhận ra lỗi:</b> " + esc(f.fix) + "</p></article>";
  }).join("");

  /* ---------- Trò chơi 1: Đoán lỗi ngụy biện ---------- */
  var QUIZ = [
    { a: "khaiquat", t: "“Mình mua bánh mì ở chợ đầu kênh hai lần, lần nào cũng nguội. Bánh mì ở chợ đó chẳng ngon chút nào.”", why: "Chỉ từ hai lần mua đã kết luận cho bánh mì của cả chợ." },
    { a: "khaiquat", t: "“Anh họ mình chơi game mỗi ngày mà vẫn đậu đại học. Vậy chơi game chẳng ảnh hưởng gì đến việc học của học sinh.”", why: "Lấy một trường hợp để kết luận cho mọi học sinh." },
    { a: "khaiquat", t: "“Lớp mình có ba bạn dùng AI làm bài văn bị cô phát hiện. Học sinh bây giờ cứ dùng AI là để gian lận.”", why: "Từ ba bạn trong một lớp đã kết luận cho mọi học sinh dùng AI." },
    { a: "congkich", t: "“Bạn Lan đề nghị lớp trồng thêm cây xanh. Nhà Lan có trồng cây nào đâu mà nói, nên đề nghị đó không đáng nghe.”", why: "Bác bỏ đề nghị bằng cách chê người nói, không bàn đến lợi ích của việc trồng cây." },
    { a: "congkich", t: "“Ý kiến bảo vệ môi trường của anh ấy chẳng đáng tin, vì anh ấy vẫn đi xe máy mỗi ngày.”", why: "Chê hành động của người nói thay vì xét xem ý kiến bảo vệ môi trường đúng hay sai." },
    { a: "sodong", t: "“Video này có hơn 2 triệu lượt thích, nên thông tin trong đó chắc chắn đúng.”", why: "Nhiều lượt thích chỉ cho biết nhiều người xem, không chứng minh thông tin đúng." },
    { a: "sodong", t: "“Ở xóm mình nhà nào cũng đốt rác, nên đốt rác chắc chẳng có hại gì.”", why: "Việc nhiều nhà cùng làm không chứng minh việc đó vô hại." },
    { a: "trangden", t: "“Một là em đi học thêm đủ 5 môn, hai là em chấp nhận thi trượt.”", why: "Bỏ qua các cách khác như tự học có kế hoạch, học nhóm, hỏi thầy cô." },
    { a: "trangden", t: "“Hoặc là dùng AI cho mọi bài tập, hoặc là không bao giờ được đụng đến AI.”", why: "Bỏ qua lựa chọn ở giữa: dùng AI có chọn lọc, đúng lúc, đúng cách." },
    { a: "nhanqua", t: "“Khoa đổi sang cây bút mới và tuần đó được 9 điểm Toán. Từ nay Khoa chỉ dùng cây bút đó khi đi thi cho chắc.”", why: "Hai việc xảy ra cùng lúc không có nghĩa là cây bút làm điểm cao hơn." },
    { a: "nhanqua", t: "“Năm nay trường lắp thêm camera ở hành lang, và điểm thi học kì của trường tăng. Vậy camera giúp học sinh học giỏi hơn.”", why: "Điểm tăng có thể do nhiều nguyên nhân khác như đề thi, cách ôn tập; hai việc chỉ xảy ra trong cùng một năm." },
    { a: "nhanqua", t: "“Từ khi cả đội mặc áo thi đấu mới, đội bóng của lớp thắng liền ba trận. Chiếc áo mới đem lại may mắn.”", why: "Đội thắng có thể nhờ tập luyện hay nhờ đối thủ yếu hơn; mặc áo mới chỉ xảy ra cùng lúc." },
    { a: "camxuc", t: "“Thử nghĩ xem, nếu em bị ốm thì bố mẹ sẽ đau lòng biết bao. Vì vậy học sinh nào cũng phải uống loại vitamin này mỗi ngày.”", why: "Dùng nỗi lo và lòng thương để thuyết phục, không có bằng chứng rằng mọi học sinh cần loại vitamin này." },
    { a: "camxuc", t: "“Mỗi ngày có biết bao chú chó bị bỏ rơi. Nếu còn chút tình thương thì bạn phải ủng hộ việc cấm hẳn bán thú cưng.”", why: "Dùng lòng thương để ép đồng ý, chưa đưa ra lí lẽ vì sao cấm hẳn là cách tốt nhất." },
    { a: "nguoirom", t: "Hòa: “Trường mình nên có thêm giờ đọc sách.” Tú: “Ý Hòa là bỏ hết giờ ra chơi để ngồi đọc sách à? Ai mà chịu nổi!”", why: "Tú bóp méo đề nghị “thêm giờ đọc sách” thành “bỏ hết giờ ra chơi” rồi bác bỏ bản bóp méo đó." },
    { a: "nguoirom", t: "Mai: “Nên hạn chế dùng AI trong giờ kiểm tra.” Nam: “Vậy là Mai muốn học sinh quay về thời đồ đá, cấm tiệt công nghệ chứ gì?”", why: "Nam phóng đại “hạn chế dùng AI trong giờ kiểm tra” thành “cấm tiệt công nghệ” rồi chế giễu bản phóng đại đó." },
    { a: "doctruot", t: "“Nếu cho dùng máy tính cầm tay trong giờ Toán, học sinh sẽ quên cách tính nhẩm, rồi không làm nổi toán cơ bản, rồi sau này chẳng làm được việc gì.”", why: "Một chuỗi hậu quả ngày càng tệ được đưa ra mà không có bằng chứng cho từng bước." },
    { a: "doctruot", t: "“Hôm nay cho lớp nghỉ một tiết sinh hoạt để xem phim, tuần sau cả lớp sẽ đòi nghỉ học, rồi nội quy của trường chẳng còn ai giữ.”", why: "Từ một việc nhỏ suy ra chuỗi hậu quả nghiêm trọng mà không có bằng chứng." },
    { a: "thamquyen", t: "“Một cầu thủ bóng đá nổi tiếng khuyên học tiếng Anh bằng ứng dụng X, nên đó chắc chắn là cách học tiếng Anh tốt nhất.”", why: "Cầu thủ giỏi bóng đá nhưng không phải chuyên gia về dạy ngoại ngữ." },
    { a: "thamquyen", t: "“Một người có hàng triệu lượt theo dõi trên mạng nói uống nước chanh lúc đói chữa được đau dạ dày, nên mình làm theo.”", why: "Có nhiều người theo dõi không có nghĩa là có chuyên môn y khoa; cần hỏi bác sĩ hoặc nguồn y tế đáng tin." },
    { a: "vongquanh", t: "“Minh là người đáng tin nhất lớp, vì Minh chưa bao giờ nói điều gì không đáng tin.”", why: "Lí do chỉ nhắc lại kết luận “đáng tin” bằng lời khác, không thêm bằng chứng nào." },
    { a: "vongquanh", t: "“Quy định này công bằng, vì nó đối xử với mọi người một cách công bằng.”", why: "Lí do và kết luận là một; câu nói không giải thích vì sao quy định công bằng." },
    { a: "danhtrao", t: "Hỏi: “Lớp mình có nên dùng quỹ lớp để mua máy lọc nước không?” Đáp: “Năm ngoái lớp bên cạnh liên hoan còn tốn tiền hơn nhiều kìa.”", why: "Câu trả lời lái sang chuyện liên hoan của lớp khác, không bàn chuyện có nên mua máy lọc nước." },
    { a: "danhtrao", t: "Hỏi: “Ứng dụng này có thu thập dữ liệu cá nhân của học sinh không?” Đáp: “Ứng dụng này có giao diện rất đẹp, lại có nhiều màu để chọn.”", why: "Né câu hỏi về dữ liệu cá nhân bằng cách nói về giao diện." },
    { a: "truyenthong", t: "“Hội trại của trường năm nào cũng chỉ có thi nấu ăn và kéo co, nên năm nay không cần thêm hoạt động mới.”", why: "Việc đã làm nhiều năm không tự chứng minh là cách tốt nhất; cần xét học sinh hôm nay thích gì và cần gì." },
    { a: "truyenthong", t: "“Từ đời ông bà, nông dân quê mình đã đốt rơm rạ sau mùa gặt, nên đốt đồng chẳng có gì sai.”", why: "Thói quen lâu đời chưa chắc còn phù hợp; cần xét tác hại của khói và các cách xử lí rơm rạ khác." }
  ];
  var QUIZ_N = 8, Q = null;
  function progressDots(total, marks, now) {
    var h = "";
    for (var k = 0; k < total; k++) h += "<i class=\"" + (k < marks.length ? (marks[k] ? "ok" : "no") : k === now ? "now" : "") + "\"></i>";
    return "<span class=\"pdots\" aria-hidden=\"true\">" + h + "</span>";
  }
  function startQuiz(tier) {
    var items = QUIZ.filter(function (q) { return FBY[q.a].tier <= tier; });
    var hi = tier > 1 ? shuffle(items.filter(function (q) { return FBY[q.a].tier === tier; })).slice(0, 2) : [];
    var rest = shuffle(items.filter(function (q) { return hi.indexOf(q) < 0; }));
    var pick = shuffle(hi.concat(rest.slice(0, QUIZ_N - hi.length)));
    /* Tránh hai câu liền nhau cùng một lỗi */
    for (var k = 1; k < pick.length; k++) {
      if (pick[k].a !== pick[k - 1].a) continue;
      for (var m = k + 1; m < pick.length; m++) if (pick[m].a !== pick[k - 1].a) { var t = pick[k]; pick[k] = pick[m]; pick[m] = t; break; }
    }
    Q = { tier: tier, items: pick, i: 0, score: 0, marks: [], answered: false };
    each(document.querySelectorAll("#quizLv input"), function (x) { x.checked = Number(x.value) === tier; });
    renderQuiz();
  }
  function quizOptions(q) {
    var pool = BCPB_FALLACIES.filter(function (f) { return f.tier <= Q.tier && f.id !== q.a; }).map(function (f) { return f.id; });
    return shuffle([q.a].concat(shuffle(pool).slice(0, 3)));
  }
  function quizProgress() { return progressDots(Q.items.length, Q.marks, Q.i) + "<span>Câu " + (Q.i + 1) + " trên " + Q.items.length + " · đúng " + Q.score + "</span>"; }
  function renderQuiz() {
    var body = $("quizBody"), n = Q.items.length;
    if (Q.i >= n) {
      var wrong = [];
      Q.items.forEach(function (q, k) { if (!Q.marks[k] && wrong.indexOf(q.a) < 0) wrong.push(q.a); });
      var msg = Q.score === n ? "Xuất sắc! Em nhận ra mọi lỗi." : Q.score >= 6 ? "Rất tốt! Xem lại thẻ của lỗi em còn nhầm rồi làm lượt mới." : "Không sao, đọc lại các thẻ ngụy biện bên dưới rồi thử lượt mới.";
      body.innerHTML = "<div class=\"end\"><div class=\"quiz-progress\">" + progressDots(n, Q.marks, -1) + "<span>Hoàn thành · mức " + TIER_NAME[Q.tier] + "</span></div>" +
        "<p class=\"score\">" + Q.score + "<small>/" + n + "</small></p><p>" + msg + "</p>" +
        (wrong.length ? "<p>Lỗi cần xem lại: " + wrong.map(function (id) { return "<a href=\"#loi-" + id + "\" data-jump=\"loi-" + id + "\">" + esc(FBY[id].name) + "</a>"; }).join(", ") + ".</p>" : "") +
        "<div class=\"actions\"><button type=\"button\" class=\"btn\" id=\"quizAgain\">Làm lượt mới</button>" +
        (Q.tier < 3 && Q.score >= 6 ? "<button type=\"button\" class=\"btn ghost\" id=\"quizUp\">Thử mức " + TIER_NAME[Q.tier + 1] + "</button>" : "") +
        "<button type=\"button\" class=\"btn ghost\" data-setmode=\"sanloi\">Chơi “Săn ngụy biện” với AI</button></div></div>";
      return;
    }
    var q = Q.items[Q.i];
    Q.answered = false;
    body.innerHTML = "<div class=\"quiz\"><div class=\"quiz-progress\">" + quizProgress() + "</div>" +
      "<blockquote class=\"quiz-q\">" + esc(q.t) + "</blockquote><p class=\"quiz-ask\">Lập luận này mắc lỗi gì?</p>" +
      "<div class=\"quiz-opts\">" + quizOptions(q).map(function (id) { return "<button type=\"button\" class=\"qopt\" data-id=\"" + id + "\">" + esc(FBY[id].name) + "<small>" + esc(FBY[id].easy) + "</small></button>"; }).join("") + "</div>" +
      "<div class=\"fb\" id=\"quizFb\"></div></div>";
  }
  $("quizLv").addEventListener("change", function (e) { if (e.target.name === "quizlv") startQuiz(Number(e.target.value)); });
  $("quizBody").addEventListener("click", function (e) {
    var t = closest(e.target, "button, a");
    if (!t || t.getAttribute("data-jump") || t.getAttribute("data-setmode")) return;
    if (t.id === "quizAgain") { startQuiz(Q.tier); var f0 = document.querySelector("#quizBody .qopt"); if (f0) f0.focus(); return; }
    if (t.id === "quizUp") { startQuiz(Q.tier + 1); var f1 = document.querySelector("#quizBody .qopt"); if (f1) f1.focus(); return; }
    if (t.id === "quizNext") { Q.i++; renderQuiz(); var g = document.querySelector("#quizBody .qopt") || $("quizAgain"); if (g) g.focus(); return; }
    if (!t.classList.contains("qopt") || Q.answered) return;
    Q.answered = true;
    var q = Q.items[Q.i], pick = t.getAttribute("data-id"), right = pick === q.a;
    if (right) Q.score++;
    Q.marks.push(right);
    each(document.querySelectorAll("#quizBody .qopt"), function (b) {
      b.disabled = true;
      if (b.getAttribute("data-id") === q.a) b.classList.add("right");
      else if (b === t) b.classList.add("wrong");
    });
    var f = FBY[q.a], last = Q.i === Q.items.length - 1;
    $("quizFb").innerHTML = "<p><span class=\"verdict " + (right ? "ok\">Chính xác!" : "no\">Chưa đúng.") + "</span> Đây là lỗi <b>" + esc(f.name) + "</b>, tức là “" + esc(lf(f.easy)) + "”. " + esc(q.why) + "</p>" +
      "<p><b>Câu hỏi giúp nhận ra lỗi:</b> " + esc(f.fix) + "</p>" +
      "<div class=\"actions\"><button type=\"button\" class=\"btn small\" id=\"quizNext\">" + (last ? "Xem kết quả" : "Câu tiếp theo") + "</button></div>";
    $("quizLive").textContent = (right ? "Chính xác! " : "Chưa đúng. ") + "Đây là lỗi " + f.name + ".";
    document.querySelector("#quizBody .quiz-progress").innerHTML = quizProgress();
    $("quizNext").focus();
  });

  /* ---------- Trò chơi 2: Thám tử kiểm chứng (tin do nhóm tự viết, không có thật) ---------- */
  var SIGNS = [
    ["nguon", "Không rõ ai đưa tin, hoặc nguồn không đáng tin"],
    ["giatgan", "Tiêu đề giật gân: chữ in hoa, nhiều dấu chấm than"],
    ["thoigian", "Không rõ thời gian, hoặc tin cũ đưa lại như mới"],
    ["thucgiuc", "Thúc giục chia sẻ hay làm ngay"],
    ["solieu", "Số liệu khó tin, không rõ lấy từ đâu"],
    ["motTruongHop", "Từ một trường hợp hay nhóm nhỏ, kết luận cho tất cả"]
  ];
  var CASES = [
    { h: "KHẨN!!! TỪ THÁNG SAU HỌC SINH TOÀN THÀNH PHỐ PHẢI ĐI HỌC CẢ CHỦ NHẬT",
      t: "Nghe nói Sở đã quyết định rồi, ai không tin thì thôi. Chia sẻ ngay cho cả lớp biết trước khi bài này bị xóa!!!",
      src: "Ảnh chụp tin nhắn trong một nhóm chat, không ghi ngày.",
      signs: { nguon: "Chỉ có “nghe nói”, không dẫn văn bản hay trang thông tin chính thức nào.", giatgan: "Chữ in hoa toàn bộ, chữ “KHẨN”, nhiều dấu chấm than.", thoigian: "Ảnh chụp không ghi ngày, không biết tin có từ bao giờ.", thucgiuc: "“Chia sẻ ngay… trước khi bài này bị xóa” thúc em chia sẻ trước khi kịp kiểm tra." },
      tip: "Xem trang thông tin chính thức của Sở Giáo dục và Đào tạo hoặc của trường, hay hỏi giáo viên chủ nhiệm." },
    { h: "Khảo sát: 90% học sinh bây giờ đã bỏ đọc sách",
      t: "Một bạn hỏi 10 người trong nhóm chơi game của mình, 9 người nói không còn đọc sách. Bạn ấy đăng bài với tiêu đề trên.",
      src: "Bài đăng trên trang cá nhân, ngày 02/11.",
      signs: { solieu: "Con số “90%” chỉ tính từ 10 người, không phải một cuộc khảo sát đúng nghĩa.", motTruongHop: "Một nhóm bạn chơi game không đại diện cho mọi học sinh." },
      no: { nguon: "Biết rõ ai đăng bài; vấn đề nằm ở cách lấy số liệu.", thoigian: "Bài có ghi ngày đăng." },
      tip: "Hỏi lại: khảo sát bao nhiêu người, chọn người thế nào? Tìm số liệu của thư viện, cơ quan thống kê hoặc nghiên cứu đã công bố." },
    { h: "XÓT XA: chợ nổi miền Tây đã chết hẳn, không còn một chiếc ghe!",
      t: "Bức ảnh chụp mặt sông vắng tanh được đăng kèm dòng chữ trên. Bài không nói ảnh chụp ở chợ nào, vào ngày giờ nào.",
      src: "Ảnh của một người chụp ảnh du lịch, có ghi tên người chụp.",
      signs: { giatgan: "“XÓT XA”, “đã chết hẳn”, dấu chấm than: lời lẽ đánh vào cảm xúc.", thoigian: "Không rõ ảnh chụp lúc nào; chợ nổi thường chỉ đông vào sáng sớm.", motTruongHop: "Một bức ảnh không đủ để kết luận cho mọi chợ nổi." },
      no: { nguon: "Ảnh có ghi tên người chụp; điều đáng ngờ là lời bình kèm theo." },
      tip: "Tìm thêm bài viết, ảnh gần đây về chợ nổi đó trên báo chí hoặc trang du lịch chính thức; để ý ảnh được chụp lúc mấy giờ." },
    { h: "Nhận ngay học bổng 5 triệu đồng cho học sinh THPT",
      t: "Chỉ cần bấm vào đường dẫn, điền tên đăng nhập và mật khẩu mạng xã hội để xác minh. Chương trình chỉ còn 2 giờ, nhanh tay kẻo hết!",
      src: "Tin nhắn từ một tài khoản lạ, kèm đường dẫn rút gọn.",
      signs: { nguon: "Tài khoản lạ, đường dẫn rút gọn không cho biết sẽ dẫn đến trang nào.", thucgiuc: "“Chỉ còn 2 giờ, nhanh tay kẻo hết” ép em làm ngay." },
      note: "Không chương trình học bổng thật nào đòi mật khẩu mạng xã hội. Đây là kiểu lừa đảo để chiếm tài khoản.",
      tip: "Không bấm đường dẫn lạ, không bao giờ đưa mật khẩu cho ai. Xem thông báo học bổng trên trang của trường hoặc hỏi thầy cô." },
    { h: "Ứng dụng giúp điện thoại sạc đầy pin trong 1 giây",
      t: "Ứng dụng đã có 10 triệu lượt tải chỉ trong 2 giờ. Tải ngay trước khi ứng dụng bị gỡ khỏi kho!",
      src: "Quảng cáo hiện lên khi đang chơi game, không ghi tên công ty.",
      signs: { solieu: "“Sạc đầy trong 1 giây”, “10 triệu lượt tải trong 2 giờ” là những con số khó tin, không rõ lấy từ đâu.", nguon: "Không ghi tên công ty, không biết ai làm ra ứng dụng.", thucgiuc: "“Tải ngay trước khi bị gỡ” ép em làm ngay." },
      note: "Một ứng dụng không thể làm pin sạc nhanh hơn khả năng của bộ sạc và viên pin.",
      tip: "Xem tên nhà phát triển và nhận xét trên kho ứng dụng chính thức; tìm bài đánh giá trên trang công nghệ uy tín." },
    { h: "Thư viện trường mở cửa đến 19 giờ trong tuần ôn thi",
      t: "Thông báo có chữ kí của thư viện, ghi ngày 05/11, đăng trên trang thông tin của trường. Một bạn chia sẻ lại kèm lời bình: “Vậy là từ nay thư viện trường nào cũng mở đến 19 giờ!”",
      src: "Trang thông tin của trường, ngày 05/11.",
      signs: { motTruongHop: "Thông báo chỉ nói về một thư viện, trong tuần ôn thi; lời bình đã suy ra cho mọi trường, mọi lúc." },
      no: { nguon: "Thông báo đăng trên trang của trường, có chữ kí: nguồn rõ ràng.", thoigian: "Thông báo ghi rõ ngày.", giatgan: "Tiêu đề bình thường, không giật gân." },
      note: "Không phải tin nào cũng giả. Bản thông báo đáng tin; chỗ sai nằm ở lời bình khi chia sẻ lại.",
      tip: "Đọc kĩ bản gốc trước khi tin vào lời bình của người chia sẻ." }
  ];
  var TN = null;
  function startTin() { TN = { order: shuffle(CASES.slice()), i: 0, found: 0, total: 0, extra: 0, marks: [], done: false, emptyOk: false }; renderTin(); }
  function tinProgress() { return progressDots(TN.order.length, TN.marks, TN.i) + "<span>Vụ " + Math.min(TN.i + 1, TN.order.length) + " trên " + TN.order.length + "</span>"; }
  function renderTin() {
    var body = $("tinBody"), n = TN.order.length;
    if (TN.i >= n) {
      var msg = TN.found === TN.total && !TN.extra ? "Xuất sắc! Em là một thám tử tinh mắt." : TN.found >= TN.total * 0.7 ? "Rất tốt! Đọc lại các dấu hiệu em bỏ sót để lần sau nhận ra nhanh hơn." : "Không sao. Mỗi khi đọc tin, hãy dừng lại và tự hỏi: ai đưa tin, khi nào, dựa vào đâu?";
      body.innerHTML = "<div class=\"end\"><div class=\"quiz-progress\">" + progressDots(n, TN.marks, -1) + "<span>Hoàn thành</span></div>" +
        "<p class=\"score\">" + TN.found + "<small>/" + TN.total + " dấu hiệu</small></p><p>" + msg + (TN.extra ? " Em chọn thêm " + TN.extra + " dấu hiệu không có trong tin: cẩn thận là tốt, nhưng hãy chỉ ra được bằng chứng cho mỗi nghi ngờ." : "") + "</p>" +
        "<div class=\"actions\"><button type=\"button\" class=\"btn\" id=\"tinAgain\">Chơi lại</button><button type=\"button\" class=\"btn ghost\" data-setmode=\"kiemchung\">Điều tra cùng AI</button></div></div>";
      return;
    }
    var c = TN.order[TN.i];
    TN.done = false; TN.emptyOk = false;
    body.innerHTML = "<div class=\"quiz\"><div class=\"quiz-progress\">" + tinProgress() + "</div>" +
      "<div class=\"newsbox\"><p class=\"stamp\">Tin luyện tập – không có thật</p><p class=\"h\">" + esc(c.h) + "</p><p>" + esc(c.t) + "</p><p class=\"note\">" + esc(c.src) + "</p></div>" +
      "<p class=\"quiz-ask\">Tin này có những dấu hiệu đáng ngờ nào? Chọn tất cả dấu hiệu em thấy.</p>" +
      "<div class=\"signs\" id=\"tinSigns\">" + SIGNS.map(function (s) {
        return "<label class=\"sign\" data-sign=\"" + s[0] + "\"><input type=\"checkbox\" value=\"" + s[0] + "\"><span>" + esc(s[1]) + "<span class=\"res\" hidden></span><span class=\"why\" hidden></span></span></label>";
      }).join("") + "</div>" +
      "<div class=\"actions\"><button type=\"button\" class=\"btn small\" id=\"tinCheck\">Kiểm tra</button></div>" +
      "<div class=\"fb\" id=\"tinFb\"></div></div>";
  }
  function checkTin() {
    var c = TN.order[TN.i], picked = [];
    each($("tinSigns").querySelectorAll("input"), function (x) { if (x.checked) picked.push(x.value); });
    if (!picked.length && !TN.emptyOk) {
      TN.emptyOk = true;
      $("tinFb").innerHTML = "<p class=\"muted\">Em chưa chọn dấu hiệu nào. Nếu em thấy tin này không có gì đáng ngờ, bấm “Kiểm tra” lần nữa.</p>";
      return;
    }
    TN.done = true;
    var ck = $("tinCheck"); if (ck) ck.parentNode.hidden = true;
    var keys = Object.keys(c.signs), hits = 0, extra = 0;
    each($("tinSigns").querySelectorAll(".sign"), function (lab) {
      var id = lab.getAttribute("data-sign"), main = keys.indexOf(id) >= 0, on = picked.indexOf(id) >= 0;
      var res = lab.querySelector(".res"), why = lab.querySelector(".why");
      lab.classList.add("done"); lab.querySelector("input").disabled = true;
      if (main && on) { lab.classList.add("hit"); res.textContent = "Em tìm đúng"; hits++; }
      else if (main) { lab.classList.add("miss"); res.textContent = "Em bỏ sót"; }
      else if (on) { lab.classList.add("false"); res.textContent = "Không có trong tin này"; extra++; }
      res.hidden = !(main || on);
      var w = main ? c.signs[id] : on && c.no && c.no[id] ? c.no[id] : "";
      why.textContent = w; why.hidden = !w;
    });
    TN.found += hits; TN.total += keys.length; TN.extra += extra;
    TN.marks.push(hits === keys.length && !extra);
    var last = TN.i === TN.order.length - 1;
    var v = hits === keys.length && !extra ? "<span class=\"verdict ok\">Chính xác!</span>" : hits === keys.length ? "<span class=\"verdict ok\">Tìm đủ!</span>" : hits ? "<span class=\"verdict\">Gần đúng.</span>" : "<span class=\"verdict no\">Chưa đúng.</span>";
    $("tinFb").innerHTML = "<p>" + v + " Em tìm ra " + hits + " trên " + keys.length + " dấu hiệu" + (extra ? " và chọn thêm " + extra + " dấu hiệu không có trong tin" : "") + ".</p>" +
      (c.note ? "<p>" + esc(c.note) + "</p>" : "") + "<p><b>Cách kiểm chứng:</b> " + esc(c.tip) + "</p>" +
      "<div class=\"actions\"><button type=\"button\" class=\"btn small\" id=\"tinNext\">" + (last ? "Xem kết quả" : "Vụ tiếp theo") + "</button></div>";
    $("tinLive").textContent = "Em tìm ra " + hits + " trên " + keys.length + " dấu hiệu.";
    document.querySelector("#tinBody .quiz-progress").innerHTML = tinProgress();
    $("tinNext").focus();
  }
  $("tinBody").addEventListener("click", function (e) {
    var t = closest(e.target, "button");
    if (!t || t.getAttribute("data-setmode")) return;
    if (t.id === "tinCheck" && !TN.done) checkTin();
    else if (t.id === "tinNext") { TN.i++; renderTin(); var f = document.querySelector("#tinSigns input") || $("tinAgain"); if (f) f.focus(); }
    else if (t.id === "tinAgain") { startTin(); var g = document.querySelector("#tinSigns input"); if (g) g.focus(); }
  });

  /* ---------- Tự kiểm tra: 5 thành phần của bảng kiểm lập luận ---------- */
  var CHECKS = [
    { q: "Em đã nói rõ mình đồng ý hay không đồng ý, đúng trọng tâm câu hỏi chưa?", hint: "Ví dụ: “Mình cho rằng nên…”.",
      fix: "Viết lại câu đầu tiên thật rõ: “Mình cho rằng… vì…”, và trả lời đúng câu hỏi tranh luận.", cmd: "GỢI Ý" },
    { q: "Em đã có lí lẽ và ít nhất một bằng chứng có nguồn chưa?", hint: "Số liệu, sự kiện cần ghi rõ lấy từ đâu và kiểm chứng ở hai nguồn.",
      fix: "Thêm một ví dụ hoặc số liệu và ghi rõ nguồn. Nhờ AI chỉ cách kiểm chứng, không nhờ AI tìm hộ.", cmd: "KIỂM CHỨNG" },
    { q: "Lí lẽ của em có thật sự dẫn tới luận điểm, không mắc ngụy biện chưa?", hint: "Ví dụ: vơ đũa cả nắm, “ai cũng làm vậy nên đúng”.",
      fix: "Nhờ AI soi lỗi trong câu em vừa viết rồi tự sửa. Có thể xem lại 12 thẻ ngụy biện ở phần Trò chơi.", cmd: "SOI LỖI" },
    { q: "Em đã nêu và đáp lại được ít nhất một ý kiến trái chiều chưa?", hint: "Người khác có thể phản đối em thế nào?",
      fix: "Nhờ AI phản bác thêm một lần, rồi tập trả lời bằng lí lẽ.", cmd: "PHẢN BÁC",
      alt: "Tự nghĩ xem người khác sẽ phản đối thế nào, viết thêm một câu đáp lại rồi gửi cho AI." },
    { q: "Em đã nói khi nào ý kiến của mình không còn đúng chưa?", hint: "Ví dụ: “Điều này đúng khi…, nhưng nếu… thì cần xem lại.”",
      fix: "Thêm một câu nêu điều kiện hoặc trường hợp ngoại lệ. Thử đổi phe để nhìn vấn đề từ phía bên kia.", cmd: "ĐỔI PHE",
      alt: "Thêm một câu nêu điều kiện hoặc trường hợp ngoại lệ: “Ý kiến này đúng khi…, nhưng nếu… thì cần xem lại.”" }
  ];
  var CKEY = "bcpb-tukiemtra-v1";
  var A = load(CKEY);
  if (!A || A.length !== CHECKS.length) A = CHECKS.map(function () { return null; });
  function chip(cmd, label) { return "<button type=\"button\" class=\"cmd-chip\" data-cmd=\"" + esc(cmd) + "\"><kbd>" + esc(cmd) + "</kbd><span>" + esc(label) + "</span></button>"; }
  $("qList").innerHTML = CHECKS.map(function (c, i) {
    return "<li class=\"qrow\"><span class=\"comp\">" + (i + 1) + " · " + esc(BCPB_CRITERIA[i][0]) + "</span><span class=\"q\" id=\"q" + i + "\">" + esc(c.q) + "<small>" + esc(c.hint) + "</small></span>" +
      "<span class=\"yn\" role=\"radiogroup\" aria-labelledby=\"q" + i + "\">" +
      "<label><input type=\"radio\" name=\"ck" + i + "\" value=\"1\"" + (A[i] === 1 ? " checked" : "") + "><span>Có rồi</span></label>" +
      "<label><input type=\"radio\" name=\"ck" + i + "\" value=\"0\"" + (A[i] === 0 ? " checked" : "") + "><span>Chưa</span></label></span>" +
      "<div class=\"qfix\" id=\"fix" + i + "\" aria-live=\"polite\"></div></li>";
  }).join("");
  function renderCheck() {
    var mode = radio("mode") || "full", game = BCPB_GAMES.indexOf(mode) >= 0;
    var avail = bcpbCommands(mode).map(function (c) { return c.key; });
    $("qGame").hidden = !game;
    $("qGame").textContent = game ? "Em đang chọn trò chơi “" + BCPB_MODES[mode] + "”. Năm câu hỏi này dành cho lúc em nêu ý kiến của mình, ví dụ khi luyện “Trọn bộ 5P” hoặc “Đối thủ”." : "";
    CHECKS.forEach(function (c, i) {
      var box = $("fix" + i);
      if (A[i] !== 0) { box.innerHTML = ""; return; }
      var can = !game && avail.indexOf(c.cmd) >= 0;
      box.innerHTML = "<p class=\"fixp\">" + esc(can || !c.alt ? c.fix : c.alt) + "</p>" + (can ? "<p class=\"qcmd\">Gõ cho AI: " + chip(c.cmd, "bấm để chép") + "</p>" : "") +
        "<p class=\"note\">Sửa xong thì bấm lại “Có rồi”.</p>";
    });
    var done = A.filter(function (x) { return x !== null; }).length, todo = A.filter(function (x) { return x === 0; }).length;
    var end = $("qEnd");
    if (done < CHECKS.length) end.innerHTML = done ? "<p class=\"note\">Còn " + (CHECKS.length - done) + " câu chưa trả lời.</p>" : "";
    else if (todo) end.innerHTML = "<p>Em còn <b>" + todo + " thành phần</b> nên làm thêm, xem gợi ý ngay dưới từng câu.</p>";
    else {
      var fin = mode === "trongtai" ? ["CHẤM LẠI", "Lập luận của em đã đủ 5 thành phần. Gửi bản đã sửa rồi gõ lệnh này để AI chấm lại."]
        : !game ? ["PHÁT HUY", "Lập luận của em đã đủ 5 thành phần. Gõ lệnh này để viết bản phát huy và nhờ AI chấm."]
        : [null, "Lập luận của em đã đủ 5 thành phần. Làm tốt lắm!"];
      end.innerHTML = "<p><b>" + esc(fin[1]) + "</b></p>" + (fin[0] ? "<p>" + chip(fin[0], "bấm để chép") + "</p>" : "");
    }
  }
  $("qList").addEventListener("change", function (e) {
    var m = /^ck(\d)$/.exec(e.target.name || "");
    if (!m) return;
    A[Number(m[1])] = Number(e.target.value);
    $("qStatus").textContent = "";
    save(CKEY, A); renderCheck();
  });
  $("qReset").addEventListener("click", function () {
    A = CHECKS.map(function () { return null; }); save(CKEY, A);
    each($("qList").querySelectorAll("input"), function (x) { x.checked = false; });
    $("qStatus").textContent = "";
    renderCheck();
  });

  /* ---------- Nhật ký và sổ nhật ký ---------- */
  var JKEY = "bcpb-nhatky-v1", LOGKEY = "bcpb-so-v1", JF = ["jAi", "jLearn", "jNext"];
  var J = load(JKEY) || {};
  JF.forEach(function (id) {
    $(id).value = J[id] || "";
    $(id).addEventListener("input", function () { J[id] = $(id).value; save(JKEY, J); });
  });
  function jEmpty() { return JF.every(function (id) { return !$(id).value.trim(); }); }
  function parseScore(t) {
    var m = /bản\s*đầu\D{0,12}?(\d{1,2})\s*\/\s*20[\s\S]{0,40}?bản\s*(?:phát\s*huy|mới|sau)\D{0,12}?(\d{1,2})\s*\/\s*20/i.exec(t || "");
    if (!m) return null;
    var a = Number(m[1]), b = Number(m[2]);
    return a >= 0 && a <= 20 && b >= 0 && b <= 20 ? [a, b] : null;
  }
  function topicFromAi(t) {
    var m = /Chủ đề\s*:\s*([^|\n]+)/i.exec(t || "");
    var v = m ? m[1].replace(/\s+/g, " ").trim() : "";
    return v && !/^…+$|^\.+$/.test(v) ? v : "";
  }
  function cleanAi(t) { return String(t || "").replace(/^.*Điều em học được.*$/gim, "").replace(/\n{3,}/g, "\n\n").trim(); }
  function entryText(e) {
    var lines = ["NHẬT KÝ LUYỆN PHẢN BIỆN – ngày " + e.d];
    if (e.ai) lines.push("", cleanAi(e.ai));
    else lines.push("Chủ đề: " + (e.t || "……"), (BCPB_GAMES.indexOf(e.m) >= 0 ? "Trò chơi: " : "Vai AI: ") + (BCPB_MODES[e.m] || "") + " | Mức: " + ((BCPB_LEVELS[e.l] || {}).name || ""));
    lines.push("", "Điều em học được: " + (e.learn || "……"), "Lần sau em sẽ thử: " + (e.next || "……"));
    return lines.join("\n");
  }
  function makeEntry() {
    var o = current(), ai = $("jAi").value.trim();
    return { d: today(), t: topicFromAi(ai) || (o.topic || "").trim(), m: o.mode, l: o.level, sc: parseScore(ai), ai: ai, learn: $("jLearn").value.trim(), next: $("jNext").value.trim() };
  }
  $("jNote").textContent = storageOK ? "Chữ em viết được giữ trên máy này cho lần sau. Bấm Sao chép để dán vào phiếu nhật ký hoặc gửi giáo viên."
    : "Trang không lưu được chữ trên máy này, nên nhớ bấm Sao chép trước khi đóng trang.";
  $("jSave").hidden = !storageOK;
  function jWarn(msg) { $("jStatus").className = "status warn"; $("jStatus").textContent = msg; }
  $("jSave").addEventListener("click", function () {
    if (jEmpty()) { jWarn("Em chưa viết gì vào nhật ký."); return; }
    var e = makeEntry(), log = load(LOGKEY) || [];
    log.unshift(e);
    if (log.length > 30) log.length = 30;
    save(LOGKEY, log);
    renderLog();
    $("jStatus").className = "status";
    $("jStatus").textContent = "Đã lưu vào sổ nhật ký" + (e.sc ? ", ghi nhận điểm " + e.sc[0] + "/20 → " + e.sc[1] + "/20" : "") + ".";
  });
  $("jCopy").addEventListener("click", function () {
    if (jEmpty()) { jWarn("Em chưa viết gì vào nhật ký."); return; }
    var text = entryText(makeEntry());
    copyText(text, function () { $("jStatus").className = "status"; $("jStatus").textContent = "Đã sao chép nhật ký."; $("jManual").hidden = true; },
      function () {
        var ta = $("jManual"); ta.hidden = false; ta.value = text; ta.focus(); ta.select();
        jWarn("Trình duyệt chặn sao chép. Nhật ký đã được bôi đen ở ô bên dưới, em giữ ngón tay rồi chọn Sao chép.");
      });
  });
  $("jClear").addEventListener("click", function () {
    if (jEmpty()) return;
    twoStep(this, "Bấm lần nữa để xóa", function () {
      J = {}; save(JKEY, J);
      JF.forEach(function (id) { $(id).value = ""; });
      $("jManual").hidden = true;
      $("jStatus").className = "status"; $("jStatus").textContent = "Đã xóa các ô. Sẵn sàng ghi buổi mới.";
      $("jAi").focus();
    });
  });
  function renderLog() {
    if (!storageOK) { $("logCard").hidden = true; return; }
    var log = load(LOGKEY) || [];
    if (!log.length) {
      $("logSummary").textContent = "";
      $("logList").innerHTML = "<li><span class=\"note\">Chưa có buổi nào. Viết nhật ký ở trên rồi bấm “Lưu vào sổ”.</span></li>";
      return;
    }
    var scores = log.filter(function (e) { return e.sc; }).reverse().slice(-6).map(function (e) { return e.sc[1]; });
    $("logSummary").textContent = log.length + " buổi" + (scores.length > 1 ? " · điểm bản phát huy qua các buổi: " + scores.join(" → ") + " (trên 20)" : "");
    $("logList").innerHTML = log.map(function (e, k) {
      return "<li><div><p class=\"meta\">" + esc(e.d) + " · " + esc(BCPB_MODES[e.m] || "") + " · " + esc((BCPB_LEVELS[e.l] || {}).name || "") + "</p>" +
        "<p class=\"tt\">" + esc(e.t || "Chưa ghi chủ đề") + "</p>" +
        (e.sc ? "<p class=\"sc\">Điểm bảng kiểm: <b>" + e.sc[0] + "/20 → " + e.sc[1] + "/20</b></p>" : "") + "</div>" +
        "<div class=\"acts\"><button type=\"button\" class=\"linkish\" data-logcopy=\"" + k + "\">Chép</button><button type=\"button\" class=\"linkish quiet\" data-logdel=\"" + k + "\">Xóa</button></div></li>";
    }).join("");
  }
  $("logList").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-logcopy], [data-logdel]");
    if (!b) return;
    var log = load(LOGKEY) || [];
    if (b.hasAttribute("data-logcopy")) {
      var en = log[Number(b.getAttribute("data-logcopy"))];
      if (!en) return;
      copyText(entryText(en), function () { b.textContent = "Đã chép"; setTimeout(function () { b.textContent = "Chép"; }, 2500); }, function () { b.textContent = "Không chép được"; });
      return;
    }
    twoStep(b, "Xóa thật?", function () {
      log.splice(Number(b.getAttribute("data-logdel")), 1);
      save(LOGKEY, log); renderLog();
    });
  });

  /* ---------- Đồng hồ dùng trên lớp ---------- */
  var SKEY = "bcpb-buoi";
  var curS = (function () { var v = load(SKEY); return typeof v === "number" && SESSIONS[v] ? v : 0; })();
  var STG = SESSIONS[curS].stages;
  var T = { i: 0, left: STG[0].min * 60000, running: false, started: false, endAt: 0, iv: null, wake: null, done: false, audio: null, flash: null };
  function locked() { return T.started && !T.done; }
  function renderSessTabs() {
    $("sessTabs").innerHTML = SESSIONS.map(function (s, i) {
      return "<button type=\"button\" class=\"path-btn\" data-sess=\"" + i + "\" aria-pressed=\"" + (i === curS) + "\"" + (locked() && i !== curS ? " aria-disabled=\"true\"" : "") + ">" +
        "<span class=\"eyebrow\">Buổi " + (i + 1) + " · 45 phút</span><b>" + esc(s.name) + "</b><small>" + esc(sessShort(s)) + "</small></button>";
    }).join("");
  }
  function renderSess() {
    var s = SESSIONS[curS];
    $("sessK").textContent = "Buổi " + (curS + 1) + " · 45 phút · " + STG.length + " phần";
    $("sess-t").textContent = s.name;
    $("sessGoal").textContent = s.goal;
    $("sessKv").innerHTML = "<dt>Vai AI</dt><dd>" + esc(BCPB_MODES[s.mode]) + "</dd><dt>Mức</dt><dd>" + esc(BCPB_LEVELS[s.level].name) + "</dd>" +
      "<dt>Hình thức</dt><dd>" + (s.voice ? "Nói bằng giọng nói" : "Gõ chữ") + "</dd>" + (s.game ? "<dt>Trò chơi</dt><dd>Đoán lỗi ngụy biện, ngay trên trang</dd>" : "");
    $("sessApplied").textContent = "";
  }
  $("sessTabs").addEventListener("click", function (e) {
    var b = closest(e.target, "[data-sess]");
    if (!b) return;
    var i = Number(b.getAttribute("data-sess"));
    if (i === curS) return;
    if (locked()) { $("sessStatus").textContent = "Đồng hồ của buổi này đang dùng. Bấm “Làm lại từ đầu” nếu muốn đổi sang buổi khác."; return; }
    $("sessStatus").textContent = "";
    curS = i; save(SKEY, i); STG = SESSIONS[i].stages;
    T.i = 0; T.left = STG[0].min * 60000; T.done = false; T.started = false;
    renderSessTabs(); renderSess(); renderTimer();
  });
  $("sessApply").addEventListener("click", function () {
    applySession(curS);
    $("sessApplied").textContent = "Đã chọn sẵn ở phần Luyện với AI: " + sessShort(SESSIONS[curS]) + ".";
  });
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); var m = Math.floor(s / 60); s = s % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function renderTimer() {
    var st = STG[T.i], paused = T.started && !T.running && !T.done, last = T.i === STG.length - 1;
    $("cStep").innerHTML = T.done ? "Hết giờ" : (paused ? "Đang tạm dừng · " : "") + "Phần " + (T.i + 1) + " trên " + STG.length +
      (st.p.length ? " · " + keysHtml(st.p) + " " + esc(stepLabel(st.p)) : "");
    $("cName").textContent = T.done ? "Hoàn thành buổi luyện!" : st.name;
    $("cTime").textContent = mmss(T.left);
    $("cTime").className = "clock-time" + (!T.done && T.started && T.left <= 60000 ? " low" : "") + (paused ? " paused" : "");
    $("cDo").innerHTML = T.done ? "Cảm ơn cả lớp. Nhớ ghi nhật ký nhé!" : "<b>Học sinh:</b> " + esc(st.todo);
    $("cStart").textContent = T.done ? "Bắt đầu lại" : T.running ? "Tạm dừng" : T.started ? "Tiếp tục" : "Bắt đầu";
    $("cNext").hidden = T.done;
    $("cNext").textContent = last ? "Kết thúc buổi" : "Sang phần tiếp";
    $("cBack").hidden = T.done || T.i === 0;
    $("cReset").hidden = T.done || (!T.started && T.i === 0);
    $("cPlan").innerHTML = STG.map(function (s, k) {
      var cls = T.done || k < T.i ? "done" : k === T.i ? "now" : "";
      return "<li class=\"" + cls + "\"><span class=\"mark\">" + (cls === "done" ? "✓" : k + 1) + "</span><span>" + esc(s.name) +
        (s.p.length ? "<span class=\"keys\" aria-hidden=\"true\">" + keysHtml(s.p) + "</span>" : "") + "</span><span class=\"min\">" + s.min + " phút</span></li>";
    }).join("");
  }
  function beep() {
    var card = $("cCard");
    card.classList.add("flash"); clearTimeout(T.flash); T.flash = setTimeout(function () { card.classList.remove("flash"); }, 3000);
    if (!T.audio) return;
    try {
      var ctx = T.audio, t0 = ctx.currentTime;
      [0, 0.5, 1].forEach(function (d) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "triangle"; o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.6, t0 + d + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.4);
        o.connect(g); g.connect(ctx.destination); o.start(t0 + d); o.stop(t0 + d + 0.42);
      });
    } catch (e) {}
  }
  function lockScreen(on) {
    try {
      if (on && navigator.wakeLock && !T.wake) navigator.wakeLock.request("screen").then(function (l) { T.wake = l; }, function () {});
      if (!on && T.wake) { T.wake.release(); T.wake = null; }
    } catch (e) {}
  }
  function stopTicking() { if (T.iv) { clearInterval(T.iv); T.iv = null; } }
  function finish() { T.left = 0; T.running = false; T.done = true; stopTicking(); lockScreen(false); renderSessTabs(); }
  function tick() {
    if (!T.running) return;
    T.left = T.endAt - Date.now();
    if (T.left <= 0) {
      /* Tính tiếp từ lúc phần trước thật sự hết giờ, để trang bị ẩn một lúc vẫn đúng giờ */
      while (T.left <= 0 && T.i < STG.length - 1) { T.i++; T.endAt += STG[T.i].min * 60000; T.left = T.endAt - Date.now(); }
      if (T.left <= 0) finish();
      beep();
    }
    renderTimer();
  }
  function goTo(i) {
    T.i = i; T.left = STG[i].min * 60000;
    if (T.running) T.endAt = Date.now() + T.left;
    renderTimer();
  }
  $("cStart").addEventListener("click", function () {
    try { if (!T.audio && (window.AudioContext || window.webkitAudioContext)) T.audio = new (window.AudioContext || window.webkitAudioContext)(); if (T.audio && T.audio.state === "suspended") T.audio.resume(); } catch (e) {}
    if (T.done) { T.i = 0; T.left = STG[0].min * 60000; T.done = false; }
    if (T.running) { T.running = false; T.left = T.endAt - Date.now(); stopTicking(); }
    else { T.running = true; T.started = true; T.endAt = Date.now() + T.left; stopTicking(); T.iv = setInterval(tick, 250); lockScreen(true); scrollToEl($("cCard")); }
    $("sessStatus").textContent = "";
    renderSessTabs(); renderTimer();
  });
  $("cNext").addEventListener("click", function () {
    if (T.done) return;
    if (T.i < STG.length - 1) goTo(T.i + 1);
    else { finish(); renderTimer(); }
  });
  $("cBack").addEventListener("click", function () { if (T.i > 0 && !T.done) goTo(T.i - 1); });
  $("cReset").addEventListener("click", function () {
    twoStep(this, "Bấm lần nữa để làm lại từ đầu", function () {
      stopTicking(); lockScreen(false);
      T.running = false; T.started = false; T.done = false; T.i = 0; T.left = STG[0].min * 60000;
      $("sessStatus").textContent = "";
      renderSessTabs(); renderTimer();
    });
  });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && T.running) { T.wake = null; lockScreen(true); tick(); } });

  /* ---------- Mục lục phần Cơ sở khoa học ---------- */
  function buildToc() {
    var heads = Array.prototype.slice.call(document.querySelectorAll("#paper h3[id]")), toc = $("toc"), ml = $("tocMList"), btns = [];
    heads.forEach(function (h) {
      var label = h.textContent.replace(/^\s*\d+\s*/, "");
      var b = document.createElement("button"); b.type = "button"; b.textContent = label; b.setAttribute("data-jump", h.id); toc.appendChild(b); btns.push(b);
      var li = document.createElement("li"), b2 = document.createElement("button");
      b2.type = "button"; b2.className = "linkish"; b2.textContent = label; b2.setAttribute("data-jump", h.id);
      li.appendChild(b2); ml.appendChild(li);
    });
    ml.addEventListener("click", function (e) { if (closest(e.target, "[data-jump]")) $("tocM").open = false; });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        btns.forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-jump") === en.target.id); });
      });
    }, { rootMargin: "-80px 0px -70% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ---------- Trích dẫn ---------- */
  $("copyCite").addEventListener("click", function () {
    var st = $("citeStatus");
    copyText($("citeText").textContent, function () { st.className = "status"; st.textContent = "Đã sao chép."; },
      function () { st.className = "status warn"; st.textContent = "Không chép tự động được, hãy bôi đen để chép."; });
  });

  /* ---------- Khởi động ---------- */
  /* Thanh thẻ dính ở đầu trang có thể cao 1 hoặc 2 dòng (điện thoại): đo để tiêu đề không bị che khi nhảy tới */
  function setNavH() { var t = document.querySelector(".tabs"); if (t) document.documentElement.style.setProperty("--navh", (t.offsetHeight + 12) + "px"); }
  setNavH(); window.addEventListener("resize", setNavH);
  renderInfo();
  buildRing();
  restore();
  render();
  renderFieldChips(); renderLib();
  startQuiz(BCPB_LEVELS[current().level].tier);
  startTin();
  renderSessTabs(); renderSess(); renderTimer();
  renderCheck(); renderLog();
  buildToc();
  var lastTab = load(TKEY);
  if (typeof lastTab === "string" && lastTab !== "t-luyen" && $(lastTab) && $(lastTab).classList.contains("tab")) showTab(lastTab);
})();
