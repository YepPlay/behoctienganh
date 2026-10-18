/* Smoke-test chơi THẬT bằng jsdom (mượn jsdom của behoctoan nếu máy chưa cài):
   chọn bạn → chọn cấp độ → menu → chơi TỪNG mode tới màn tổng kết → đổi cấp
   độ → popup chọn vòng ≡ → toggle tiếng đọc → kiểm tra tiến độ được ghi.
   Lệnh:  node tools/smoke-test.js     (mất ~2 phút, exit 1 nếu có lỗi) */
const fs = require("fs");
const path = require("path");

let JSDOM;
try { ({ JSDOM } = require("jsdom")); }
catch (e) {
  ({ JSDOM } = require(path.join(__dirname, "..", "..", "behoctoan", "node_modules", "jsdom")));
}

const ROOT = path.join(__dirname, "..");
let fails = 0;
function ok(cond, label) {
  if (cond) console.log("  ✓ " + label);
  else { fails++; console.log("  ✗ " + label); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  /* ---- Nạp DOM ---- */
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
    .replace(/<script src="[^"]+"><\/script>/g, "");
  const dom = new JSDOM(html, {
    url: "http://localhost/behoctienganh/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const document = window.document;
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  /* Lỗi JS bất kỳ trong lúc chơi = fail */
  const jsErrors = [];
  window.addEventListener("error", e => jsErrors.push(e.message || String(e.error)));

  /* ---- Polyfill những gì jsdom thiếu (âm thanh, fetch, ResizeObserver…) ---- */
  window.ResizeObserver = class { observe() { } unobserve() { } disconnect() { } };
  document.elementFromPoint = () => null;   /* match dùng để bắt-thả */
  window.fetch = () => Promise.resolve({
    ok: true, status: 200,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(16)),
  });
  window.AudioContext = class {
    get state() { return "running"; }
    resume() { }
    get currentTime() { return 0.1; }
    get destination() { return {}; }
    decodeAudioData() { return Promise.resolve({ duration: 0.1 }); }
    createBufferSource() {
      const n = { buffer: null, onended: null, t: null, connect() { }, start() { n.t = setTimeout(() => n.onended && n.onended(), 5); }, stop() { clearTimeout(n.t); } };
      return n;
    }
    createOscillator() {
      return { type: "", frequency: { value: 0 }, connect() { }, start() { }, stop() { } };
    }
    createGain() {
      return { gain: { value: 0, setValueAtTime() { }, exponentialRampToValueAtTime() { } }, connect() { } };
    }
  };
  window.Audio = class {
    constructor() { this._src = ""; this.onended = null; this.onerror = null; }
    play() { setTimeout(() => this.onended && this.onended(), 5); return Promise.resolve(); }
    pause() { }
    load() { }
    removeAttribute() { }
    get src() { return this._src; }
    set src(v) { this._src = v; }
  };

  /* ---- Nạp JS: gộp 1 eval — các file dùng chung global scope như trình duyệt ---- */
  let code = ["js/data.js", "js/audio.js", "js/games.js", "js/main.js"]
    .map(f => fs.readFileSync(path.join(ROOT, f), "utf8")).join("\n;\n");
  code += "\n;window.__t = { Game: Game, Voice: Voice };";
  window.eval(code);

  const T = window.__t;
  const st = () => T.Game._state();

  async function until(cond, ms, label) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (cond()) return true;
      await sleep(40);
    }
    fails++;
    console.log("  ✗ TIMEOUT: " + label);
    return false;
  }

  /* Chơi 1 mode. opt.partial = n → sau n vòng bấm Về Menu;
     opt.jumpTest → sau vòng đầu mở popup ≡ nhảy thẳng tới chữ Z rồi chơi nốt. */
  async function playMode(mode, opt) {
    opt = opt || {};
    const card = $(`.mode-card[data-mode="${mode}"]`);
    if (!card) { fails++; console.log("  ✗ không thấy card mode " + mode); return; }
    card.click();
    await until(() => st() && st().mode === mode, 3000, mode + " khởi động");
    if (!st()) return;

    let wrongTried = false, lastIdx = -1, lastPhase = "", jumpDone = false;
    const t0 = Date.now();

    while (st() && Date.now() - t0 < 60000) {
      const s = st();

      /* Chế độ từng phần: tới vòng yêu cầu thì dừng NGAY (chưa bấm gì nữa) */
      if (opt.partial != null && s.idx >= opt.partial) break;

      /* Jump test: sau vòng đầu (đã quay về trang học vòng 2) → mở popup ≡ */
      if (opt.jumpTest && !jumpDone && s.idx >= 1 && s.phase === "study") {
        jumpDone = true;
        $("#play-progress").click();
        await sleep(60);
        ok($("#jump-picker").classList.contains("open"), "popup chọn vòng (≡) mở ra");
        const chips = $$("#jump-grid .popup-chip");
        ok(chips.length === 26, "grid có đủ 26 chữ cái");
        chips[25].click();
        await sleep(80);
        ok(!$("#jump-picker").classList.contains("open"), "bấm chữ Z → popup tự đóng");
        ok(st() && st().idx === 25, "Game nhảy đúng tới vòng 25 (chữ Z)");
        continue;
      }

      if (s.idx !== lastIdx || s.phase !== lastPhase) {
        lastIdx = s.idx; lastPhase = s.phase;
      }

      /* Mode topic: chọn chủ đề trước */
      const tc = $(".topic-card");
      if (tc) { tc.click(); await sleep(80); continue; }

      /* Trang học (abc/topic): phải có thẻ bấm nghe, bấm Tiếp sang quiz */
      const learn = $("#btn-learn-next");
      if (learn) {
        if (!$(".learn-card")) { fails++; console.log("  ✗ " + mode + ": trang học thiếu .learn-card"); }
        learn.click(); await sleep(80); continue;
      }

      /* Spell: chip data-i = vị trí gốc trong từ → bấm đúng thứ tự luôn đúng */
      if ($(".spell-chip")) {
        const total = $$(".spell-slot").length;
        const filled = $$(".spell-slot.filled").length;
        if (filled >= total) { await sleep(60); continue; }  /* đang tung hô → chờ chuyển vòng */
        const chip = $(`.spell-chip[data-i="${filled}"]`);
        if (chip && !chip.disabled) chip.click();
        await sleep(60); continue;
      }

      /* Match / MatchVi (endless): thả-chọn 1 cặp, nối hết 1 nhóm rồi về menu */
      if ($(".m-pic")) {
        const pics = $$(".m-pic:not(.matched)");
        if (!pics.length) { await sleep(80); continue; }     /* chờ vòng mới */
        const pic = pics[0];
        pic.dispatchEvent(new window.Event("pointerdown", { bubbles: false, cancelable: true }));
        await sleep(30);
        window.dispatchEvent(new window.Event("pointerup"));
        await sleep(30);
        const lc = $(`.m-letter[data-w="${pic.dataset.w}"]:not(.matched)`);
        if (lc) lc.click();
        await sleep(140);
        continue;
      }

      /* Quiz: bấm dần các ô còn hoạt động — ô sai tự khóa, ô đúng đi tiếp */
      const opts = $$(".opt-btn:not([disabled])");
      if (!opts.length) { await sleep(60); continue; }

      /* Lần đầu của mỗi mode: cố tình bấm SAI để kiểm tra phản hồi đáp án sai */
      if (!wrongTried && s.q && typeof s.q.answer === "number") {
        wrongTried = true;
        const wrong = opts.find(b => parseInt(b.dataset.i, 10) !== s.q.answer);
        if (wrong) {
          wrong.click();
          await sleep(140);
          ok(wrong.disabled && wrong.classList.contains("bad"),
            `${mode}: bấm đáp án sai → bị khóa + hiện hiệu ứng`);
          continue;
        }
      }

      /* Các vòng sau: bấm ĐÚNG ngay lần đầu — kiểm tra cách tính sao
         (1 sao = vòng trả lời đúng ngay lần đầu) */
      let pick = null;
      if (s.q && typeof s.q.answer === "number") {
        pick = opts.find(b => parseInt(b.dataset.i, 10) === s.q.answer);
      }
      (pick || opts[0]).click();
      await sleep(140);
    }

    if (!st()) {
      /* Chơi đủ vòng → màn tổng kết */
      await until(() => $("#screen-summary").classList.contains("active"), 6000, mode + " tới màn tổng kết");
      const title = $("#summary-title").textContent;
      const stars = $("#summary-stars").textContent;
      ok(title.length > 0 && stars.includes("ngôi sao"),
        `${mode}: tổng kết "${title}" · ${stars.replace(/\s+/g, " ").trim().slice(0, 26)}`);
      $("#btn-menu").click();
      await until(() => $("#screen-menu").classList.contains("active"), 3000, mode + " về menu");
    } else {
      $("#btn-back").click();
      await until(() => $("#screen-menu").classList.contains("active"), 3000, mode + " về menu");
      ok(true, mode + " chơi thử " + (opt.partial != null ? opt.partial + " vòng" : "1 nhóm") + " → Về Menu");
    }
  }

  /* ==================== BẮT ĐẦU ==================== */
  console.log("1/5 Khởi động + chọn bạn + chọn cấp độ …");
  window.init();
  ok($("#screen-choose").classList.contains("active"), "màn chọn bạn hiện ra");

  $('.choose-card[data-theme="boy"]').click();
  await sleep(80);
  ok($("#screen-level").classList.contains("active"), "chưa có cấp độ → hiện màn chọn cấp độ");

  $('.level-card[data-level="small"]').click();
  await sleep(80);
  ok($("#screen-menu").classList.contains("active"), "chọn Bé Nhỏ → vào menu");

  const smallModes = ["abc", "topic", "listen", "pic", "match", "phrases"];
  const shown = $$(".mode-card").map(c => c.dataset.mode);
  ok(JSON.stringify(shown) === JSON.stringify(smallModes),
    "menu Bé Nhỏ đúng 6 mode: " + shown.join(", "));

  const v0 = T.Voice.isOn();
  $("#btn-voice").click();
  ok(T.Voice.isOn() !== v0, "toggle 🔊/🔇 hoạt động");
  $("#btn-voice").click();
  ok(T.Voice.isOn() === v0, "bật lại tiếng đọc");

  console.log("2/5 Chơi 6 mode của Bé Nhỏ …");
  await playMode("abc", { jumpTest: true });   /* học+quiz 1 chữ → popup ≡ nhảy tới Z → tổng kết */
  await playMode("topic", { partial: 2 });
  await playMode("listen");
  await playMode("pic");
  await playMode("phrases");
  await playMode("match", { partial: 1 });

  console.log("3/5 Đổi sang cấp độ Bé Lớn …");
  $("#btn-level").click();
  await sleep(80);
  ok($("#screen-level").classList.contains("active"), "nút 🎚️ mở màn chọn cấp độ");
  $('.level-card[data-level="big"]').click();
  await sleep(80);
  const bigModes = ["abc", "spell", "listenTxt", "matchVi", "fill", "convo"];
  const shownBig = $$(".mode-card").map(c => c.dataset.mode);
  ok(JSON.stringify(shownBig) === JSON.stringify(bigModes),
    "menu Bé Lớn đúng: " + shownBig.join(", "));

  console.log("4/5 Chơi 5 mode mới của Bé Lớn …");
  await playMode("spell");
  await playMode("listenTxt");
  await playMode("matchVi", { partial: 1 });
  await playMode("fill");
  await playMode("convo");

  console.log("5/5 Kiểm tra lưu tiến độ …");
  let saved = null;
  try { saved = JSON.parse(window.sessionStorage.getItem("en.progress") || "null"); } catch (e) { }
  ok(saved && saved.boy && saved.boy.total > 0, "tiến độ ghi vào sessionStorage (en.progress)");
  ok(saved && saved.boy.best && saved.boy.best.listen > 0, "best của mode listen được lưu");
  ok(window.sessionStorage.getItem("en.theme") === "boy", "theme được ghi (en.theme=boy)");
  ok(window.sessionStorage.getItem("en.level") === "big", "cấp độ được ghi (en.level=big)");

  ok(jsErrors.length === 0, jsErrors.length ? "LỖI JS: " + jsErrors.join(" | ") : "không có lỗi JS nào trong lúc chơi");

  console.log("\n========== KẾT QUẢ ==========");
  if (fails) { console.log(`❌ ${fails} mục fail`); process.exit(1); }
  console.log("✅ Smoke-test PASSED — chơi trọn vẹn 11 mode, không lỗi.");
})().catch(e => { console.error("CRASH:", e); process.exit(1); });
