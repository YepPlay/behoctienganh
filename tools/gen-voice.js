/* Sinh TOÀN BỘ file đọc bằng GIỌNG GOOGLE (translate.google.com TTS).
   Chạy MỘT LẦN trên máy tính có mạng:

       node tools/gen-voice.js           (chỉ sinh file còn thiếu)
       node tools/gen-voice.js --force   (sinh lại tất cả)

   Kết quả: assets/voice/<key>.mp3
     · Tiếng Anh (tl=en): tên chữ  lA…lZ · phonics pA…pZ · từ w_<slug>
       · câu q1… · hội thoại cq1/ca1…
     · Tiếng Việt (tl=vi): chỉ mục UI  v<key>  (VOICE_LINES trong data.js)
   Mọi thiết bị nghe CÙNG MỘT GIỌNG, chơi offline được.
   Sửa nội dung ở js/data.js rồi chạy lại lệnh này. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "assets", "voice");
const force = process.argv.includes("--force");

/* Đọc dữ liệu ngữ liệu (js/data.js + js/voice-lines.js) */
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, "js", "data.js"), "utf8") +
  "\n;globalThis.__d = { ALPHABET, PHRASES, CONVO, slugOf, VOICE_LINES };",
  sandbox);
const { ALPHABET, PHRASES, CONVO, slugOf, VOICE_LINES } = sandbox.__d;

/* Xây danh sách key -> { text, lang } */
const lines = {};
function add(key, text, lang) { lines[key] = { text, lang }; }

ALPHABET.forEach(a => {
  add("l" + a.letter, a.letter, "en");                       /* tên chữ: "B" -> "bee" */
  const ex = a.words[0];
  add("p" + a.letter, a.letter + " for " + ex.w, "en");      /* phonics: "B for Banana" */
  a.words.forEach(w => add("w_" + slugOf(w.w), w.w, "en"));   /* từ vựng */
});
PHRASES.forEach((p, i) => add("q" + (i + 1), p.en, "en"));
CONVO.forEach((c, i) => {
  add("cq" + (i + 1), c.q, "en");
  add("ca" + (i + 1), c.a, "en");
});
Object.keys(VOICE_LINES).forEach(k => add("v" + k, VOICE_LINES[k], "vi"));

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* Google Translate TTS (giọng đọc giống trên translate.google.com) */
async function tts(text, lang) {
  const url = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&ttsspeed=0.9&tl="
    + lang + "&q=" + encodeURIComponent(text);
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Referer": "https://translate.google.com/",
        },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const buf = Buffer.from(await r.arrayBuffer());
      const head = buf.slice(0, 3).toString("latin1");
      if (buf.length < 200 || (head !== "ID3" && buf[0] !== 0xFF)) throw new Error("dữ liệu trả về không phải MP3");
      return buf;
    } catch (e) {
      if (i === 3) throw e;
      await sleep(800 * (i + 1));   /* Google giới hạn tốc độ → chờ rồi thử lại */
    }
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const keys = Object.keys(lines);
  let made = 0, skip = 0, bytes = 0;
  const failed = [];

  console.log(`Sinh ${keys.length} file đọc vào assets/voice/ …\n`);
  for (const key of keys) {
    const file = path.join(OUT, key + ".mp3");
    if (!force && fs.existsSync(file) && fs.statSync(file).size > 200) {
      skip++; bytes += fs.statSync(file).size;
      continue;
    }
    const { text, lang } = lines[key];
    process.stdout.write(`  ${key.padEnd(12)} [${lang}] ${text} … `);
    try {
      const buf = await tts(text, lang);
      fs.writeFileSync(file, buf);
      made++; bytes += buf.length;
      console.log(`${(buf.length / 1024).toFixed(1)} KB`);
    } catch (e) {
      console.log("LỖI: " + e.message);
      failed.push(key);
    }
    await sleep(350);
  }

  console.log(`\nMới sinh: ${made} · đã có sẵn: ${skip} · tổng dung lượng: ${(bytes / 1024).toFixed(0)} KB`);
  if (failed.length) {
    console.log(`❌ ${failed.length} file lỗi: ${failed.join(", ")}`);
    console.log("   → chạy lại lệnh này (nó bỏ qua file đã có) để thử tiếp.");
    process.exit(1);
  }
  console.log("✅ Xong — chạy node tools/gen-sw.js để đưa các file này vào cache offline.");
})();
