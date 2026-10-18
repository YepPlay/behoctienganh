/* ============================================================
   Bé Học Tiếng Anh — Game engine
   · Bé Nhỏ (3–6):  abc · topic · listen · pic · match
   · Bé Lớn (6–9):  spell · listenTxt · matchVi · fill · convo
   Quiz dùng chung 1 engine: QUESTIONS[mode]() trả về câu hỏi
   { speak, prompt, options, answer } rồi renderQuiz() điều phối.
   Các mode riêng (abc, topic, match, spell) render tự như behocchu.
   CHƠI MÃI: mọi chế độ random vĩnh viễn — không vòng cố định,
   không thanh tiến trình; bé tự bấm ⬅️ Thoát, sao lưu lúc thoát.
   ============================================================ */
const Game = (() => {
  const PAIR_COLORS = ["#ef4444", "#2563eb", "#16a34a", "#d97706", "#9333ea"];

  let state = null;
  let abort = null;
  let ticker = null;    /* timer lặp lại / phát tự động đang chờ */
  let startT = null;    /* timer PHÁT TỰ ĐỘNG đầu tiên của vòng hiện tại */
  let advT = null;      /* timer chuyển vòng — hủy được nếu bé bấm Về Menu */

  function clearTicker() {
    if (ticker) { clearTimeout(ticker); ticker = null; }
    if (startT) { clearTimeout(startT); startT = null; }
    if (advT) { clearTimeout(advT); advT = null; }
  }
  /* Đặt lời hẹn nói NÓ LẪN TIMER — clearTicker/next/cancel hủy được hết,
     tránh tiếng đọc của vòng cũ vọng sang vòng mới hay màn menu */
  function later(fn, ms) {
    startT = setTimeout(() => { startT = null; fn(); }, ms);
    return startT;
  }

  const area = () => document.getElementById("play-area");
  const rnd = n => Math.floor(Math.random() * n);
  const rndPick = a => a[rnd(a.length)];
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Âm đọc trùng tiếng: C/K/Q (đều "ka"), G/J mờ — làm nhiễu đáp án thông minh */
  const SOUND_NEAR = { C: ["K"], K: ["C"], G: ["J"], J: ["G"], U: ["V"], V: ["U"], Y: ["I"], I: ["Y"] };

  function buildLetterOptions(correct, n = 4) {
    const near = shuffle(SOUND_NEAR[correct] || []).filter(l => l !== correct);
    const rest = shuffle(LETTERS.filter(l => l !== correct && near.indexOf(l) < 0));
    return shuffle([correct, ...near, ...rest].slice(0, n));
  }

  /* Chọn từ cho một chữ cái: tránh emoji trùng, tránh chữ cái khác trong lựa chọn */
  function pickWordFor(letter, usedEmoji) {
    const list = LETTER_MAP[letter].words;
    let tries = 0;
    let w = rndPick(list);
    while (usedEmoji && usedEmoji.has(w.e) && tries++ < 8) w = rndPick(list);
    if (usedEmoji) {
      /* 8 lần bốc vẫn trùng → chọn bừa 1 từ chưa dùng (nếu có),
         không bao giờ để 2 ô cùng emoji khi pool còn từ khác. */
      if (usedEmoji.has(w.e)) {
        const alt = list.find(x => !usedEmoji.has(x.e));
        if (alt) w = alt;
      }
      usedEmoji.add(w.e);
    }
    return w;
  }

  function pickWords(letters, avoidDupEmoji) {
    const used = new Set();
    const map = {};
    letters.forEach(l => { map[l] = pickWordFor(l, avoidDupEmoji ? used : null); });
    return map;
  }

  /* Chọn N từ ngẫu nhiên khác nhau (dùng cho quiz từ vựng).
     Không được trùng TỪ và không được trùng EMOJI — nếu không bé thấy
     2 ô y hệt nhau, hoặc 2 ô khác chữ nhưng cùng hình. */
  function pickWordOptions(correct, n = 4, pool) {
    const list = pool || ALL_WORDS;
    const wrong = shuffle(list.filter(w => w.w !== correct.w && w.e !== correct.e));
    const usedE = new Set([correct.e]);
    const picked = [];
    for (const w of wrong) {
      if (picked.length >= n - 1) break;
      if (usedE.has(w.e)) continue;
      usedE.add(w.e);
      picked.push(w);
    }
    /* Pool quá nhỏ (chủ đề 10 từ) → vẫn phải đủ 4 ô: bù từ thiếu emoji
       bất kỳ, chỉ tránh trùng chữ là được. */
    if (picked.length < n - 1) {
      for (const w of shuffle(wrong)) {
        if (picked.length >= n - 1) break;
        if (picked.indexOf(w) < 0) picked.push(w);
      }
    }
    return shuffle([correct, ...picked]);
  }

  /* ---------- Túi ngẫu nhiên (chơi mãi) ----------
     Rút lần lượt từ danh sách đã xáo, hết túi thì xáo lại — random vĩnh viễn
     nhưng KHÔNG lặp liền kề và mọi chữ/từ đều được xuất hiện. */
  function bagRefill(list) {
    const bag = shuffle(list);
    if (state.bagLast && bag.length > 1 && bag[bag.length - 1] === state.bagLast) {
      const j = rnd(bag.length - 1);
      [bag[j], bag[bag.length - 1]] = [bag[bag.length - 1], bag[j]];
    }
    state.bag = bag;
    state.bagPool = list;
  }
  function bagNext(list) {
    if (!state.bag || state.bagPool !== list || !state.bag.length) bagRefill(list);
    const item = state.bag.pop();
    state.bagLast = item;
    return item;
  }

  /* Pool Điền Chữ Thiếu — tính 1 lần (túi cần mảng giữ nguyên tham chiếu) */
  const FILL_POOL = ALL_WORDS.filter(w => {
    const up = w.w.toUpperCase();
    return up.length >= 3 && up.length <= 8 && /^[A-Za-z ']+$/.test(w.w);
  });

  /* ---------- Vòng chơi ---------- */

  function cleanup() {
    clearTicker();
    if (abort) { abort.abort(); abort = null; }
    Voice.stop();
  }

  function cancel() { cleanup(); state = null; }

  function next() {
    if (!state) return;
    clearTicker();
    /* Mỗi vòng rút 1 mục NGẪU NHIÊN từ túi — random vĩnh viễn cho tới
       khi bé tự bấm ⬅️ Thoát (không vòng cố định, không thanh tiến trình) */
    if (state.mode === "abc") state.letter = bagNext(LETTERS);
    else if (state.mode === "topic" && state.topic) state.word = bagNext(TOPICS[state.topic].words);
    else if (state.mode === "spell") state.word = bagNext(state.spellPool);
    UI.updateStars(state.stars);
    const render = {
      abc: renderAbc, topic: renderTopic, listen: renderListen, pic: renderPic,
      match: renderMatch, spell: renderSpell,
      listenTxt: renderListenTxt, matchVi: renderMatchVi, fill: renderFill, convo: renderConvo,
    };
    render[state.mode]();
  }

  function awardStar(firstTry) {
    if (!firstTry) { state.streak = 0; return; }
    state.streak++;
    state.stars++;
    if (state.streak % 3 === 0) {
      state.stars++;
      UI.praise("🔥");
      UI.confetti(16);
      Sfx.cheer();
    }
  }

  /* expect: state tại thời điểm lên lịch — nếu bé đã Thoát / chuyển chế độ
     (state bị thay thế) thì bỏ qua, không cộng nhầm vòng cho chế độ mới. */
  function advance(delay, expect) {
    const s = state;
    if (!s || (expect && s !== expect)) return;
    s.idx++;
    UI.updateStars(s.stars);
    advT = setTimeout(() => { advT = null; if (state === s) next(); }, delay || 900);
  }

  /* ============================================================
     ENGINE QUIZ CHUNG — listen · pic · listenTxt · fill · convo
     Câu hỏi: { speak:[keys], repeat:bool, prompt:html, options:[{html,data,keys}], answer:i }
     ============================================================ */

  const QUESTIONS = {
    /* Nghe & chọn hình (Bé Nhỏ) */
    listen() {
      const correct = bagNext(ALL_WORDS);
      const opts = pickWordOptions(correct);
      return {
        speak: ["w_" + slugOf(correct.w)],
        repeat: true,
        prompt: `<button class="listen-btn" id="btn-hear">🔊</button>
                 <p class="q-ask">Nghe và chọn hình đúng</p>`,
        options: opts.map(w => ({
          html: `<span class="opt-emoji">${w.e}</span><span class="opt-word">${w.w}</span>`,
          keys: ["w_" + slugOf(w.w)],
        })),
        answer: opts.indexOf(correct),
      };
    },

    /* Nghe từ & chọn đúng từ (Bé Nhỏ) — thay cho "Chọn Hình Theo Chữ" cũ:
       đáp án toàn icon dễ ngộ nhận (emoji không diễn tả đúng từ),
       giờ nghe "Apple" và chọn chữ "Apple" trong 4 ô toàn chữ. */
    pic() {
      const correct = bagNext(ALL_WORDS);
      const opts = pickWordOptions(correct);
      return {
        speak: ["w_" + slugOf(correct.w)],
        repeat: true,
        prompt: `<button class="listen-btn" id="btn-hear">🔊</button>
                 <p class="q-ask">Nghe và chọn từ đúng</p>`,
        options: opts.map(w => ({
          html: `<span class="opt-text">${w.w}</span>`,
          keys: ["w_" + slugOf(w.w)],
        })),
        answer: opts.indexOf(correct),
      };
    },

    /* Nghe & chọn từ có chữ (Bé Lớn) */
    listenTxt() {
      const correct = bagNext(ALL_WORDS);
      const opts = pickWordOptions(correct);
      return {
        speak: ["w_" + slugOf(correct.w)],
        repeat: true,
        prompt: `<button class="listen-btn" id="btn-hear">🔊</button>
                 <p class="q-ask">Nghe và chọn từ đúng</p>`,
        options: opts.map(w => ({
          html: `<span class="opt-text">${w.w}</span>`,
          keys: ["w_" + slugOf(w.w)],
        })),
        answer: opts.indexOf(correct),
      };
    },

    /* Điền chữ cái còn thiếu (Bé Lớn) */
    fill() {
      const word = bagNext(FILL_POOL);
      const up = word.w.toUpperCase();
      /* Chỉ bỏ 1 chữ cái xuất hiện đúng 1 lần, không bỏ chữ đầu */
      const poss = [];
      for (let i = 1; i < up.length; i++) {
        if (up[i] >= "A" && up[i] <= "Z" && up.indexOf(up[i]) === i) poss.push(i);
      }
      if (!poss.length) return QUESTIONS.fill();
      const bi = rndPick(poss);
      const blank = up.slice(0, bi) + "—" + up.slice(bi + 1);
      const shown = blank.split("").join(" ");
      const letters = shuffle(LETTERS.filter(l => l !== up[bi])).slice(0, 3);
      const opts = shuffle([up[bi], ...letters]);
      return {
        speak: ["w_" + slugOf(word.w)],
        prompt: `<div class="q-box fill-word">${shown}</div>
                 <p class="q-ask">Chọn chữ cái còn thiếu</p>
                 <button class="listen-btn sm" id="btn-hear">🔊</button>`,
        options: opts.map(l => ({
          html: `<span class="big-letter sm">${l}</span>`,
          keys: ["w_" + slugOf(word.w)],
        })),
        answer: opts.indexOf(up[bi]),
        vi: word.vi,
      };
    },

    /* Hội thoại: nghe câu hỏi, chọn câu trả lời (Bé Lớn) */
    convo() {
      const c = bagNext(CONVO);
      const i = CONVO.indexOf(c) + 1;
      const opts = shuffle([c.a, ...c.wrong]);
      return {
        speak: ["cq" + i],
        repeat: true,
        prompt: `<button class="listen-btn" id="btn-hear">🔊</button>
                 <p class="q-ask">Nghe và chọn câu trả lời đúng</p>`,
        options: opts.map(t => ({
          html: `<span class="opt-text">${t}</span>`,
          keys: t === c.a ? ["ca" + i] : [],
        })),
        answer: opts.indexOf(c.a),
      };
    },
  };

  /* Render quiz chung */
  function renderQuiz(mode) {
    const st = state;          /* state của vòng này — hẹn giờ phải check đúng nó */
    const q = QUESTIONS[mode]();
    st.q = q;
    st.locked = false;   /* mở khóa vòng mới (vòng trước đã khóa khi trả lời đúng) */

    area().innerHTML = `
      <div class="q-center">${q.prompt}</div>
      <div class="opt-grid">
        ${q.options.map((o, i) => `
          <button class="opt-btn" data-i="${i}">${o.html}</button>`).join("")}
      </div>`;

    const hear = force => { Sfx.pop(); Voice.say(q.speak, force); };
    const hearBtn = area().querySelector("#btn-hear");
    /* Bấm 🔊 trước giờ phát tự động → hủy hẹn giờ, không đọc đè 2 lần.
       Bấm 🔊 = bé ĐÒI nghe → phát kể cả khi tắt tiếng ở menu. */
    if (hearBtn) hearBtn.onclick = () => { if (!st.locked) { clearTicker(); hear(true); schedule(); } };

    /* Tự phát + lặp lại cho mode nghe (Bé Nhỏ chưa thao tác được nhiều) */
    const START_DELAY = 1300, REPEAT_MS = 5500, READS_MAX = 5;
    let reads = 0;
    /* schedule chỉ lo TIMER LẶP LẠI — không được đụng startT (timer phát tự
       động đặt bằng later): trước đây nó gọi clearTicker() ngay sau later()
       → hủy luôn giờ phát tự động → vòng nghe nào cũng IM 1,3 giây đầu rồi
       mới đọc ở mốc lặp 5,5 giây (mode không lặp thì im luôn). */
    const schedule = () => {
      if (ticker) { clearTimeout(ticker); ticker = null; }
      if (!q.repeat || st.locked) return;
      ticker = setTimeout(tick, REPEAT_MS);
    };
    function tick() {
      if (state !== st || st.locked) return;
      reads++;
      if (reads <= READS_MAX) { hear(); schedule(); }
      else { Voice.sayVi("conBay"); schedule(); }
    }
    later(hear, START_DELAY);
    schedule();
    let first = true;
    area().querySelectorAll(".opt-btn").forEach(btn => {
      btn.onclick = () => {
        if (st.locked || state !== st) return;
        const i = parseInt(btn.dataset.i, 10);
        if (i === q.answer) {
          st.locked = true;
          clearTicker();
          awardStar(first);
          st.correct++;
          Sfx.correct();
          btn.classList.add("good");
          UI.celebrate(btn);
          Voice.say(q.options[i].keys.length ? q.options[i].keys : q.speak)
            .then(() => advance(400, st));
        } else {
          first = false;
          st.streak = 0;
          Sfx.wrong();
          Voice.sayVi("thuLai");
          btn.classList.add("bad");
          btn.disabled = true;
        }
      };
    });
  }

  const renderListen = () => renderQuiz("listen");
  const renderPic = () => renderQuiz("pic");
  const renderListenTxt = () => renderQuiz("listenTxt");
  const renderFill = () => renderQuiz("fill");
  const renderConvo = () => renderQuiz("convo");

  /* ============================================================
     ABC — Học Phonics A–Z (Bé Nhỏ): học chữ + âm + từ ví dụ, rồi quiz
     Chữ mỗi vòng rút NGẪU NHIÊN từ túi (random vĩnh viễn, không A→Z).
     ============================================================ */
  function renderAbc() {
    clearTicker();   /* chuyển học → quiz trực tiếp (không qua next) */
    const st = state;
    const letter = st.letter;
    const L = LETTER_MAP[letter];
    const phase = st.phase || "study";

    if (phase === "study") {
      const words = shuffle(L.words);
      area().innerHTML = `
        <div class="q-center">
          <button class="learn-card" id="learn-card">
            <span class="big-letter">${letter}</span>
            <span class="learn-sound">${L.sound}</span>
          </button>
          <p class="learn-hint">Ấn vào chữ để nghe âm và từ ví dụ nhé!</p>
        </div>
        <div class="word-chips">
          ${words.map(w => `
            <button class="word-chip" data-w="${w.w}">
              <span class="opt-emoji">${w.e}</span><b>${w.w}</b>
            </button>`).join("")}
        </div>
        <div class="learn-btns">
          <button class="btn big" id="btn-learn-next">Tiếp ➡️</button>
        </div>`;

      const card = area().querySelector("#learn-card");
      const playCard = force => {
        clearTicker();   /* bấm thẻ trước giờ phát tự động → không đọc 2 lần */
        Sfx.pop();
        Voice.sayPhonics(letter, force);
        card.classList.remove("playing");
        void card.offsetWidth;
        card.classList.add("playing");
      };
      card.onclick = () => { if (state === st) playCard(true); };  /* bấm thẻ = muốn nghe */
      later(playCard, 400);

      area().querySelectorAll(".word-chip").forEach(chip => {
        chip.onclick = () => { Sfx.pop(); Voice.sayWord(chip.dataset.w, true); };
      });
      area().querySelector("#btn-learn-next").onclick = () => {
        if (state !== st) return;
        Sfx.click();
        st.phase = "quiz";
        renderAbc();
      };
      return;
    }

    /* Quiz: nghe âm → chọn chữ cái */
    const opts = buildLetterOptions(letter);
    area().innerHTML = `
      <div class="q-center">
        <button class="listen-btn sm" id="btn-hear">🔊</button>
        <p class="q-ask">Chọn chữ cái vừa nghe</p>
      </div>
      <div class="opt-grid">
        ${opts.map(o => `
          <button class="opt-btn letter-opt" data-l="${o}">
            <span class="big-letter sm">${o}</span>
          </button>`).join("")}
      </div>`;

    let first = true, locked = false;
    const hear = force => { Sfx.pop(); Voice.sayPhonics(letter, force); };
    area().querySelector("#btn-hear").onclick = () => {
      if (locked) return;
      clearTicker();   /* hủy giờ phát tự động nếu bấm sớm */
      hear(true);      /* bé chủ động bấm 🔊 → phát kể cả khi tắt tiếng ở menu */
    };
    later(hear, 350);

    area().querySelectorAll(".opt-btn").forEach(btn => {
      btn.onclick = () => {
        if (locked || state !== st) return;
        if (btn.dataset.l === letter) {
          locked = true;
          awardStar(first);
          st.correct++;
          Sfx.correct();
          btn.classList.add("good");
          UI.celebrate(btn);
          Voice.sayPair(letter);
          st.phase = "study";
          advance(1400, st);
        } else {
          first = false;
          st.streak = 0;
          Sfx.wrong();
          btn.classList.add("bad");
          btn.disabled = true;
        }
      };
    });
  }

  /* ============================================================
     TOPIC — Học từ vựng theo chủ đề (Bé Nhỏ):
     1) Chọn chủ đề  2) Học card từ  3) Quiz nghe → chọn hình
     ============================================================ */
  function renderTopic() {
    clearTicker();   /* chuyển học → quiz / đổi chủ đề trực tiếp */
    const st = state;
    if (!st.topic) { renderTopicPick(); return; }

    /* Từ mỗi vòng rút NGẪU NHIÊN từ túi theo chủ đề bé đã chọn */
    const word = st.word;

    if (st.phase === "study") {
      area().innerHTML = `
        <div class="q-center">
          <button class="learn-card word-card" id="word-card">
            <span class="big-emoji">${word.e}</span>
            <span class="word-en">${word.w}</span>
            <span class="word-vi">${word.vi}</span>
          </button>
          <p class="learn-hint">Ấn vào thẻ để nghe từ nhé!</p>
        </div>
        <div class="learn-btns">
          <button class="btn big" id="btn-learn-next">Tiếp ➡️</button>
        </div>`;

      const card = area().querySelector("#word-card");
      const playCard = force => {
        clearTicker();   /* bấm thẻ trước giờ phát tự động → không đọc 2 lần */
        Sfx.pop();
        Voice.sayWord(word.w, force);
        card.classList.remove("playing");
        void card.offsetWidth;
        card.classList.add("playing");
      };
      card.onclick = () => { if (state === st) playCard(true); };  /* bấm thẻ = muốn nghe */
      later(playCard, 400);

      area().querySelector("#btn-learn-next").onclick = () => {
        if (state !== st) return;
        Sfx.click();
        st.phase = "quiz";
        renderTopic();
      };
      return;
    }

    /* Quiz: nghe từ → chọn hình */
    const opts = pickWordOptions(word, 4, TOPICS[st.topic].words);
    area().innerHTML = `
      <div class="q-center">
        <button class="listen-btn sm" id="btn-hear">🔊</button>
        <p class="q-ask">Nghe và chọn hình đúng</p>
      </div>
      <div class="opt-grid">
        ${opts.map((w, i) => `
          <button class="opt-btn" data-i="${i}">
            <span class="opt-emoji">${w.e}</span>
            <span class="opt-word">${w.w}</span>
          </button>`).join("")}
      </div>`;

    let first = true, locked = false;
    const hear = force => { Sfx.pop(); Voice.sayWord(word.w, force); };
    area().querySelector("#btn-hear").onclick = () => {
      if (locked) return;
      clearTicker();   /* hủy giờ phát tự động nếu bấm sớm */
      hear(true);      /* bé chủ động bấm 🔊 → phát kể cả khi tắt tiếng ở menu */
    };
    later(hear, 350);

    area().querySelectorAll(".opt-btn").forEach(btn => {
      btn.onclick = () => {
        if (locked || state !== st) return;
        if (opts[parseInt(btn.dataset.i, 10)] === word) {
          locked = true;
          awardStar(first);
          st.correct++;
          Sfx.correct();
          btn.classList.add("good");
          UI.celebrate(btn);
          Voice.sayWord(word.w);
          st.phase = "study";
          advance(1200, st);
        } else {
          first = false;
          st.streak = 0;
          Sfx.wrong();
          btn.classList.add("bad");
          btn.disabled = true;
        }
      };
    });
  }

  function renderTopicPick() {
    area().innerHTML = `
      <p class="q-ask center">Bé chọn chủ đề muốn học</p>
      <div class="topic-grid">
        ${TOPIC_KEYS.map(k => `
          <button class="topic-card" data-t="${k}">
            <span class="topic-icon">${TOPICS[k].icon}</span>
            <span class="topic-name">${TOPICS[k].name}</span>
          </button>`).join("")}
      </div>`;
    area().querySelectorAll(".topic-card").forEach(btn => {
      btn.onclick = () => {
        Sfx.click();
        state.topic = btn.dataset.t;
        state.phase = "study";
        next();   /* vòng đầu rút từ ngẫu nhiên trong chủ đề bé chọn */
      };
    });
  }

  /* ============================================================
     MATCH — Nối từ với hình (Bé Nhỏ): cột TRÁI chỉ HÌNH, cột PHẢI chỉ CHỮ —
     bấm hình nghe tiếng đọc rồi nối sang ô chữ.
     MATCHVI — Nối từ Anh với nghĩa Việt (Bé Lớn): 2 cột đều là chữ.
     ============================================================ */
  function renderMatch() {
    const st = state;   /* state của vòng này — hẹn giờ/click phải check đúng nó */
    const vi = st.mode === "matchVi";
    const size = 4;

    /* Nhóm từ: theo chữ cái đầu (match) hoặc ngẫu nhiên (matchVi) */
    let picks;
    if (vi) {
      let key = "";
      for (let t = 0; t < 4; t++) {
        picks = shuffle(ALL_WORDS).slice(0, size);
        key = picks.map(w => w.w).sort().join(",");
        if (key !== st.lastGroup) break;
      }
      st.lastGroup = key;
    } else {
      let key = "";
      for (let t = 0; t < 4; t++) {
        const letters = shuffle(LETTERS).slice(0, size);
        const wmap = pickWords(letters, true);
        picks = letters.map(l => wmap[l]);
        key = picks.map(w => w.w).sort().join(",");
        if (key !== st.lastGroup) break;
      }
      st.lastGroup = key;
    }

    const lefts = shuffle(picks);
    const rights = shuffle(picks);
    const done = new Set();
    let selected = null, moved = false;

    area().innerHTML = `
      <p class="q-ask center">${vi ? "Nối từ Anh với nghĩa Việt" : "Nối từ với hình"}</p>
      <div class="match-board" id="mboard">
        <div class="match-col" id="col-left">
          ${lefts.map(w => `
            <div class="m-pic" data-w="${w.w}">
              ${vi ? `<span class="m-word en">${w.w}</span>` : `<span class="m-emoji">${w.e}</span>`}
            </div>`).join("")}
        </div>
        <svg class="match-lines" id="mlines"></svg>
        <div class="match-col" id="col-right">
          ${rights.map(w => `
            <div class="m-letter" data-w="${w.w}">
              ${vi ? `<span class="m-word vi">${w.vi}</span>` : `<span class="m-word">${w.w}</span>`}
            </div>`).join("")}
        </div>
      </div>`;

    const board = area().querySelector("#mboard");
    abort = new AbortController();
    const A = { signal: abort.signal };
    const byW = Object.fromEntries(picks.map(w => [w.w, w]));

    function clearSel() {
      if (selected) selected.classList.remove("sel");
      selected = null;
    }

    function drawLine(pic, lc, color) {
      const svg = area().querySelector("#mlines");
      const br = board.getBoundingClientRect();
      const k = board.offsetWidth ? br.width / board.offsetWidth : 1;
      const ra = pic.getBoundingClientRect();
      const rb = lc.getBoundingClientRect();
      const X = v => (v - br.left) / k;
      const Y = v => (v - br.top) / k;
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ln.setAttribute("x1", X(ra.right));
      ln.setAttribute("y1", Y(ra.top + ra.height / 2));
      ln.setAttribute("x2", X(rb.left));
      ln.setAttribute("y2", Y(rb.top + rb.height / 2));
      ln.setAttribute("stroke", color);
      ln.setAttribute("stroke-width", "6");
      ln.setAttribute("stroke-linecap", "round");
      ln.setAttribute("class", "match-line");
      svg.appendChild(ln);
    }

    function tryMatch(pic, lc) {
      const a = pic.dataset.w, b = lc.dataset.w;
      if (done.has(a)) return;
      if (a === b) {
        done.add(a);
        const color = PAIR_COLORS[done.size - 1];
        pic.classList.add("matched");
        lc.classList.add("matched");
        pic.style.setProperty("--pair", color);
        lc.style.setProperty("--pair", color);
        drawLine(pic, lc, color);
        st.correct++;
        if (pic.dataset.retried !== "1") st.stars++;
        Sfx.correct();
        Voice.sayWord(a, true);   /* vừa nối đúng → nghe lại từ (bé muốn nghe) */
        clearSel();
        UI.celebrate(pic, { praise: false, big: false });
        UI.updateStars(st.stars);
        if (done.size === picks.length) {
          st.idx++;
          Sfx.win();
          UI.praise("🎉");
          UI.confetti(30);
          ticker = setTimeout(() => { ticker = null; if (state === st) next(); }, 1600);
        }
      } else {
        pic.dataset.retried = "1";
        Sfx.wrong();
        lc.classList.add("shake");
        pic.classList.add("shake");
        setTimeout(() => { lc.classList.remove("shake"); pic.classList.remove("shake"); }, 480);
        if (selected === pic) clearSel();
      }
    }

    area().querySelectorAll(".m-pic").forEach(pic => {
      pic.addEventListener("pointerdown", e => {
        if (done.has(pic.dataset.w)) return;
        e.preventDefault();
        Sfx.pop();
        Voice.sayWord(pic.dataset.w, true);   /* bấm hình = muốn nghe từ */
        moved = false;
        pic.classList.add("lift");
        const ghost = document.createElement("div");
        ghost.className = "ghost";
        const em = byW[pic.dataset.w].e;
        ghost.textContent = vi ? byW[pic.dataset.w].w : em;
        if (vi) ghost.classList.add("ghost-text");
        document.body.appendChild(ghost);
        ghost.style.left = e.clientX + "px";
        ghost.style.top = e.clientY + "px";

        const move = ev => {
          moved = true;
          ghost.style.left = ev.clientX + "px";
          ghost.style.top = ev.clientY + "px";
        };
        const up = ev => {
          window.removeEventListener("pointermove", move);
          ghost.remove();
          pic.classList.remove("lift");
          const el = document.elementFromPoint(ev.clientX, ev.clientY);
          const lc = el && el.closest ? el.closest(".m-letter") : null;
          if (lc) tryMatch(pic, lc);
          else if (!moved) {
            if (selected === pic) clearSel();
            else { clearSel(); selected = pic; pic.classList.add("sel"); }
          }
          moved = false;
        };
        window.addEventListener("pointermove", move, A);
        window.addEventListener("pointerup", up, { signal: abort.signal });
      }, A);
    });

    area().querySelectorAll(".m-letter").forEach(lc => {
      lc.addEventListener("click", () => {
        if (selected) tryMatch(selected, lc);
      }, A);
    });
  }

  function renderMatchVi() { renderMatch(); }

  /* ============================================================
     SPELL — Ghép chữ thành từ (Bé Lớn): bấm chữ đúng thứ tự
     ============================================================ */
  function renderSpell() {
    const st = state;
    const word = st.word;   /* từ rút NGẪU NHIÊN từ túi ở next() */
    const up = word.w.toUpperCase();

    /* Chip chữ cái theo thứ tự — chữ trùng vẫn là chip riêng */
    const chips = shuffle(up.split("").map((ch, i) => ({ ch, i })));
    const filled = [];
    let first = true, locked = false;

    function paint() {
      const slots = up.split("").map((ch, i) => {
        const f = filled[i] != null ? filled[i].ch : "—";
        const ok = filled[i] != null ? " filled" : "";
        return `<span class="spell-slot${ok}">${f}</span>`;
      }).join("");

      area().innerHTML = `
        <div class="q-center">
          <div class="spell-emoji">${word.e}</div>
          <div class="spell-word">${slots}</div>
          <p class="q-ask">Bấm chữ cái để ghép thành từ: <b>${word.vi}</b></p>
        </div>
        <div class="spell-chips">
          ${chips.map(c => {
            const used = filled.some(f => f && f.i === c.i);
            return `<button class="spell-chip${used ? " used" : ""}" data-i="${c.i}" ${used ? "disabled" : ""}>${c.ch}</button>`;
          }).join("")}
        </div>`;

      area().querySelectorAll(".spell-chip:not(.used)").forEach(btn => {
        btn.onclick = () => {
          if (locked || state !== st) return;
          clearTicker();   /* bấm chip trước giờ phát tự động → không đọc 2 lần */
          /* chips đã xáo — tra theo chỉ số GỐC (data-i), không tra vị trí trong mảng */
          const ci = parseInt(btn.dataset.i, 10);
          const c = chips.find(x => x.i === ci);
          if (!c) return;
          /* Tìm ô trống kế tiếp */
          let slot = -1;
          for (let i = 0; i < up.length; i++) { if (filled[i] == null) { slot = i; break; } }
          if (slot < 0) return;

          if (c.ch === up[slot]) {
            filled[slot] = { ch: c.ch, i: ci };
            Sfx.pop();
            if (filled.every(f => f != null)) {
              /* Đủ từ → đúng! Vẽ nốt chữ cuối rồi mới tung hô
                 (nếu không ô cuối vẫn hiện "—") */
              locked = true;
              paint();
              awardStar(first);
              st.correct++;
              Sfx.correct();
              UI.celebrate(area().querySelector(".spell-word"));
              Voice.sayWord(word.w).then(() => {
                if (state === st) {
                  st.idx++;
                  UI.updateStars(st.stars);
                  next();
                }
              });
            } else {
              paint();
              Voice.say([ "w_" + slugOf(word.w) ], true);   /* bấm chip = muốn nghe */
            }
          } else {
            first = false;
            st.streak = 0;
            Sfx.wrong();
            btn.classList.add("bad");
            setTimeout(() => btn.classList.remove("bad"), 500);
          }
        };
      });
    }

    paint();
    later(() => Voice.sayWord(word.w), 500);
  }

  /* ---------- API ---------- */

  return {
    /* Chơi mãi: không truyền cb/kết thúc — chỉ dừng khi bé bấm ⬅️ Thoát
       (main.js lưu snapshot sao trước khi cancel). */
    start(mode, level) {
      cleanup();
      state = {
        mode, level: level || "small", idx: 0, stars: 0, streak: 0, correct: 0,
        phase: "study", letter: null, word: null,
        bag: null, bagLast: null, bagPool: null,   /* túi ngẫu nhiên */
        spellPool: mode === "spell" ? shuffle(ALL_WORDS.filter(w =>
          w.w.length >= 3 && w.w.length <= 7 && /^[a-z]+$/i.test(w.w))) : null,
      };
      Voice.preload(LETTERS.map(l => "l" + l).concat(LETTERS.map(l => "p" + l)));
      UI.updateStars(0);
      next();
    },
    cancel,
    /* Sao sao hiện tại để main.js lưu khi bé thoát (quy tắc cũ) */
    snapshot: () => (state ? { mode: state.mode, stars: state.stars, endless: true } : null),
    /* Dành cho tools/smoke-test.js — không dùng khi chơi thật */
    _state: () => state,
  };
})();
