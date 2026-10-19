# NOTES

## Đã làm

- Cổng 1: tách nền `character model.png` (932×1688) bằng rembg session `isnet-anime`. Không xóa pixel trắng theo màu.
- Cắt bán thân tới y=980 (gốc), bỏ mảnh alpha rời nhỏ hơn 1800 px. Cánh hoa trong tay được giữ.
- Xuất `public/avatar/avatar_source.png` 871×938. Ba ảnh ghép: nền tối, xám, hồng.
- Mặt không có lỗ thủng nhìn thấy. Viền khói xám mỏng còn ở vài dải ruy-băng/tóc khi nền tối.
- Chiều rộng mắt ước lượng khoảng 45 px trên ảnh bán thân (đủ ngưỡng ~40). Không upscale. Không có bộ upscale anime trong môi trường này.
- App: chat Grok (`grok-4.5`) → JSON cảm xúc/cử chỉ/nhìn, zod + lọc, thử lại một lần, câu dự phòng.
- TTS xAI `luna`, `language: vi` (tài liệu Voice API có mã `vi`). Biên độ RMS → miệng, attack nhanh hơn release, chặn trong `src/avatar/limits.ts`.
- Dự phòng: `speechSynthesis` tiếng Việt, miệng giả, ghi rõ trên log.
- Duyệt tay, dừng khẩn (nút + Esc), hàng đợi 3, `?overlay=1` nền trong suốt.
- Não không phải Gemini: môi trường không cho file `.env`. Key dùng là xAI gắn sẵn, chỉ trên server.

## Không phải rig Mesh Avatar Studio

Các tên `swayDeg`, `bobPx`, `shiftXPx`, `mouth` là kênh chuyển động cứng tạm. Không có trong `rig.json`. Không bẻ mesh, không scale không đều, không vẽ mí mắt giả.

Chưa đọc được tham số thật từ `docs/rig-fields.md` trên một rig của ảnh này, vì cổng 2 chưa chạy. Gesture/gaze/emotion thiếu lớp rig thì chỉ cộng một độ lệch nhỏ trong các kênh trên, hoặc bỏ qua (không warp).

## Chưa làm

- Cổng 2: Mesh Avatar Studio, drawn variants mắt/miệng, contact sheet pose test.
- Cổng 3: so Piper `vi_VN` và VieNeu-TTS. Giọng đang dùng là Luna, chưa chấm RTF với bộ câu thử.
- Nguồn chat YouTube/Twitch.
- Checklist trang phục nền tảng: chưa xác minh trang chính thức trong lượt này.
- Twitch có bắt buộc khai báo AI hay không: chưa xác minh.
- YouTube: khai báo nội dung chỉnh sửa/tổng hợp khi cảnh trông thật. Hoạt hình không nằm trong diện bắt buộc theo YouTube Help (altered or synthetic content) và cập nhật tháng 5/2026. Không áp cho ảnh anime này trừ khi bị trình bày như người thật.
- Quyền sử dụng ảnh nhân vật: chưa xác minh. Ảnh do phiên chia sẻ cung cấp.
