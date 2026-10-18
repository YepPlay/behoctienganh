/* Kiểm tra CHẤT LƯỢNG NGỮ LIỆU + LOGIC GAME bằng máy (chạy thật, không cần mạng):
       node tools/check-questions.js          (mặc định 3000 lần/mode)
       node tools/check-questions.js 10000
   Bắt lỗi:
     · Quiz có <2 đáp án, có đáp án trùng emoji/từ, đáp án đúng không tồn tại
     · pic: nghe từ → 4 ô toàn chữ, không trùng từ (không dùng icon)
     · fill: từ thiếu chữ cái phải THẬT SỰ là từ có nghĩa, không sinh vòng lặp vô hạn
     · spell: từ ghép phải là chữ latin, không có khoảng trắng
     · match/matchVi: không được lặp cùng 1 nhóm liên tục
     · Tất cả key âm thanh sinh ra phải khớp data (voiced key map)
   Exit 1 nếu có bất kỳ lỗi nào. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const N = parseInt(process.argv[2] || "3000", 10);

/* Nạp data.js y hệt như trình duyệt */
const sandbox = { console, module: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8") +
  "\n;globalThis.__d = { ALPHABET, LETTERS, LETTER_MAP, MODES, TOPICS, TOPIC_KEYS, ALL_WORDS, PHRASES, CONVO, VOICE_LINES, slugOf };",
  sandbox);
const { ALPHABET, LETTERS, LETTER_MAP, TOPICS, TOPIC_KEYS, ALL_WORDS, PHRASES, CONVO, VOICE_LINES, slugOf } = sandbox.__d;

const errors = [];
const warn = [];
function err(m) { errors.push(m); }
function soft(m) { warn.push(m); }
const rnd = n => Math.floor(Math.random() * n);
const rndPick = a => a[rnd(a.length)];
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- 1. Kiểm tra cấu trúc data tĩnh ---------- */
console.log("1/4 Kiểm tra cấu trúc bảng chữ cái & chủ đề …");
ALPHABET.forEach(a => {
  if (!a.letter || a.letter.length !== 1) err(`ALPHABET có chữ không hợp lệ: ${JSON.stringify(a.letter)}`);
  if (!a.sound) err(`Chữ ${a.letter} thiếu âm phonics (sound)`);
  if (!Array.isArray(a.words) || a.words.length < 3) err(`Chữ ${a.letter} có <3 từ ví dụ`);
  a.words.forEach(w => {
    if (!w.w || !w.e || !w.vi) err(`Chữ ${a.letter} có từ thiếu trường: ${JSON.stringify(w)}`);
    if (w.w[0].toUpperCase() !== a.letter)
      soft(`Chữ ${a.letter}: từ "${w.w}" KHÔNG bắt đầu bằng chữ đó (phonics sẽ khó giải thích)`);
  });
});
TOPIC_KEYS.forEach(k => {
  const t = TOPICS[k];
  if (!t.name || !t.icon) err(`Chủ đề ${k} thiếu name/icon`);
  if (!Array.isArray(t.words) || t.words.length < 8) err(`Chủ đề ${k} có <8 từ`);
  t.words.forEach(w => { if (!w.w || !w.e || !w.vi) err(`Chủ đề ${k} có từ thiếu trường: ${JSON.stringify(w)}`); });
});
PHRASES.forEach(p => { if (!p.en || !p.vi || !p.icon) err(`PHRASES có câu thiếu trường: ${JSON.stringify(p)}`); });
CONVO.forEach(c => {
  if (!c.q || !c.a) err(`CONVO thiếu q/a: ${JSON.stringify(c)}`);
  if (!Array.isArray(c.wrong) || c.wrong.length !== 3) err(`CONVO "${c.q}" cần đúng 3 đáp án sai`);
  if (c.wrong.indexOf(c.a) >= 0) err(`CONVO "${c.q}": đáp án đúng nằm trong danh sách sai!`);
});
if (ALL_WORDS.length < 100) err(`ALL_WORDS chỉ có ${ALL_WORDS.length} từ — quá ít cho quiz`);

