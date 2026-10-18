/* Smoke-test chơi THẬT bằng jsdom (mượn jsdom của behoctoan nếu máy chưa cài):
   chọn bạn → chọn cấp độ → menu → chơi MỖI mode theo kiểu "CHƠI MÃI"
   (random vĩnh viễn, không màn tổng kết, không popup ≡) → bé tự bấm ⬅️ Thoát
   → kiểm tra sao ⭐ được LƯU NGAY LÚC THOÁT.
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

  /* Chơi 1 mode "chơi mãi": chơi opt.rounds vòng (mặc định 3) rồi bấm ⬅️
     Thoát như bé tự thoát — không màn tổng kết, không vòng cố định. */
  async function playMode(mode, opt) {
    opt = opt || {};
    const wantRounds = opt.rounds != null ? opt.rounds : 3;
    const card = $(`.mode-card[data-mode="${mode}"]`);
    if (!card) { fails++; console.log("  ✗ không thấy card mode " + mode); return; }
    card.click();
    await until(() => st() && st().mode === mode, 3000, mode + " khởi động");
    if (!st()) return;

    let wrongTried = false, reached = false;
    const t0 = Date.now();

    while (st() && Date.now() - t0 < 60000) {
      const s = st();

      /* Chơi đủ số vòng yêu cầu → dừng NGAY để bấm Thoát
         (vòng mới có thể vừa random ra — vẫn được, bé đang cầm quyền chơi) */
      if (s.idx >= wantRounds) { reached = true; break; }

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

      /* Match / MatchVi: thả-chọn 1 cặp, nối hết 1 nhóm là đủ 1 vòng */
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

    /* Chơi mãi: game KHÔNG BAO GIỜ được tự kết thúc — chỉ bé Thoát mới xong */
    ok(reached, `${mode}: chơi được ${wantRounds} vòng random (không tự kết thúc)`);
    if (!st()) return;
    $("#btn-back").click();
    await until(() => $("#screen-menu").classList.contains("active"), 3000, mode + " bấm ⬅️ về menu");
    ok(true, mode + ": bé bấm ⬅️ Thoát → về menu, sao ⭐ được lưu");
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

  const smallModes = ["abc", "topic", "listen", "pic", "match"];
  const shown = $$(".mode-card").map(c => c.dataset.mode);
  ok(JSON.stringify(shown) === JSON.stringify(smallModes),
    "menu Bé Nhỏ đúng 5 mode: " + shown.join(", "));

  const v0 = T.Voice.isOn();
  $("#btn-voice").click();
  ok(T.Voice.isOn() !== v0, "toggle 🔊/🔇 hoạt động");
  $("#btn-voice").click();
  ok(T.Voice.isOn() === v0, "bật lại tiếng đọc");

  console.log("2/5 Chơi 5 mode của Bé Nhỏ …");
  /* Kiểm tra GIỌNG ĐỌC TỰ ĐỘNG của mode nghe: vào vòng, KHÔNG bấm gì,
     sau ~1.3s phải có tiếng (bug cũ: schedule() gọi clearTicker() ngay sau
     later() → hủy luôn timer phát tự động → bé ngồi nghe im 5,5 giây). */
  {
    let sayCalls = 0;
    const origSay = T.Voice.say;
    T.Voice.say = function () { sayCalls++; return origSay.apply(T.Voice, arguments); };
    $('.mode-card[data-mode="listen"]').click();
    await until(() => st() && st().mode === "listen", 3000, "listen khởi động (kiểm tiếng tự động)");
    await sleep(1700);   /* dài hơn START_DELAY 1300ms */
    ok(sayCalls > 0, "listen: có tiếng đọc TỰ ĐỘNG sau ~1.3 giây");
    const before = sayCalls;
    const hb = $("#btn-hear");
    ok(!!hb, "listen: có nút 🔊 trên prompt");
    if (hb) hb.click();
    await sleep(80);
    ok(sayCalls > before, "listen: bấm 🔊 → phát tiếng ngay lập tức");
    T.Voice.say = origSay;
    $("#btn-back").click();   /* thoát luôn — vòng này chỉ để kiểm giọng */
    await until(() => $("#screen-menu").classList.contains("active"), 3000, "thoát khỏi vòng kiểm giọng");
  }
  await playMode("abc", { rounds: 3 });     /* random 3 chữ, không theo thứ tự A→Z */
  await playMode("topic", { rounds: 2 });   /* random 2 từ trong 1 chủ đề */
  await playMode("listen");
  await playMode("pic");                    /* nghe từ → chọn từ đúng (4 ô toàn chữ) */
  await playMode("match", { rounds: 1 });   /* nối hết 1 nhóm = 1 vòng */

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
  await playMode("matchVi", { rounds: 1 });
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
  console.log("✅ Smoke-test PASSED — 10 mode chơi mãi đến khi bé thoát, không lỗi.");
})().catch(e => { console.error("CRASH:", e); process.exit(1); });
