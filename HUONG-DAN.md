# 🅰️ Ghi chú lệnh — Bé Học Tiếng Anh (3–9 tuổi, Phonics A–Z)

> Yêu cầu: **Node.js 18 trở lên** (kiểm tra bằng `node -v`). Mở terminal tại thư mục game:
> `D:\MyGame\behoctienganh`

---

## 1. Lệnh hay dùng

| Việc cần làm | Lệnh |
| --- | --- |
| **Kiểm tra nội dung** (validate dữ liệu + sinh thử 3.000 câu/mode) | `node tools/check-questions.js` |
| **Kiểm tra DOM** (id/selector JS tra cứu đều có thật) | `node tools/check-dom.js` |
| **Smoke-test toàn game** chơi thật 11 mode bằng jsdom (cần `npm i jsdom --no-save` 1 lần, hoặc mượn jsdom của `../behoctoan`) | `node tools/smoke-test.js` |
| **Sinh file giọng đọc MP3** (Google TTS, cần mạng) | `node tools/gen-voice.js` · thêm `--force` để sinh lại toàn bộ |
| **Làm mới cache offline** (chạy sau MỌI lần sửa file) | `node tools/gen-sw.js` |
| Kiểm tra cú pháp 1 file JS | `node --check js/games.js` |

> 🌐 Game chạy online/offline dạng **PWA**. Khác 2 game anh em (behoctoan/behocchu):
> **âm đọc tiếng Anh là file MP3 có sẵn** trong `assets/voice/` (218 file, ~1.8 MB) —
> phát qua Web Audio API, fallback thẻ `<audio>`. Không dùng `speechSynthesis`
> (giọng đọcantuỳ thiết bị, không ổn định, khó kiểm soát — xem `js/audio.js`).

---

## 2. Luồng chơi

```
Chọn Bé (Trai 🧒 / Gái 👧 — theme Xanh/Vàng)
   → Chọn Cấp Độ (chỉ hiện 1 lần đầu):
        🌱 BÉ NHỎ 3–6  → Menu 6 chế độ · đáp án toàn HÌNH + TIẾNG ĐỌC
        📚 BÉ LỚN 6–9  → Menu 6 chế độ · đáp án có CHỮ
   → Menu (xem tổng sao ⭐, bấm 🎚️ để đổi cấp độ)
   → Chơi: số vòng CỐ ĐỊNH (10 vòng, hoặc 26 vòng với ABC A–Z)
   → Bấm ⬅️ hoặc hết vòng → Popup tổng kết: sao + khen → Chơi Lại / Chơi Tiếp / Menu
```

- **Tiến độ** lưu theo bạn (sessionStorage `en.progress`): tổng sao ⭐ + best từng mode.
- **Chữ ABC học đến đâu nhớ đến đó**: popup **≡** (hiện khi >12 vòng) cho nhảy thẳng tới chữ bất kỳ.
- Âm đọc tự phát + lặp mỗi 5.5 giây (tối đa 5 lần) rồi hỏi "Bé còn đó không?".
- Nút 🔊/🔇 bật tắt tiếng đọc (nhớ trong `localStorage` `en.voice`).

### 2.1. Các chế độ

| Bé Nhỏ 3–6 | Bé Lớn 6–9 | Tên trên menu |
| --- | --- | --- |
| `abc` (cùng) | `abc` | 🔤 Bảng Chữ Cái — học phonics + quiz nghe âm chọn chữ |
| `topic` | — | 🎨 Chủ Đề — chọn chủ đề → học từ có phát âm → quiz |
| `listen` | — | 👂 Nghe & Chọn — nghe từ, chọn hình |
| `pic` | — | 🖼️ Chữ & Hình — thấy chữ, chọn hình đúng |
| `match` | — | 🔗 Nối Từ (endless) — kéo/chạm nối hình ↔ từ |
| `phrases` | — | 💬 Câu Hằng Ngày — nghe câu, chọn hình/minh hoạ |
| — | `spell` | 🧩 Đánh Vần — xếp chồng ký tự đúng thành từ |
| — | `listenTxt` | 👂 Nghe & Chọn (có chữ) |
| — | `matchVi` | 🔗 Nối Anh–Việt |
| — | `fill` | ✏️ Điền Chữ Thiếu |
| — | `convo` | 💬 Hội Thoại — nghe câu hỏi, trả lời |

---

## 3. Sửa thường gặp

### 3.1. Thêm / sửa từ vựng, chữ cái, câu

Mọi nội dung nằm trong **`js/data.js`**:

| Cần sửa |Ở đâu trong `js/data.js` |
| --- | --- |
| Thêm từ cho 1 chữ cái | `ALPHABET` → `words: [{ w: "Apple", vi: "Quả táo", e: "🍎" }]` |
| Thêm từ cho 1 chủ đề | `TOPICS` → `words` (cùng cấu trúc) |
| Thêm/sửa câu hằng ngày | `PHRASES` (câu thứ 13 trở đi → thêm key `q13`… cho audio) |
| Thêm/sửa hội thoại | `CONVO` (tự có `cq<stt>` / `ca<stt>`) |
| Sửa câu chữ Việt trên giao diện | `VOICE_LINES` (key `v<key>`对应 file mp3) |

Sau khi sửa **bắt buộc chạy** (thứ tự này):

```powershell
node tools/check-questions.js    # 0 lỗi?
node tools/gen-voice.js          # chỉ sinh file THIẾU (file cũ giữ nguyên)
node tools/gen-sw.js             # làm mới cache offline
```

