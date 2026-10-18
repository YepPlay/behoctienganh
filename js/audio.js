// Dùng MỘT AudioContext duy nhất cho cả Sfx lẫn Voice.
// iOS Safari: AudioContext phải được "mở khóa" trong 1 cử chỉ người dùng
// (xem js/main.js — listener pointerdown gọi Sfx.warm()/Voice.warm()).
const AudioCtx = (() => {
  let ctx = null;
  return function () {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return null; }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };
})();

const Sfx = (() => {
  const ac = AudioCtx;

  function tone(freq, t0, dur, type = "sine", vol = 0.22) {
    const c = ac();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + t0;
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  return {
    warm() { ac(); },
    click()   { tone(660, 0, 0.07, "triangle", 0.14); },
    pop()     { tone(880, 0, 0.06, "sine", 0.12); },
    correct() { tone(523, 0, 0.12); tone(659, 0.09, 0.12); tone(784, 0.18, 0.22); },
    cheer()   { [660, 880, 1047, 1319].forEach((f, i) => tone(f, i * 0.055, 0.16, "triangle", 0.16)); },
    wrong()   { tone(196, 0, 0.18, "sawtooth", 0.13); tone(147, 0.12, 0.22, "sawtooth", 0.11); },
    win()     { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25, "triangle", 0.2)); },
  };
})();

/* PHÁT ÂM: CHỈ dùng file mp3 Google tạo sẵn (assets/voice/*.mp3, xem
   tools/gen-voice.js). KHÔNG dùng speechSynthesis — giọng đọc từng máy
   một kiểu, máy thiếu giọng Anh/Việt sẽ đọc SAI hoàn toàn.
   Key file:  lB (tên chữ) · pB (phonics "B for Banana") · w_banana (từ)
              q1 (câu hằng ngày) · cq1/ca1 (hội thoại) · vgioiQua (UI tiếng Việt)
   Cách phát:
     1) Web Audio: tải + giải mã sẵn vào RAM → phát tức thì, không độ trễ.
     2) Nếu Web Audio không tải/giải mã được → phát LẠI ĐÚNG file mp3 bằng <audio>. */
