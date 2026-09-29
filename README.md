# Góc Vui Chơi Của Bé

Cổng trò chơi cho bé từ 3 tuổi, chơi trên web (điện thoại, iPad, máy tính). Toàn bộ bằng tiếng Việt.

| Trò chơi | Thư mục | Kiểu |
|---|---|---|
| Tiệm Trang Điểm | `games/trang-diem/` | 2D (SVG) |
| Hamster Nhảy Bánh Kem | `games/banh-kem/` | 3D (Three.js) |
| Tiệm Làm Tóc | `games/lam-toc/` | 3D (Three.js) |
| Thời Trang Xinh | `games/thoi-trang/` | 3D (Three.js) |
| Bé Nấu Ăn | `games/nau-an/` | 3D (Three.js) |

## Chạy trên máy

Trò chơi dùng ES module nên cần chạy qua một web server (mở thẳng file `index.html` sẽ không chạy):

```bash
python3 -m http.server 8765
```

Rồi mở http://localhost:8765

## Đưa lên web

Chép nguyên thư mục lên bất kỳ hosting web tĩnh nào (GitHub Pages, Netlify, Vercel, Cloudflare Pages…). Không cần server riêng hay cơ sở dữ liệu. Three.js và phông chữ Baloo 2 được tải từ CDN (jsdelivr, Google Fonts), nên máy chơi cần có mạng.

### Đưa lên Vercel

Không cần build. Trong thư mục này:

```bash
npm i -g vercel
vercel login
vercel --prod
```

Lần đầu Vercel hỏi vài câu: chọn tạo dự án mới, thư mục là `./`, không đổi cấu hình (không có build command).
Muốn tự deploy mỗi lần sửa code: đưa thư mục lên GitHub rồi import repo ở vercel.com (Framework Preset: Other).

## Cấu trúc

- `index.html` — khung trang, bản đồ import của Three.js.
- `app.js` — điều hướng: `#` là trang chọn game, `#banh-kem`, `#lam-toc`… là từng game.
- `games.js` — danh sách game hiện trên trang chọn.
- `hub/` — trang chọn game (vòng quay 3D).
- `kit/` — phần dùng chung cho mọi game:
  - `audio.js` âm thanh, nhạc nền, giọng đọc tiếng Việt (tạo bằng Web Audio, không cần file âm thanh)
  - `fx.js` hạt lấp lánh, tim, bong bóng, pháo giấy
  - `store.js` lưu tiến trình trên trình duyệt
  - `ui.js` nút, hộp thoại, chọn màn, kết quả sao, hộp quà thăng cấp, bàn tay gợi ý
  - `three-kit.js` sân khấu 3D, vật liệu hoạt hình, búp bê chibi dùng chung
  - `kit.css` màu sắc (có chế độ tối) và kiểu dáng chung

## Thêm một game mới

1. Tạo thư mục `games/<ten-game>/` với `index.js`:
   ```js
   export default {
     mount(root, ctx) { /* vẽ giao diện vào root; ctx.goHub() để quay về trang chọn game */ },
     unmount() { /* dọn dẹp: stage.dispose(), gỡ sự kiện, xoá hẹn giờ */ },
   };
   ```
2. Tạo `games/<ten-game>/style.css`, mọi quy tắc bắt đầu bằng `.g-<ten-game>`.
3. Thêm một dòng vào `games.js` (tên, mô tả, màu), rồi thêm mô hình 3D cho game đó trong `hub/models.js`.
4. Lưu sao bằng `Store.game('<ten-game>', { stars: {} })` với `stars[số màn] = 1..3` để trang chọn game cộng tổng sao.

## Dành cho bố mẹ

Trên trang chọn game, giữ nút bánh răng khoảng 1 giây để mở cài đặt (xoá tiến trình). Giọng đọc tiếng Việt chỉ có khi thiết bị có sẵn giọng tiếng Việt (iPhone/iPad và Android thường có).

## Bé Nấu Ăn — nội dung giáo dục

Toàn bộ món ăn, các bước, ai làm (bé / ba mẹ / làm cùng), mẹo, điều bé học được, câu đố và nhiệm vụ ở nhà nằm trong
`games/nau-an/data.js`. Muốn sửa lời hướng dẫn hay thêm mẹo thì chỉ cần sửa file này. Phần hình 3D và thao tác của từng
món nằm trong `recipes-a.js`, `recipes-b.js`, `recipes-c.js` và `family.js` (mâm cơm gia đình).

Chạy thử tự động: mở trang với `?natest` (ví dụ `http://localhost:8765/?natest#nau-an`) để có `window.__na` dùng cho kiểm thử.
