# HATECO Sports Day 2026 – Website v2

Nguồn dữ liệu: Google Sheet `HATECO_Sports_Day_2026_Data_Web_v7`, sheet `05_Ket_qua`.

## Engine v2
- Bóng bàn: tính BO5 từ điểm từng set; BXH theo số trận thắng → đối đầu trực tiếp → hiệu số set → hiệu số điểm.
- Pickleball: số trận thắng → đối đầu trực tiếp → hiệu số điểm → tổng điểm thắng.
- Nhì xuất sắc: với bảng 4 người/đội, bỏ kết quả gặp hạng 4 trước khi so sánh chéo.
- Tự resolve Nhất bảng / Nhì xuất sắc / người thắng trận trước vào vòng sau.
- 100m nam: tự chọn Top 4 vòng loại và resolve tên vào Chung kết.
- 100m nữ và tiếp sức: Top 3 trực tiếp theo thời gian.
- Bảng huy chương được tính trực tiếp từ kết quả, không phụ thuộc công thức BXH Excel cũ.

## Đưa lên GitHub Pages
1. Tạo repository mới, ví dụ `hateco-sports-day-2026`.
2. Upload toàn bộ 3 file `index.html`, `styles.css`, `app.js` ở thư mục gốc.
3. Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.
4. GitHub sẽ tạo link dạng `https://<username>.github.io/hateco-sports-day-2026/`.

BTC tiếp tục chỉ nhập kết quả tại `05_Ket_qua`.