> Quy tắc checker: **không trùng emoji trong 4 ô đáp án, không trùng đáp án,
> pool mỗi chủ đề ≥4 từ**. Chạy checker trước khi sinh âm thanh để khỏi tốn công.

### 3.2. Sinh lại toàn bộ giọng đọc

```powershell
node tools/gen-voice.js --force
```

- Nguồn: Google Translate TTS (`tl=en` cho tiếng Anh, `tl=vi` cho tiếng Việt).
- Throttle 350ms/lần, retry 4 lần — chạy ~3–4 phút cho 218 file.
- Key audio = `l<chữ>` (tên chữ), `p<chữ>` (phonics "A for Apple"), `w_<slug>` (từ),
  `q<stt>` (câu), `cq<stt>`/`ca<stt>` (hội thoại), `v<key>` (VOICE_LINES).
- **Muốn thay bằng giọng thật (khuyến nghị khi phát hành):** ghi đè file trong
  `assets/voice/` giữ nguyên tên key, rồi `node tools/gen-sw.js`.

### 3.3. Thêm 1 chế độ mới

1. `js/data.js` → `MODES`: thêm `{ xxx: { name, icon, lv, rounds } }`
   (`lv`: `"small"` / `"big"` / `"both"`; bỏ `rounds` = endless).
2. `js/data.js` → viết `QUESTIONS.xxx = () => ({ speak, prompt, options, answer })`
   nếu dùng chung engine quiz — **hoặc** viết renderer riêng trong `js/games.js`
   và thêm vào map `render` trong `next()` (xem `renderAbc`, `renderSpell`).
3. Thêm nút mode — `buildMenu` tự sinh từ `MODES` theo cấp độ, **không cần sửa HTML**.
4. Chạy: `check-questions` → `check-dom` → `gen-sw`.

### 3.4. Đổi icon / tên app

- Icon: `assets/images/icon-{32,180,192,512}.png` — **hiện là icon placeholder sinh bằng
  `node tools/gen-icons.js`** (chữ A 🅰️ nền gradient). Muốn icon đẹp: thay 4 file PNG.
- Tên app/màu: `manifest.webmanifest` (`name`, `short_name`, `theme_color` = `#43a047`).
- Sau đó: `node tools/gen-sw.js`.

### 3.5. Sửa CSS / JS / HTML

```powershell
node --check js/games.js         # kiểm tra cú pháp cho chắc
node tools/check-dom.js
node tools/gen-sw.js
```

---

## 4. Xuất bản lên web / cài lên iPhone

```powershell
node tools/gen-sw.js
```

1. **Khuyến nghị: GitHub Pages** (miễn phí):
   - Mở repo trên github.com → **Settings → Pages** → **Build and deployment**:
     - Source: **Deploy from a branch**
     - Branch: **main** / **/ (root)** → bấm **Save**
   - Đợi ~1 phút → `https://<user>.github.io/behoctienganh/`
   - Lần sửa code sau: **push lên GitHub là site tự cập nhật**.
   - Cách khác: kéo thả cả thư mục lên [app.netlify.com/drop](https://app.netlify.com/drop).
2. Trên iPhone mở bằng **Safari** → nút **Chia sẻ** → **Thêm vào Màn hình chính**.
3. Mở từ màn hình chính: chạy toàn màn hình như app và **chơi được offline**
   (toàn bộ 218 file giọng đọc được cache sẵn).

**Cập nhật bản mới:** chạy `node tools/gen-sw.js` → upload lại → mở app lúc có mạng
(có thể phải mở 2 lần) là tự nhận bản mới.

> Không thể copy thư mục vào iPhone rồi mở `file://` — service worker chỉ chạy trên HTTPS.

---

## 5. Kiểm tra nhanh trước khi phát hành

```powershell
node --check js/data.js; node --check js/audio.js; node --check js/games.js; node --check js/main.js; node --check js/pwa.js
node tools/check-questions.js
node tools/check-dom.js
node tools/smoke-test.js      # ~2 phút — chơi trọn 11 mode, exit 1 nếu có lỗi
node tools/gen-sw.js
```

- [ ] Chọn Bé Trai (xanh) / Bé Gái (vàng) → cấp độ → menu đúng 6 mode
- [ ] **Bé Nhỏ:** ABC học phonics có phát âm "A for Apple"; Nghe & Chọn có nút 🔊;
      4 ô đáp án không trùng hình; Pic: đáp án sai không bắt đầu bằng chữ mục tiêu
- [ ] **Bé Lớn:** Điền Chữ Thiếu hiện ô trống `___`; Hội Thoại hiện 2 bong bóng chat;
      Nối Anh–Việt có 2 cột cỡ chữ khác nhau
- [ ] Popup **≡** ở ABC hiện đúng 26 chữ, bấm nhảy được, popup tự đóng
- [ ] Chơi 10 vòng → popup tổng kết hiện sao + khen; **Chơi Lại** làm lại từ đầu
- [ ] Bấm 🔊/🔇 tắt tiếng thì im lặng hoàn toàn, bật lại được
- [ ] Dọc & ngang đều không bị cuộn; điện thoại 360px menu không vỡ layout
- [ ] Tắt mạng → reload vẫn chơi được (đã chạy `gen-sw.js` sau lần sửa cuối)
- [ ] `node tools/check-questions.js` + `node tools/smoke-test.js` báo **0 lỗi**
