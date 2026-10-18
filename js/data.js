/* ============================================================
   Bé Học Tiếng Anh — DỮ LIỆU NGỮ LIỆU
   Học tiếng Anh chuẩn theo PHONICS: mỗi chữ có TÊN CHỮ (A, bee,see..)
   + ÂM PHONICS ("A for Apple") + từ ví dụ có emoji + nghĩa Việt.
   Mọi file âm thanh tiếng Anh sinh từ đây: node tools/gen-voice.js
   (chỉ mục UI tiếng Việt nằm ở js/voice-lines.js)
   ============================================================ */

/* slug: "Ice Cream" -> "icecream" — dùng đặt tên file âm thanh + key */
function slugOf(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/* BẢNG CHỮ CÁI — chữ, âm phonics hiển thị, 3–5 từ ví dụ [en, vi, emoji] */
const ALPHABET = [
  { letter: "A", sound: "/æ/", words: [["Apple", "Quả táo", "🍎"], ["Ant", "Con kiến", "🐜"], ["Airplane", "Máy bay", "✈️"], ["Arrow", "Mũi tên", "➡️"], ["Axe", "Cái rìu", "🪓"]] },
  { letter: "B", sound: "/b/", words: [["Banana", "Quả chuối", "🍌"], ["Ball", "Quả bóng", "⚽"], ["Bird", "Con chim", "🐦"], ["Book", "Quyển sách", "📖"], ["Bear", "Con gấu", "🐻"]] },
  { letter: "C", sound: "/k/", words: [["Cat", "Con mèo", "🐱"], ["Car", "Chiếc ô tô", "🚗"], ["Cake", "Miếng bánh", "🎂"], ["Cow", "Con bò", "🐮"], ["Cup", "Chiếc cốc", "☕"]] },
  { letter: "D", sound: "/d/", words: [["Dog", "Con chó", "🐶"], ["Duck", "Con vịt", "🦆"], ["Door", "Cánh cửa", "🚪"], ["Drum", "Cái trống", "🥁"], ["Diamond", "Viên kim cương", "💎"]] },
  { letter: "E", sound: "/e/", words: [["Egg", "Quả trứng", "🥚"], ["Eagle", "Con đại bàng", "🦅"], ["Eight", "Số tám", "8️⃣"], ["Ear", "Cái tai", "👂"], ["Envelope", "Bức thư", "✉️"]] },
  { letter: "F", sound: "/f/", words: [["Fish", "Con cá", "🐟"], ["Flower", "Bông hoa", "🌸"], ["Fox", "Con cáo", "🦊"], ["Frog", "Con ếch", "🐸"], ["Flag", "Ngọn cờ", "🚩"]] },
  { letter: "G", sound: "/ɡ/", words: [["Grapes", "Quả nho", "🍇"], ["Goat", "Con dê", "🐐"], ["Gift", "Món quà", "🎁"], ["Girl", "Bạn nữ", "👧"], ["Guitar", "Đàn ghi ta", "🎸"]] },
  { letter: "H", sound: "/h/", words: [["Hat", "Chiếc mũ", "🎩"], ["House", "Ngôi nhà", "🏠"], ["Horse", "Con ngựa", "🐴"], ["Heart", "Trái tim", "❤️"], ["Honey", "Mật ong", "🍯"]] },
  { letter: "I", sound: "/ɪ/", words: [["Ice Cream", "Kem", "🍦"], ["Ice", "Nước đá", "🧊"], ["Island", "Hòn đảo", "🏝️"], ["Insect", "Con côn trùng", "🐛"], ["Ink", "Mực", "🖋️"]] },
  { letter: "J", sound: "/dʒ/", words: [["Juice", "Nước ép", "🧃"], ["Jacket", "Áo khoác", "🧥"], ["Joker", "Gã hề", "🃏"], ["Jump", "Nhảy", "🤸"], ["Jellyfish", "Sinh vật biển", "🪼"]] },
  { letter: "K", sound: "/k/", words: [["Kite", "Chiếc diều", "🪁"], ["Key", "Chiếc chìa khóa", "🔑"], ["King", "Vua", "👑"], ["Kiwi", "Quả kiwi", "🥝"], ["Koala", "Gấu túi", "🐨"]] },
  { letter: "L", sound: "/l/", words: [["Lion", "Con sư tử", "🦁"], ["Leaf", "Chiếc lá", "🍃"], ["Lemon", "Quả chanh", "🍋"], ["Lamp", "Chiếc đèn", "💡"], ["Ladder", "Cái thang", "🪜"]] },
  { letter: "M", sound: "/m/", words: [["Monkey", "Con khỉ", "🐵"], ["Moon", "Mặt trăng", "🌙"], ["Mango", "Quả xoài", "🥭"], ["Mouse", "Con chuột", "🐭"], ["Milk", "Ly sữa", "🥛"]] },
  { letter: "N", sound: "/n/", words: [["Nose", "Cái mũi", "👃"], ["Nest", "Tổ chim", "🪺"], ["Nurse", "Nữ y tá", "👩‍⚕️"], ["Nine", "Số chín", "9️⃣"], ["Nut", "Hạt óc chó", "🥜"]] },
  { letter: "O", sound: "/ɒ/", words: [["Orange", "Quả cam", "🍊"], ["Owl", "Con cú", "🦉"], ["Octopus", "Con bạch tuộc", "🐙"], ["Onion", "Hành tây", "🧅"], ["Ocean", "Đại dương", "🌊"]] },
  { letter: "P", sound: "/p/", words: [["Pig", "Con heo", "🐷"], ["Panda", "Gấu trúc", "🐼"], ["Pizza", "Bánh pizza", "🍕"], ["Pen", "Bút mực", "🖊️"], ["Pineapple", "Quả dứa", "🍍"]] },
  { letter: "Q", sound: "/kw/", words: [["Queen", "Nữ hoàng", "👸"], ["Question", "Câu hỏi", "❓"], ["Quilt", "Chiếc chăn", "🛏️"], ["Quiet", "Im lặng", "🤫"]] },
  { letter: "R", sound: "/r/", words: [["Rabbit", "Con thỏ", "🐰"], ["Rainbow", "Cầu vồng", "🌈"], ["Robot", "Người máy", "🤖"], ["Ring", "Chiếc nhẫn", "💍"], ["Rose", "Bông hồng", "🌹"]] },
  { letter: "S", sound: "/s/", words: [["Sun", "Mặt trời", "☀️"], ["Star", "Ngôi sao", "⭐"], ["Snake", "Con rắn", "🐍"], ["Sheep", "Con cừu", "🐑"], ["Ship", "Con tàu", "🚢"]] },
  { letter: "T", sound: "/t/", words: [["Tiger", "Con hổ", "🐯"], ["Tree", "Cái cây", "🌳"], ["Train", "Tàu hỏa", "🚂"], ["Tomato", "Quả cà chua", "🍅"], ["Tent", "Chiếc lều", "⛺"]] },
  { letter: "U", sound: "/ʌ/", words: [["Umbrella", "Chiếc ô", "☂️"], ["Unicorn", "Kỳ lân", "🦄"], ["Up", "Đi lên", "⬆️"], ["Uniform", "Đồng phục", "👔"], ["Universe", "Vũ trụ", "🪐"]] },
  { letter: "V", sound: "/v/", words: [["Van", "Xe tải nhỏ", "🚐"], ["Violin", "Đàn vĩ cầm", "🎻"], ["Volcano", "Núi lửa", "🌋"], ["Vegetables", "Rau củ", "🥦"], ["Vest", "Áo vest", "🦺"]] },
  { letter: "W", sound: "/w/", words: [["Water", "Giọt nước", "💧"], ["Whale", "Con cá voi", "🐳"], ["Watch", "Chiếc đồng hồ", "⌚"], ["Window", "Cửa sổ", "🪟"], ["Worm", "Con giun", "🪱"]] },
  { letter: "X", sound: "/ks/", words: [["X-ray", "Ảnh chụp X-quang", "🩻"], ["Xylophone", "Đàn gõ", "🎵"], ["Xmas Tree", "Cây thông Noel", "🎄"]] },
  { letter: "Y", sound: "/j/", words: [["Yellow", "Màu vàng", "🟡"], ["Yarn", "Cuộn len", "🧶"], ["Yacht", "Du thuyền", "⛵"], ["Yogurt", "Sữa chua", "🥣"], ["Yo-yo", "Đồ chơi dây", "🪀"]] },
  { letter: "Z", sound: "/z/", words: [["Zebra", "Ngựa vằn", "🦓"], ["Zero", "Số không", "0️⃣"], ["Zoo", "Vườn thú", "🎪"]] },
];

ALPHABET.forEach((a, i) => {
  a.idx = i + 1;
  a.words = a.words.map((p, k) => ({ w: p[0], vi: p[1], e: p[2], k: k + 1 }));
});

const LETTERS = ALPHABET.map(a => a.letter);
const LETTER_MAP = Object.fromEntries(ALPHABET.map(a => [a.letter, a]));

/* CÁC CHẾ ĐỘ CHƠI — lv: "small" (Bé Nhỏ 3–6) | "big" (Bé Lớn 6–9) | "both"
   Mọi chế độ đều "CHƠI MÃI": random vĩnh viễn cho đến khi bé tự bấm ⬅️ Thoát
   (không khai báo số vòng, không thanh tiến trình). */
const MODES = {
  abc:       { name: "Học Chữ Cái A–Z",     icon: "🔤", lv: "both" },
  topic:     { name: "Học Từ Vựng",          icon: "📚", lv: "small" },
  listen:    { name: "Nghe & Chọn Hình",     icon: "🔊", lv: "small" },
  pic:       { name: "Nghe & Chọn Từ",       icon: "🔉", lv: "small" },
  match:     { name: "Nối Từ Với Hình",      icon: "🔗", lv: "small" },
  spell:     { name: "Ghép Chữ Thành Từ",    icon: "🧩", lv: "big" },
  listenTxt: { name: "Nghe & Chọn Từ",       icon: "🎧", lv: "big" },
  matchVi:   { name: "Nối Anh — Việt",       icon: "🆚", lv: "big" },
  fill:      { name: "Điền Chữ Thiếu",       icon: "✏️", lv: "big" },
  convo:     { name: "Nghe và chọn Câu",     icon: "🗣️", lv: "big" },
};

const SMALL_MODES = Object.keys(MODES).filter(m => MODES[m].lv !== "big");
const BIG_MODES = Object.keys(MODES).filter(m => MODES[m].lv !== "small");

/* CHỦ ĐỀ TỪ VỰNG — mỗi từ [en, vi, emoji] */
const TOPICS = {
  animal: {
    name: "Động Vật", icon: "🐰",
    words: [["Cat", "Con mèo", "🐱"], ["Dog", "Con chó", "🐶"], ["Elephant", "Con voi", "🐘"], ["Lion", "Con sư tử", "🦁"], ["Rabbit", "Con thỏ", "🐰"], ["Bird", "Con chim", "🐦"], ["Fish", "Con cá", "🐟"], ["Monkey", "Con khỉ", "🐵"], ["Tiger", "Con hổ", "🐯"], ["Duck", "Con vịt", "🦆"]],
  },
  fruit: {
    name: "Quả", icon: "🍎",
    words: [["Apple", "Quả táo", "🍎"], ["Banana", "Quả chuối", "🍌"], ["Orange", "Quả cam", "🍊"], ["Grape", "Quả nho", "🍇"], ["Mango", "Quả xoài", "🥭"], ["Strawberry", "Dâu tây", "🍓"], ["Watermelon", "Dưa hấu", "🍉"], ["Pineapple", "Quả dứa", "🍍"], ["Peach", "Quả đào", "🍑"], ["Lemon", "Quả chanh", "🍋"]],
  },
  color: {
    name: "Màu Sắc", icon: "🎨",
    words: [["Red", "Màu đỏ", "🔴"], ["Blue", "Màu xanh dương", "🔵"], ["Yellow", "Màu vàng", "🟡"], ["Green", "Màu xanh lá", "🟢"], ["Pink", "Màu hồng", "🩷"], ["Purple", "Màu tím", "🟣"], ["Black", "Màu đen", "⚫"], ["White", "Màu trắng", "⚪"], ["Orange Color", "Màu cam", "🟠"], ["Brown", "Màu nâu", "🟤"]],
  },
  number: {
    name: "Con Số", icon: "🔢",
    words: [["One", "Số một", "1️⃣"], ["Two", "Số hai", "2️⃣"], ["Three", "Số ba", "3️⃣"], ["Four", "Số bốn", "4️⃣"], ["Five", "Số năm", "5️⃣"], ["Six", "Số sáu", "6️⃣"], ["Seven", "Số bảy", "7️⃣"], ["Eight", "Số tám", "8️⃣"], ["Nine", "Số chín", "9️⃣"], ["Ten", "Số mười", "🔟"]],
  },
  body: {
    name: "Cơ Thể", icon: "🧍",
    words: [["Eye", "Đôi mắt", "👁️"], ["Ear", "Cái tai", "👂"], ["Nose", "Cái mũi", "👃"], ["Mouth", "Miệng", "👄"], ["Hand", "Bàn tay", "✋"], ["Foot", "Bàn chân", "👣"], ["Tooth", "Cái răng", "🦷"], ["Hair", "Mái tóc", "💇"], ["Arm", "Bắp tay", "💪"], ["Leg", "Đùi và chân", "🦵"]],
  },
  family: {
    name: "Gia Đình", icon: "👨‍👩‍👧",
    words: [["Mom", "Mẹ", "👩"], ["Dad", "Bố", "👨"], ["Baby", "Em bé", "👶"], ["Brother", "Anh trai", "👦"], ["Sister", "Em gái", "👧"], ["Grandma", "Bà", "👵"], ["Grandpa", "Ông", "👴"], ["Family", "Gia đình", "👨‍👩‍👧‍👦"], ["Friend", "Bạn bè", "🤝"], ["Teacher", "Cô giáo", "👩‍🏫"]],
  },
  school: {
    name: "Trường Học", icon: "🎒",
    words: [["Book", "Quyển sách", "📖"], ["Pencil", "Bút chì", "✏️"], ["Ruler", "Chiếc thước", "📏"], ["Bag", "Chiếc ba lô", "🎒"], ["Chair", "Chiếc ghế", "🪑"], ["School", "Ngôi trường", "🏫"], ["Notebook", "Sổ tay", "📓"], ["Scissors", "Chiếc kéo", "✂️"], ["Eraser", "Cái tẩy", "🧽"], ["Window", "Cửa sổ", "🪟"]],
  },
  vehicle: {
    name: "Phương Tiện", icon: "🚗",
    words: [["Car", "Chiếc ô tô", "🚗"], ["Bus", "Chiếc xe buýt", "🚌"], ["Train", "Tàu hỏa", "🚂"], ["Bike", "Xe đạp", "🚲"], ["Airplane", "Máy bay", "✈️"], ["Boat", "Chiếc thuyền", "⛵"], ["Motorbike", "Xe máy", "🛵"], ["Truck", "Xe tải", "🚚"], ["Helicopter", "Trực thăng", "🚁"], ["Subway", "Tàu điện ngầm", "🚇"]],
  },
  food: {
    name: "Đồ Ăn", icon: "🍔",
    words: [["Rice", "Bát cơm", "🍚"], ["Bread", "Bánh mì", "🍞"], ["Egg", "Quả trứng", "🥚"], ["Milk", "Ly sữa", "🥛"], ["Cake", "Miếng bánh", "🎂"], ["Candy", "Viên kẹo", "🍬"], ["Soup", "Bát canh", "🍲"], ["Cheese", "Phô mai", "🧀"], ["Meat", "Miếng thịt", "🍖"], ["Water", "Giọt nước", "💧"]],
  },
  nature: {
    name: "Thiên Nhiên", icon: "🌳",
    words: [["Sun", "Mặt trời", "☀️"], ["Moon", "Mặt trăng", "🌙"], ["Star", "Ngôi sao", "⭐"], ["Tree", "Cái cây", "🌳"], ["Flower", "Bông hoa", "🌸"], ["Rain", "Cơn mưa", "🌧️"], ["Cloud", "Đám mây", "☁️"], ["Mountain", "Ngọn núi", "⛰️"], ["River", "Dòng sông", "🏞️"], ["Wind", "Gió", "🌬️"]],
  },
};

const TOPIC_KEYS = Object.keys(TOPICS);
TOPIC_KEYS.forEach(t => {
  TOPICS[t].key = t;
  TOPICS[t].words = TOPICS[t].words.map((p, k) => ({ w: p[0], vi: p[1], e: p[2], k: k + 1 }));
});

/* Từ điển tìm nhanh: "apple" -> {w, vi, e} (dùng cho quiz modes).
   Một từ có thể xuất hiện ở cả bảng chữ cái lẫn chủ đề (Apple 🍎, Window 🪟…)
   → CHỈ GIỮ LẦN ĐẦU theo slug, nếu không quiz sẽ có 2 đáp án y hệt nhau. */
const ALL_WORDS = [];
const _seenSlug = new Set();
function _pushWord(w) {
  const s = slugOf(w.w);
  if (_seenSlug.has(s)) return;
  _seenSlug.add(s);
  ALL_WORDS.push(w);
}
ALPHABET.forEach(a => a.words.forEach(_pushWord));
TOPIC_KEYS.forEach(t => TOPICS[t].words.forEach(_pushWord));

/* CÂU HẰNG NGÀY — phát âm chuẩn, bé bấm nghe rồi chọn hình */
const PHRASES = [
  { en: "Hello!", vi: "Xin chào!", icon: "👋" },
  { en: "Goodbye!", vi: "Tạm biệt!", icon: "🧳" },
  { en: "Thank you!", vi: "Cảm ơn!", icon: "🤝" },
  { en: "Please.", vi: "Xin làm ơn.", icon: "🙏" },
  { en: "Yes!", vi: "Vâng, đúng ạ!", icon: "✔️" },
  { en: "No.", vi: "Không ạ.", icon: "❌" },
  { en: "I love you!", vi: "Con yêu bố mẹ!", icon: "❤️" },
  { en: "Good morning!", vi: "Chào buổi sáng!", icon: "🌅" },
  { en: "Good night!", vi: "Chào buổi tối!", icon: "🌙" },
  { en: "How are you?", vi: "Bạn khỏe không?", icon: "💭" },
  { en: "I'm fine, thank you!", vi: "Mình khỏe, cảm ơn!", icon: "😊" },
  { en: "What's your name?", vi: "Bạn tên là gì?", icon: "🤔" },
];
PHRASES.forEach((p, i) => { p.idx = i + 1; });

/* HỘI THOẠI ĐƠN GIẢN (Bé Lớn) — hỏi: audio, đáp: chọn câu trả lời đúng */
const CONVO = [
  { q: "Hello!", a: "Hi!", wrong: ["Goodbye!", "Thank you!", "Yes!"] },
  { q: "How are you?", a: "I'm fine, thank you!", wrong: ["My name is Bao.", "Good night!", "No."] },
  { q: "What's your name?", a: "My name is Bao.", wrong: ["I'm fine!", "Goodbye!", "Yes!"] },
  { q: "Thank you!", a: "You're welcome!", wrong: ["I love you!", "How are you?", "Good morning!"] },
  { q: "Goodbye!", a: "See you!", wrong: ["Hello!", "Please.", "Thank you!"] },
  { q: "Good morning!", a: "Good morning!", wrong: ["Good night!", "I'm fine.", "No."] },
  { q: "Nice to meet you!", a: "Nice to meet you, too!", wrong: ["I'm hungry!", "See you!", "Yes!"] },
  { q: "I love you!", a: "I love you, too!", wrong: ["What?", "Goodbye!", "Please."] },
];

/* GIỌNG ĐỌC — CHỈ MỤC TIẾU (tl=vi) cho UI tiếng Việt, file assets/voice/v<key>.mp3.
   Âm thanh tiếng Anh (chữ/từ/câu) sinh TỰ ĐỘNG từ data.js ở trên. */
const VOICE_LINES = {
  gioiQua: "Giỏi quá!",
  thuLai: "Chưa đúng, bé thử lại nhé!",
  chaoMung: "Chào mừng bé đến với Bé Học Tiếng Anh!",
  ngheVaChon: "Bé nghe kỹ rồi chọn hình đúng nhé!",
  chonChuVuaNghe: "Bé chọn chữ cái vừa nghe nhé!",
  chonHinhChu: "Bé chọn hình có chữ cái này nhé!",
  hocChu: "Bé ấn vào chữ cái để nghe âm và từ ví dụ nhé!",
  noiTu: "Bé nối từ với hình đúng nhé!",
  ghepChu: "Bé bấm các chữ cái để ghép thành từ nhé!",
  dienChu: "Bé chọn chữ cái còn thiếu nhé!",
  hoiDap: "Bé nghe câu hỏi rồi chọn câu trả lời đúng nhé!",
  conBay: "Bé còn đó không?",
  xemChuDao: "Bé chọn chủ đề muốn học nhé!",
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { ALPHABET, LETTERS, LETTER_MAP, MODES, SMALL_MODES, BIG_MODES, TOPICS, TOPIC_KEYS, ALL_WORDS, PHRASES, CONVO, VOICE_LINES, slugOf };
}