const Voice = (() => {
  const FOLDER = "assets/voice/";
  const KEY = "en.voice";              /* nhớ bật/tắt đọc */
  let on = true;
  try { if (localStorage.getItem(KEY) === "0") on = false; } catch (e) { }

  // src -> Promise<AudioBuffer>: tải + giải mã 1 lần, phát tức thì các lần sau.
  const bufs = new Map();
  let current = null;   // AudioBufferSourceNode hoặc thẻ <audio> đang phát
  let pending = null;   // callback kết thúc lượt phát hiện tại
  let seq = 0;

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  const srcOf = key => FOLDER + key + ".mp3";

  // Tải 1 file có thời hạn — nếu mạng "treo" (không lỗi, không xong) thì hủy
  // bằng AbortController. Không có thời hạn: 1 lần fetch treo = file đó "chết"
  // mãi trong bộ đệm → bé bấm 🔊 bao nhiêu lần cũng im.
  function fetchBuf(src, ms) {
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => { try { if (ctrl) ctrl.abort(); } catch (e) { } }, ms);
    return fetch(src, ctrl ? { signal: ctrl.signal } : undefined)
      .then(res => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      })
      .finally(() => clearTimeout(timer));
  }

  // Tải + giải mã 1 file bằng Web Audio.
  function decodeOnce(src) {
    const c = AudioCtx();
    if (!c) return Promise.reject(new Error("no AudioContext"));
    return fetchBuf(src, 8000)
      .then(data => new Promise((resolve, reject) => {
        const r = c.decodeAudioData(data, resolve, reject); // Safari cũ chỉ có callback
        if (r && typeof r.then === "function") r.then(resolve, reject);
      }));
  }

  function getBuf(src) {
    let p = bufs.get(src);
    if (!p) {
      p = decodeOnce(src);
      p.catch(() => { }); // nuốt unhandled rejection; caller tự xử lý
      bufs.set(src, p);
    }
    return p;
  }

  // Thử lại vài lần (mạng chập chờn) trước khi chịu thua.
  async function getBufRetry(src) {
    let err;
    for (let i = 0; i < 3; i++) {
      try { return await getBuf(src); }
      catch (e) { err = e; bufs.delete(src); await delay(100 * (i + 1)); }
    }
    throw err;
  }

  // Phát bằng Web Audio từ buffer đã giải mã.
  function playBuf(buf, my) {
    return new Promise(resolve => {
      const c = AudioCtx();
      if (!buf || !c || my !== seq) return resolve(false);
      let done = false;
      let node = null;
      let wd = null;      /* hẹn giờ cứu: onended KHÔNG BAO GIỜ fire nếu
                             AudioContext đang suspended (máy khóa màn hình,
                             iOS sau khi app ở nền) — không có watchdog thì
                             lượt đọc treo mãi và các câu sau không bao giờ phát */
      const fin = ok => {
        if (done) return;
        done = true;
        if (wd) { clearTimeout(wd); wd = null; }
        if (pending === fin) pending = null;
        if (current === node) current = null;
        /* watchdog bắn trước khi onended → node có thể vẫn còn "kẹt" trong
           hàng đợi của ctx; dừng hẳn để không phát muộn ghost khi ctx resume */
        if (node) { try { node.onended = null; node.stop(); } catch (e) { } }
        resolve(ok);
      };
      pending = fin;
      wd = setTimeout(() => fin(false), Math.max(2000, (buf.duration || 0) * 1000 + 2000));
      try {
        node = c.createBufferSource();
        node.buffer = buf;
        node.connect(c.destination);
        node.onended = () => fin(true);
        node.start(0);
        current = node;
      } catch (e) { fin(false); }
    });
  }

  // Dự phòng: phát ĐÚNG file mp3 đó bằng thẻ <audio>.
  function playEl(src, my) {
    return new Promise(resolve => {
      if (my !== seq) return resolve(false);
      let el;
      try { el = new Audio(); } catch (e) { return resolve(false); }
      let done = false;
      let wd = null;   /* cứu hộ: nếu neither onended nor onerror bao giờ fire */
      const fin = ok => {
        if (done) return;
        done = true;
        if (wd) { clearTimeout(wd); wd = null; }
        if (pending === fin) pending = null;
        if (current === el) current = null;
        try { el.onended = el.onerror = null; el.pause(); el.removeAttribute("src"); } catch (e) { }
        resolve(ok);
      };
      pending = fin;
      wd = setTimeout(() => fin(false), 12000);
      el.preload = "auto";
      el.onended = () => fin(true);
      el.onerror = () => fin(false);
      current = el;
      try {
        el.src = src;
        const p = el.play();
        if (p && typeof p.catch === "function") p.catch(() => fin(false));
      } catch (e) { fin(false); }
    });
  }

  function playFile(src, my) {
    if (!src) return Promise.resolve(false);
    return getBufRetry(src).then(
      buf => playBuf(buf, my),
      () => { bufs.delete(src); return playEl(src, my); }
    );
  }

  function stopAll() {
    if (current) {
      const c = current;
      current = null;
      try {
        if (typeof c.stop === "function") c.stop();
        else if (typeof c.pause === "function") {
          c.pause();
          c.removeAttribute("src");
          if (typeof c.load === "function") c.load();
        }
      } catch (e) { }
    }
    if (pending) { const f = pending; pending = null; f(false); }
  }

  // Đọc lần lượt các key — trả Promise resolve khi PHÁT XONG.
  async function runKeys(keys) {
    const my = ++seq;
    stopAll();
    for (const k of keys) {
      if (my !== seq) return;
      await playFile(srcOf(k), my);
    }
  }

  function speakNow(keys, force) {
    /* force=true: bé CHỦ ĐỘNG bấm 🔊 muốn nghe → phát kể cả khi đã tắt tiếng
       ở menu (tắt tiếng chỉ để ngắt tiếng tự động, không chặn lúc bé đòi nghe) */
    if (!on && !force) return Promise.resolve(false);
    return runKeys(keys);
  }

  /* ---- API cho game ---- */
  const letterOf = l => "l" + l;
  const phonicOf = l => "p" + l;
  const wordOf = w => "w_" + slugOf(w);
  const viOf = k => "v" + k;

  return {
    /* Tên chữ: "B" -> chỉ nghe "bee" */
    sayLetter(l) { return speakNow([letterOf(l)]); },

    /* Phonics: "bee — B for Banana" (tên chữ + âm ví dụ) */
    sayPhonics(l, force) { return speakNow([letterOf(l), phonicOf(l)], force); },

    /* Tên chữ rồi tới từ ví dụ (khen bé sau câu đúng) */
    sayPair(l, word) {
      const L = LETTER_MAP[l];
      const w = word || (L ? L.words[0].w : null);
      return speakNow(w ? [letterOf(l), wordOf(w)] : [letterOf(l)]);
    },

    /* 1 từ tiếng Anh */
    sayWord(w, force) { return speakNow([wordOf(w)], force); },

    /* Hội thoại cq<i> (câu hỏi) / ca<i> (câu trả lời) */
    sayConvoQ(i) { return speakNow(["cq" + i]); },
    sayConvoA(i) { return speakNow(["ca" + i]); },

    /* Chỉ mục UI tiếng Việt */
    sayVi(key) { return speakNow([viOf(key)]); },

    /* Chuỗi key tự do */
    say(keys, force) { return speakNow(keys, force); },

    warm() { AudioCtx(); },
    stop() { seq++; stopAll(); },

    /* Giải mã nền: key quan trọng trước, chia 3 luồng, mỗi file cách 20ms. */
    preload(keys) {
      const queue = (keys || []).map(srcOf);
      let i = 0;
      const worker = () => {
        if (i >= queue.length) return;
        const src = queue[i++];
        getBuf(src).catch(() => { bufs.delete(src); }).then(() => setTimeout(worker, 20));
      };
      for (let n = 0; n < 3; n++) worker();
    },

    /* Bật / tắt tiếng đọc (nhớ trong localStorage) */
    toggle() {
      on = !on;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { }
      if (!on) this.stop();
      return on;
    },
    isOn() { return on; },
  };
})();
