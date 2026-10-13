# Birthday Interactive Website (Blowing Candles & Surprise Card)

Dự án website sinh nhật tương tác cao cấp, được thiết kế theo phong cách hiện đại (Midnight Velvet & Champagne Gold), chạy 100% bằng HTML, CSS và JavaScript tĩnh, tối ưu hoàn hảo cho cả máy tính và điện thoại di động (iPhone / Android), sẵn sàng triển khai miễn phí lên **GitHub Pages**.

---

## Luồng trải nghiệm đặc biệt (User Flow)

1. **Màn 1: Thổi nến ước nguyện (`index.html`)**
   - Không gian phòng tối lung linh, ấm áp với chiếc bánh kem và các ngọn nến đang cháy nhấp nháy.
   - **Tương tác 1 - Micro thật (Web Audio API):** Bật micro và thổi vào mic điện thoại. Thanh đo âm lượng hiển thị tín hiệu trực tiếp.
   - **Tương tác 2 - Chạm giữ (Pointer Events):** Nút dự phòng cho điện thoại/máy tính không có hoặc từ chối cấp quyền mic. Chạm giữ 1.6 giây để nến tắt.
   - **KHOẢNH KHẮC BÙNG NỔ (THE CLIMAX):**
     - Nến tắt, khói mảnh bay lên từ bấc nến.
     - **ĐÈN BỪNG SÁNG:** Toàn bộ căn phòng bừng sáng rực rỡ với ánh sáng ấm áp.
     - **Pháo giấy Confetti** bung nở ngập tràn màn hình.
     - **Nhạc Happy Birthday** tự động cất lên.
     - Sau 3 giây thưởng thức, website tự động chuyển tiếp mượt mà sang màn chúc mừng!

2. **Màn 2: Trang chúc mừng & Bức thư sinh nhật (`birthday.html`)**
   - Bảng màu **Midnight Velvet & Warm Champagne Gold** sang trọng, hiện đại, không bị "sến" như các mẫu cũ.
   - Chữ Happy Birthday nhảy múa nghệ thuật kết hợp chiếc mũ sinh nhật.
   - Khung ảnh đại diện với vòng xoay chữ dạ quang và bóng bay bay bồng bềnh.
   - Nút mở thư với hiệu ứng dải sáng (shimmer).
   - Popup phong bì thư mở ra bức thư viết tay hiệu ứng gõ từng chữ kèm gif dễ thương.
   - Nút bật/tắt nhạc nền (🎵) xoay tròn theo điệu nhạc ở góc phải.

---

## Hướng dẫn tùy chỉnh thông tin trong `config.js`

Bạn chỉ cần mở file [config.js](file:///c:/Users/ADMIN/OneDrive%20-%20VNU-HCMUS/Desktop/HTML/Bcha/config.js) để thay đổi:
- `recipientName`: Tên người nhận 
- `birthDate`: Ngày tháng năm sinh
- `letterTitle`: Tiêu đề lá thư.
- `letterContent`: Nội dung lời chúc sinh nhật.
- `sounds`: Danh sách bài hát trong thư mục `sound/`.
- Để đổi ảnh người nhận: Thay thế ảnh trong `images/image.jpg`.

---

## Hướng dẫn chạy thử và đưa lên GitHub Pages

### 1. Xem thử trên máy tính
- Mở trực tiếp file `index.html` bằng trình duyệt (Chrome, Edge, Safari, Firefox).
- Hoặc dùng tiện ích **Live Server** trên VS Code.

### 2. Đưa lên GitHub Pages (Miễn phí 100%)
1. Đăng nhập GitHub và tạo một Repository mới (ví dụ: `birthday-cake`).
2. Tải toàn bộ các file trong thư mục này lên repository.
3. Vào tab **Settings** của repository -> Chọn mục **Pages** ở menu bên trái.
4. Ở mục **Source**, chọn nhánh `main` (hoặc `master`), thư mục `/ (root)` và nhấn **Save**.
5. Đợi 1 - 2 phút, GitHub sẽ cung cấp link dạng: `https://<ten-user>.github.io/<ten-repo>/`.
6. Gửi link này cho người nhận mở trên điện thoại (GitHub Pages có sẵn HTTPS nên micro sẽ hoạt động trơn tru!).