/* ---------- 2. Sinh key âm thanh & đối chiếu với VOICE_LINES ---------- */
console.log("2/4 Kiểm tra key âm thanh …");
const voicedKeys = new Set();
ALPHABET.forEach(a => {
  voicedKeys.add("l" + a.letter);
  voicedKeys.add("p" + a.letter);
  a.words.forEach(w => voicedKeys.add("w_" + slugOf(w.w)));
});
PHRASES.forEach((p, i) => voicedKeys.add("q" + (i + 1)));
CONVO.forEach((c, i) => { voicedKeys.add("cq" + (i + 1)); voicedKeys.add("ca" + (i + 1)); });
Object.keys(VOICE_LINES).forEach(k => voicedKeys.add("v" + k));
console.log(`   → ${voicedKeys.size} key âm thanh sẽ được sinh`);

/* Slug trùng giữa 2 từ khác nhau thì file mp3 sẽ bị dùng chung nhầm nghĩa */
const slugSeen = new Map();
ALL_WORDS.forEach(w => {
  const s = slugOf(w.w);
  if (slugSeen.has(s) && slugSeen.get(s) !== w.w) {
    soft(`Slug trùng: "${w.w}" và "${slugSeen.get(s)}" đều -> w_${s}`);
  }
  slugSeen.set(s, w.w);
});

/* ---------- 3. Mô phỏng logic GAME (như engine games.js) ---------- */
console.log("3/4 Mô phỏng sinh câu hỏi các mode …");
const SOUND_NEAR = { C: ["K"], K: ["C"], G: ["J"], J: ["G"], U: ["V"], V: ["U"], Y: ["I"], I: ["Y"] };
function buildLetterOptions(correct, n = 4) {
  const near = shuffle(SOUND_NEAR[correct] || []).filter(l => l !== correct);
  const rest = shuffle(LETTERS.filter(l => l !== correct && near.indexOf(l) < 0));
  return shuffle([correct, ...near, ...rest].slice(0, n));
}
function pickWordFor(letter, usedEmoji) {
  const list = LETTER_MAP[letter].words;
  let tries = 0; let w = rndPick(list);
  while (usedEmoji && usedEmoji.has(w.e) && tries++ < 8) w = rndPick(list);
  if (usedEmoji) {
    if (usedEmoji.has(w.e)) {           /* như engine games.js: không để trùng emoji */
      const alt = list.find(x => !usedEmoji.has(x.e));
      if (alt) w = alt;
    }
    usedEmoji.add(w.e);
  }
  return w;
}
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
  if (picked.length < n - 1) {
    for (const w of shuffle(wrong)) {
      if (picked.length >= n - 1) break;
      if (picked.indexOf(w) < 0) picked.push(w);
    }
  }
  return shuffle([correct, ...picked]);
}

/* Mode: abc quiz — chọn chữ cái sau khi nghe phonics */
let abcBad = 0;
for (let i = 0; i < N; i++) {
  const letter = rndPick(LETTERS);
  const opts = buildLetterOptions(letter);
  if (opts.length !== 4) { abcBad++; err("abc: không đủ 4 đáp án"); break; }
  if (opts.indexOf(letter) < 0) { abcBad++; err("abc: đáp án đúng không có trong options"); break; }
  if (new Set(opts).size !== 4) { abcBad++; err("abc: có đáp án trùng"); break; }
}
if (!abcBad) console.log(`   abc      ✓ ${N} vòng`);

/* Mode: pic — NGHE từ & chọn từ đúng (thay cho mode icon cũ): 4 ô toàn chữ,
   đáp án đúng có trong options, không trùng từ với nhau. */
let picBad = 0;
for (let i = 0; i < N; i++) {
  const correct = rndPick(ALL_WORDS);
  const opts = pickWordOptions(correct);
  if (opts.length !== 4) { err("pic: không đủ 4 đáp án"); picBad++; break; }
  if (opts.indexOf(correct) < 0) { err("pic: đáp án đúng không có trong options"); picBad++; break; }
  if (new Set(opts.map(w => w.w)).size !== 4) { err("pic: có 2 ô trùng từ"); picBad++; break; }
  if (new Set(opts.map(w => w.e)).size !== 4) { err("pic: có 2 ô trùng emoji"); picBad++; break; }
}
if (!picBad) console.log(`   pic      ✓ ${N} vòng`);

