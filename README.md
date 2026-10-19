# Hoa Linh

Phòng livestream avatar 2D. Ảnh bán thân đã tách nền. Chat tiếng Việt, giọng nói, lớp trong suốt cho OBS.

## Chạy

Node 22. `npm run dev` mở phòng điều khiển.

Python dùng một lần cho tách nền: 3.11, Pillow, numpy, opencv-python, rembg 2.0 (session `isnet-anime`). Không cần GPU.

## OBS

1. Thêm Browser Source.
2. URL là trang app kèm `?overlay=1`.
3. Nền trong suốt. Bật "Control audio via OBS".
4. Phím Esc hoặc nút Dừng khẩn: im tiếng, xóa hàng, về nghỉ.

Chi tiết và phần chưa làm nằm trong NOTES.md.
