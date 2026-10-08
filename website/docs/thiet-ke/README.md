# Bản sao thiết kế giao diện ThợTới

Bản gốc: https://claude.ai/artifact/RNC9zKN5WvC7ssKZUguJ3z (canvas "Giao diện web Sửa xe lưu động").
Sao chép ngày 08/10/2026 để các phiên code đọc được khi không mở được link. Bản gốc thay đổi thì sao chép lại.

- `canvas.json`: danh sách màn hình, tiêu đề, mã yêu cầu (FR-xx) và ghi chú dữ liệu mẫu.
- `*.dc.html`: mỗi file là một màn hình. Bố cục và style nằm trong thẻ `<x-dc>` (style viết inline);
  dữ liệu mẫu và hành vi tương tác nằm trong khối `<script type="text/x-dc">` ở cuối file (`renderVals()`, `this.state`).
- Màn điện thoại rộng 390px; `TrangChuMayTinh` và các màn `Qt*` (quản trị) là trang máy tính co giãn.

Mọi số liệu trong thiết kế là **dữ liệu mẫu** (hotline 1900 1068, giá, pháp nhân, MST, tên thợ, biển số, đánh giá khách):
phải thay bằng số liệu thật trước khi lên web. Đánh giá khách chỉ được dùng đánh giá thật.