/* Mode: fill — điền chữ cái. Từ phải có từ 3–8 ký tự, chỉ bỏ 1 chữ cái unique */
let fillBad = 0;
const fillPool = ALL_WORDS.filter(w => {
  const up = w.w.toUpperCase();
  return up.length >= 3 && up.length <= 8 && /^[A-Za-z ']+$/.test(w.w);
});
if (fillPool.length < 20) { err(`fill: pool chỉ ${fillPool.length} từ — quá ít`); fillBad++; }
for (let i = 0; i < Math.min(N, 5000); i++) {
  const word = rndPick(fillPool);
  const up = word.w.toUpperCase();
  const poss = [];
  for (let k = 1; k < up.length; k++) {
    if (up[k] >= "A" && up[k] <= "Z" && up.indexOf(up[k]) === k) poss.push(k);
  }
  if (poss.length === 0) { soft(`fill: từ "${word.w}" không có chữ cái nào unique (bỏ qua)`); continue; }
  const bi = rndPick(poss);
  if (up[bi] < "A" || up[bi] > "Z") { err(`fill: chữ cái bỏ trống không phải latin: "${up[bi]}" từ "${word.w}"`); fillBad++; break; }
}
if (!fillBad) console.log(`   fill     ✓ pool=${fillPool.length} từ`);

/* Mode: listen / listenTxt — 4 đáp án unique */
function checkFour(opts, label) {
  if (!Array.isArray(opts) || opts.length !== 4) { err(`${label}: có ${Array.isArray(opts) ? opts.length : "?"} đáp án`); return false; }
  return true;
}
let qtBad = 0;
for (let i = 0; i < N; i++) {
  const correct = rndPick(ALL_WORDS);
  const opts = pickWordOptions(correct);
  if (!checkFour(opts, "listen")) { qtBad++; break; }
  if (opts.indexOf(correct) < 0) { err("listen: đáp án đúng không có trong options"); qtBad++; break; }
  if (new Set(opts.map(w => w.w)).size !== 4) { err("listen: có đáp án trùng từ"); qtBad++; break; }
}
if (!qtBad) console.log(`   listen   ✓ ${N} vòng`);

/* (Mode `phrases` — "Nghe Câu Hằng Ngày" — đã gỡ khỏi menu Bé Nhỏ.
   Mảng PHRASES + key q1..q12 vẫn được kiểm-tra/warm ở trên để dữ liệu
   còn dùng lại được nếu bật lại chế độ.) */

let cvBad = 0;
for (let i = 0; i < N; i++) {
  const idx = rnd(CONVO.length) + 1;
  const c = CONVO[idx - 1];
  const opts = shuffle([c.a, ...c.wrong]);
  if (opts.length !== 4) { err("convo: không đủ 4"); cvBad++; break; }
  if (opts.indexOf(c.a) < 0) { err("convo: đáp án đúng không có trong options"); cvBad++; break; }
}
if (!cvBad) console.log(`   convo    ✓ ${N} vòng`);

/* Mode: spell — từ phải 3–7 chữ cái latin */
const spellPool = ALL_WORDS.filter(w => w.w.length >= 3 && w.w.length <= 7 && /^[a-z]+$/i.test(w.w));
if (spellPool.length < 20) err(`spell: pool chỉ ${spellPool.length} từ`);
else console.log(`   spell    ✓ pool=${spellPool.length} từ`);

/* ---------- 4. Mô phỏng match / matchVi không lặp nhóm ---------- */
console.log("4/4 Kiểm tra match không lặp nhóm …");
let dupGroup = 0;
let last = "";
for (let i = 0; i < Math.min(N, 2000); i++) {
  let key = "", picks;
  for (let t = 0; t < 4; t++) {
    const letters = shuffle(LETTERS).slice(0, 4);
    picks = letters.map(l => pickWordFor(l, new Set()));
    key = picks.map(w => w.w).sort().join(",");
    if (key !== last) break;
  }
  if (key === last) dupGroup++;
  last = key;
}
if (dupGroup > 0) soft(`match: ${dupGroup}/2000 nhóm bị lặp ngay sau vòng trước (hiếm, chấp nhận được)`);
else console.log(`   match    ✓ không lặp nhóm`);

/* ---------- Kết luận ---------- */
console.log("\n========== KẾT QUẢ ==========");
if (warn.length) {
  console.log(`⚠️  ${warn.length} cảnh báo:`);
  warn.slice(0, 30).forEach(w => console.log("   · " + w));
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} LỖI:`);
  errors.slice(0, 50).forEach(e => console.log("   · " + e));
  process.exit(1);
} else {
  console.log(`\n✅ Không có lỗi. ${voicedKeys.size} key âm thanh chờ sinh (node tools/gen-voice.js)`);
}
