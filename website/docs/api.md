# Hợp đồng API backend ThợTới

Tài liệu cho phiên frontend và đội VCsoft (phần mềm điều phối). Phạm vi: **P0** (danh mục, bảng giá, vùng phục vụ,
giờ nhận đơn, đơn đặt lịch, gọi gấp, mục 1–5), **P1** (phục vụ khách: thợ, báo giá, VietQR, hoá đơn, bảo hành, đánh giá,
tra cứu xe, ZNS — mục 6; quản trị: bài viết, trang khu vực, mã khuyến mãi, số liệu — mục 7) và **P2** (hội viên, giới thiệu
bạn bè, doanh nghiệp, tuyển thợ — mục 8).

**Mọi ví dụ request/response dưới đây chạy ra từ server thật** bằng `node scripts/vi-du-api.mjs` (dữ liệu mẫu của
`npm run nap-du-lieu`, tích hợp ngoài chạy giả lập). Mảng dài được rút gọn thành 2 phần tử đầu + `"… (còn N mục)"`.
Chạy lại script sau khi đổi API: `BASE_URL=http://localhost:3000 node scripts/vi-du-api.mjs`.

## Quy ước chung

- Gốc: `/api`. Body và kết quả là JSON UTF-8. Tiền luôn là **số nguyên đồng (VND)**; trường `...HienThi` / `hienThi` là chữ
  đã định dạng sẵn ("1.250.000đ", "Miễn phí", "1,55 – 2,2 triệu") để giao diện in thẳng.
- Ngày giờ lưu theo ISO 8601 (UTC). Ngày đặt lịch `YYYY-MM-DD` tính theo giờ Việt Nam.
- **Lỗi** luôn có dạng `{ "loi": "<câu tiếng Việt cho khách>", "ma": "<MÃ_LỖI>", ...chiTiet }`.
  Lỗi theo từng ô của form nằm trong `truong`: `{ "khach.sdt": "Số điện thoại chưa đúng…" }`. Hiện câu `loi` cho khách,
  dùng `ma` để rẽ nhánh giao diện.

| HTTP | `ma` thường gặp | Ý nghĩa |
|---|---|---|
| 400 | `DU_LIEU_SAI`, `BODY_SAI`, `DICH_VU_KHONG_CO`, `XE_KHONG_CO`, `TOA_DO_SAI`, `THIEU_VI_TRI`, `TRANG_THAI_SAI` | Dữ liệu gửi lên sai |
| 401 / 403 | `CHUA_DANG_NHAP`, `KHONG_CO_QUYEN` | Chưa đăng nhập / vai trò không được làm |
| 404 | `KHONG_TIM_THAY`, `LINK_SAI`, `KHONG_CO_DON` | Không có trang, link sai |
| 409 | `KHUNG_DAY`, `KHUNG_DA_QUA`, `NGAY_NGHI`, `KHUNG_KHONG_CO`, `DICH_VU_TAM_NGUNG`, `NGOAI_GIO_NHAN_GAP`, `KHONG_DOI_DUOC` | Không làm được lúc này |
| 410 | `LINK_HET_HAN` | Link riêng của khách đã hết hạn (24 giờ sau khi đơn xong) |
| 413 | `TEP_QUA_LON` | Ảnh/video quá lớn |
| 422 | `NGOAI_VUNG`, `KHONG_TIM_THAY_DIA_CHI` | Vị trí ngoài vùng phục vụ / không tìm được địa chỉ |
| 429 | `QUA_NHIEU_LAN` | Vượt giới hạn tần suất |
| 502 / 503 | `BAN_DO_LOI`, `BAN_DO_CHUA_CAU_HINH` | Dịch vụ bản đồ lỗi / chưa cấu hình (production) |
| 500 | `LOI_MAY_CHU` | Lỗi lạ, đã ghi log |

- **Giới hạn tần suất** (theo IP, trong bộ nhớ một máy chủ): đọc công khai 600 lần/5 phút; kiểm tra vùng 30 lần/5 phút
  (mỗi lần gọi bản đồ tốn tiền); tạo đơn 5 đơn/10 phút mỗi IP và 3 đơn/30 phút mỗi số điện thoại; link theo dõi 120 lần/10 phút.
- **Chống bot**: form gửi kèm ô ẩn `website` (luôn để trống). Có giá trị thì server trả 201 nhưng không lưu gì.
- **Đăng nhập** (màn quản trị, điều phối): dùng phiên Payload. Trình duyệt: cookie `payload-token` sau khi đăng nhập ở
  `/admin` hoặc `POST /api/users/login`. Máy với máy: header `Authorization: users API-Key <khoá>` (bật "Enable API Key"
  trong tài khoản), hoặc `Authorization: JWT <token>`.
- **Vai trò**: `quanTri`, `quanLyDichVu`, `bienTap` (VCmedia), `marketing`, `dieuPhoi`. Bảng quyền ở cuối tài liệu.

## Trang công khai đọc phía server (không qua HTTP)

Trang trong `app/(frontend)/` nên gọi thẳng các hàm trong `lib/cong-khai.ts` (Local API, nhanh hơn, không tính giới hạn tần suất).
Mỗi endpoint `/api/trang/...` dưới đây chỉ bọc đúng một hàm:

| Endpoint | Hàm trong `lib/cong-khai.ts` | Màn hình |
|---|---|---|
| `GET /api/trang/chung` | `layCauHinhChung(payload)` | header, footer, liên hệ, pháp nhân |
| `GET /api/trang/chu` | `layTrangChu(payload)` | `Main`, `TrangChuMayTinh` |
| `GET /api/trang/bang-gia?phanKhuc=B` | `layBangGia(payload, phanKhuc)` | `BangGia` |
| `GET /api/trang/dich-vu/:slug` | `layTrangDichVu(payload, slug, { draft })` | `DichVu` |
| `GET /api/trang/khu-vuc/:dichVu/:quan` | `layTrangKhuVuc(payload, dichVu, quan)` | `KhuVuc` |
| `GET /api/trang/hang-xe/:hang` | `layTrangHangXe(payload, hang)` | `HangXe` |
| `GET /api/trang/xe-dien` | `layTrangXeDien(payload)` | `XeDien` |
| `GET /api/trang/dat-lich` | `layTrangDatLich(payload)` | `DatLich` |
| `GET /api/trang/goi-gap` | `layTrangGoiGap(payload)` | `GoiGap` |
| `GET /api/trang/danh-gia?quan=&dichVu=&gioiHan=` | `layDanhGia(payload, {...})` | khối đánh giá |
| `GET /api/xe?hang=&xeDien=1` | `layDanhMucXe(payload, {...})` | chọn hãng, dòng, đời |
| `GET /api/lich-dat/khung-gio?tuNgay=&soNgay=` | `layKhungGio(payload, {...})` | chọn ngày giờ |
| `POST /api/bao-gia-so-bo` | `tinhBaoGiaSoBo(payload, {...})` | giá sơ bộ |
| `POST /api/vung-phuc-vu/kiem-tra` | `kiemTraVung(payload, {...})` | kiểm tra vị trí |

Lấy `payload` trong trang server: `import { layPayload } from "@/lib/cms"` (hoặc `getPayload({ config })`).
Nội dung bài (`trang.noiDung`) là JSON của trình soạn thảo Lexical: đổi ra HTML bằng `sangHtml()` trong `lib/cms.js`.

---

## 1. Dùng chung

### `GET /api/trang/chung`
Ai gọi: công khai. Thương hiệu, liên hệ, pháp nhân, điểm Google, cam kết (bảo hành, 60 phút), phí, quận đang phục vụ.

<!-- vi-du:chung -->
Request:
```http
GET /api/trang/chung
```
Response `200`:
```json
{
  "thuongHieu": {
    "ten": "ThợTới",
    "dongPhu": "by VC Phồn Vinh",
    "slogan": "Xe dừng đâu, thợ tới đó",
    "thanhPho": "Hà Nội",
    "congTyMe": "VC Phồn Vinh"
  },
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  },
  "phapNhan": {
    "ten": "Công ty TNHH ThợTới (MẪU)",
    "mst": "0109876543",
    "diaChi": "18 Trần Thái Tông, Cầu Giấy, Hà Nội",
    "daThongBaoBoCongThuong": false
  },
  "google": {
    "diem": 4.9,
    "soDanhGia": 128,
    "linkDanhGia": "https://g.page/r/MAU/review"
  },
  "camKet": {
    "cuuHoPhut": 60,
    "baoHanhPhuTungThang": 6,
    "baoHanhCongThang": 3,
    "coVanGoiLaiPhut": 15
  },
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "vungPhucVu": {
    "quan": [
      {
        "ten": "Cầu Giấy",
        "slug": "cau-giay",
        "etaTu": 25,
        "etaDen": 40
      },
      {
        "ten": "Đống Đa",
        "slug": "dong-da",
        "etaTu": 30,
        "etaDen": 45
      },
      "… (còn 2 mục)"
    ],
    "tenCacQuan": "Cầu Giấy, Đống Đa, Thanh Xuân, Ba Đình"
  }
}
```
<!-- /vi-du -->

### `GET /api/trang/chu`
Ai gọi: công khai. Như `/trang/chung` + dịch vụ (kèm `giaCongTu`), bảng giá nhanh (`giaNhanh`: phí đi lại + hạng mục
đánh dấu "nổi bật"), 3 đánh giá mới nhất. Quy trình 4 bước và chữ tĩnh khác do giao diện tự viết.

<!-- vi-du:chu -->
Request:
```http
GET /api/trang/chu
```
Response `200`:
```json
{
  "thuongHieu": {
    "ten": "ThợTới",
    "dongPhu": "by VC Phồn Vinh",
    "slogan": "Xe dừng đâu, thợ tới đó",
    "thanhPho": "Hà Nội",
    "congTyMe": "VC Phồn Vinh"
  },
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  },
  "phapNhan": {
    "ten": "Công ty TNHH ThợTới (MẪU)",
    "mst": "0109876543",
    "diaChi": "18 Trần Thái Tông, Cầu Giấy, Hà Nội",
    "daThongBaoBoCongThuong": false
  },
  "google": {
    "diem": 4.9,
    "soDanhGia": 128,
    "linkDanhGia": "https://g.page/r/MAU/review"
  },
  "camKet": {
    "cuuHoPhut": 60,
    "baoHanhPhuTungThang": 6,
    "baoHanhCongThang": 3,
    "coVanGoiLaiPhut": 15
  },
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "vungPhucVu": {
    "quan": [
      {
        "ten": "Cầu Giấy",
        "slug": "cau-giay",
        "etaTu": 25,
        "etaDen": 40
      },
      {
        "ten": "Đống Đa",
        "slug": "dong-da",
        "etaTu": 30,
        "etaDen": 45
      },
      "… (còn 2 mục)"
    ],
    "tenCacQuan": "Cầu Giấy, Đống Đa, Thanh Xuân, Ba Đình"
  },
  "dichVu": [
    {
      "id": 1,
      "ma": "BD",
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky",
      "moTaNgan": "Thay dầu, lọc, kiểm tra 30 hạng mục",
      "ghiChuBangGia": "Dầu theo đúng tiêu chuẩn hãng. Thợ ghi số km và nhắc lần bảo dưỡng sau qua Zalo.",
      "nutKeuGoi": "Đặt lịch bảo dưỡng",
      "thoiGianLam": "60–90 phút",
      "thuTu": 1,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 350000,
      "giaCongTuHienThi": "350.000đ"
    },
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 150000,
      "giaCongTuHienThi": "150.000đ"
    },
    "… (còn 4 mục)"
  ],
  "giaNhanh": [
    {
      "ten": "Phí đi lại nội thành",
      "giaHienThi": "50.000đ",
      "gia": 50000
    },
    {
      "ten": "Bảo dưỡng cấp nhỏ (công)",
      "giaHienThi": "350.000đ",
      "gia": 350000
    },
    "… (còn 4 mục)"
  ],
  "danhGia": [
    {
      "noiDung": "Xe chết máy dưới hầm B2 lúc 7 giờ sáng, 35 phút sau thợ tới, thay ắc quy xong kịp đi làm. Giá đúng như trên web.",
      "tenHienThi": "Anh T.",
      "soSao": 5,
      "ngay": "2027-02-12T00:00:00.000Z",
      "quan": {
        "ten": "Cầu Giấy",
        "slug": "cau-giay"
      },
      "phuong": "Yên Hòa",
      "dichVu": {
        "ten": "Ắc quy",
        "slug": "ac-quy"
      },
      "nguon": "google"
    },
    {
      "noiDung": "Thợ gửi báo giá từng món qua điện thoại, mình bỏ bớt hạng mục chưa cần. Rõ ràng, không bị ép.",
      "tenHienThi": "Chị H.",
      "soSao": 5,
      "ngay": "2027-02-05T00:00:00.000Z",
      "quan": {
        "ten": "Đống Đa",
        "slug": "dong-da"
      },
      "phuong": null,
      "dichVu": {
        "ten": "Phanh",
        "slug": "phanh"
      },
      "nguon": "google"
    },
    "… (còn 1 mục)"
  ]
}
```
<!-- /vi-du -->

## 2. Danh mục, bảng giá

### `GET /api/trang/bang-gia?phanKhuc=A|B|C|D`
Ai gọi: công khai. Mọi dịch vụ hiện trên bảng giá, từng hạng mục có `gia` (theo `phanKhuc` nếu truyền, không thì khoảng A–D),
`giaTheoPhanKhuc` đủ 4 phân khúc (chỉ phụ tùng) để đổi phân khúc không cần gọi lại, `capNhatLuc` (lần đổi giá gần nhất),
mô tả 4 phân khúc, phí đi lại, phí kiểm tra. `goiHoiVien` để trống tới P2.

<!-- vi-du:bang-gia -->
Request:
```http
GET /api/trang/bang-gia?phanKhuc=B
```
Response `200`:
```json
{
  "capNhatLuc": "2026-10-08T11:54:07.115Z",
  "phanKhucDangChon": "B",
  "phanKhuc": [
    {
      "ma": "A",
      "tenNgan": "Xe nhỏ",
      "moTa": "Xe cỡ nhỏ (i10, Morning, Fadil, VF 3)"
    },
    {
      "ma": "B",
      "tenNgan": "Sedan B",
      "moTa": "Sedan, hatchback hạng B (Vios, Accent, City, Mazda2)"
    },
    "… (còn 2 mục)"
  ],
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "baoHanh": {
    "phuTungThang": 6,
    "congThang": 3
  },
  "dichVu": [
    {
      "id": 1,
      "ma": "BD",
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky",
      "moTaNgan": "Thay dầu, lọc, kiểm tra 30 hạng mục",
      "ghiChuBangGia": "Dầu theo đúng tiêu chuẩn hãng. Thợ ghi số km và nhắc lần bảo dưỡng sau qua Zalo.",
      "nutKeuGoi": "Đặt lịch bảo dưỡng",
      "thoiGianLam": "60–90 phút",
      "thuTu": 1,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 350000,
      "tomTat": "Tiền công từ 350.000đ · 4 hạng mục",
      "hangMuc": [
        {
          "id": 1,
          "ten": "Bảo dưỡng cấp nhỏ (công, kiểm tra 30 hạng mục)",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 350000,
            "den": 350000
          },
          "giaHienThi": "350.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.018Z"
        },
        {
          "id": 2,
          "ten": "Bảo dưỡng cấp lớn (công)",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 650000,
            "den": 650000
          },
          "giaHienThi": "650.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.039Z"
        },
        "… (còn 2 mục)"
      ]
    },
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 150000,
      "tomTat": "Tiền công từ 150.000đ · 4 hạng mục",
      "hangMuc": [
        {
          "id": 5,
          "ten": "Đo kiểm tra ắc quy và máy phát",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 0,
            "den": 0
          },
          "giaHienThi": "Miễn phí",
          "mienPhi": true,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.095Z"
        },
        {
          "id": 6,
          "ten": "Kích nổ tại chỗ",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 150000,
            "den": 150000
          },
          "giaHienThi": "150.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:54:07.115Z"
        },
        "… (còn 2 mục)"
      ]
    },
    "… (còn 4 mục)"
  ],
  "goiHoiVien": []
}
```
<!-- /vi-du -->

### `GET /api/trang/dich-vu/:slug`
Ai gọi: công khai. Đủ cho màn `DichVu`: thông tin dịch vụ, bảng giá (khoảng A–D), nội dung trang đã đăng (`trang`, có thể `null`
nếu chưa đăng bài), FAQ, quận phục vụ (link "theo quận"), đánh giá của dịch vụ, dịch vụ khác. 404 nếu không có dịch vụ.
"Xem giá cho xe của bạn" dùng `POST /api/bao-gia-so-bo`.

<!-- vi-du:dich-vu -->
Request:
```http
GET /api/trang/dich-vu/ac-quy
```
Response `200`:
```json
{
  "dichVu": {
    "id": 2,
    "ma": "AQ",
    "ten": "Ắc quy",
    "slug": "ac-quy",
    "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
    "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
    "nutKeuGoi": "Gọi thợ thay ắc quy",
    "thoiGianLam": "20–30 phút",
    "thuTu": 2,
    "nhanDatLich": true,
    "baoGiaSoBo": true,
    "hienTrenBangGia": true,
    "giaCongTu": 150000
  },
  "bangGia": [
    {
      "id": 5,
      "ten": "Đo kiểm tra ắc quy và máy phát",
      "loai": "cong",
      "loaiNhan": "Tiền công",
      "gia": {
        "tu": 0,
        "den": 0
      },
      "giaHienThi": "Miễn phí",
      "mienPhi": true,
      "donVi": null,
      "ghiChu": null,
      "giaTheoPhanKhuc": null,
      "capNhatGiaLuc": "2026-10-08T11:11:11.095Z"
    },
    {
      "id": 6,
      "ten": "Kích nổ tại chỗ",
      "loai": "cong",
      "loaiNhan": "Tiền công",
      "gia": {
        "tu": 150000,
        "den": 150000
      },
      "giaHienThi": "150.000đ",
      "mienPhi": false,
      "donVi": null,
      "ghiChu": null,
      "giaTheoPhanKhuc": null,
      "capNhatGiaLuc": "2026-10-08T11:54:07.115Z"
    },
    "… (còn 2 mục)"
  ],
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "camKet": {
    "cuuHoPhut": 60,
    "baoHanhPhuTungThang": 6,
    "baoHanhCongThang": 3,
    "coVanGoiLaiPhut": 15
  },
  "trang": {
    "title": "Thay ắc quy ô tô tận nơi, kích nổ câu bình tại Hà Nội",
    "description": "Xe không nổ máy vì hết điện? Thợ tới kích nổ, đo kiểm tra và thay ắc quy đúng loại cho xe. Báo giá trước khi làm. Gọi ThợTới ngay.",
    "ten": "Thay ắc quy",
    "tomTat": "Kích nổ, kiểm tra và thay ắc quy đúng loại ngay tại nơi xe dừng.",
    "faq": [
      {
        "id": "6ac77a4d1b2df71b91e30e08",
        "q": "Xe không nổ máy có phải chắc chắn do ắc quy không?",
        "a": "Không hẳn. Ắc quy yếu là nguyên nhân phổ biến, nhưng củ đề, máy phát hay dây cáp lỏng cũng có thể gây ra. Thợ sẽ đo ắc quy và hệ thống sạc để tìm đúng nguyên nhân trước khi thay."
      },
      {
        "id": "6ac77a4d1b2df71b91e30e09",
        "q": "Tôi có nên tự câu bình bằng dây mồi không?",
        "a": "Chúng tôi khuyên bạn nên để thợ làm. Câu sai cực hoặc câu vào bình bị phồng, rò có thể gây chập điện, hỏng thiết bị điện tử hoặc nguy hiểm cho người."
      },
      "… (còn 2 mục)"
    ],
    "noiDung": "(nội dung Lexical JSON, rút gọn)",
    "capNhat": "2026-10-08T11:11:10.325Z"
  },
  "quan": [
    {
      "ten": "Cầu Giấy",
      "slug": "cau-giay",
      "etaTu": 25,
      "etaDen": 40
    },
    {
      "ten": "Đống Đa",
      "slug": "dong-da",
      "etaTu": 30,
      "etaDen": 45
    },
    "… (còn 2 mục)"
  ],
  "danhGia": [
    {
      "noiDung": "Xe chết máy dưới hầm B2 lúc 7 giờ sáng, 35 phút sau thợ tới, thay ắc quy xong kịp đi làm. Giá đúng như trên web.",
      "tenHienThi": "Anh T.",
      "soSao": 5,
      "ngay": "2027-02-12T00:00:00.000Z",
      "quan": {
        "ten": "Cầu Giấy",
        "slug": "cau-giay"
      },
      "phuong": "Yên Hòa",
      "dichVu": {
        "ten": "Ắc quy",
        "slug": "ac-quy"
      },
      "nguon": "google"
    }
  ],
  "dichVuKhac": [
    {
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky",
      "ma": "BD"
    },
    {
      "ten": "Lốp",
      "slug": "lop",
      "ma": "L"
    },
    "… (còn 3 mục)"
  ],
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  }
}
```
<!-- /vi-du -->

### `GET /api/trang/khu-vuc/:dichVu/:quan`
Ai gọi: công khai. Màn `KhuVuc`: thời gian thợ tới quận, phường đang phục vụ, giá (cùng bảng giá chung), đánh giá ở quận,
dịch vụ khác. `noiDung` (tiêu đề, mô tả, `html`, `doanRieng`, `anhThat`, `faq`) lấy từ trang khu vực đã đăng (mục 7), chưa có trang thì `null`. 404 nếu quận chưa phục vụ.

<!-- vi-du:khu-vuc -->
Request:
```http
GET /api/trang/khu-vuc/ac-quy/cau-giay
```
Response `200`:
```json
{
  "dichVu": {
    "ten": "Ắc quy",
    "slug": "ac-quy",
    "ma": "AQ",
    "moTaNgan": "Kích nổ, đo, thay mới tại chỗ"
  },
  "quan": {
    "ten": "Cầu Giấy",
    "slug": "cau-giay",
    "etaTu": 25,
    "etaDen": 40,
    "ghiChu": "Dữ liệu mẫu: đo lại thời gian tới thực tế."
  },
  "phuongDangPhucVu": [
    "Dịch Vọng",
    "Dịch Vọng Hậu",
    "… (còn 6 mục)"
  ],
  "bangGia": [
    {
      "ten": "Phí đi lại",
      "loai": "phi",
      "giaHienThi": "50.000đ",
      "gia": {
        "tu": 50000,
        "den": 50000
      }
    },
    {
      "id": 5,
      "ten": "Đo kiểm tra ắc quy và máy phát",
      "loai": "cong",
      "loaiNhan": "Tiền công",
      "gia": {
        "tu": 0,
        "den": 0
      },
      "giaHienThi": "Miễn phí",
      "mienPhi": true,
      "donVi": null,
      "ghiChu": null,
      "giaTheoPhanKhuc": null,
      "capNhatGiaLuc": "2026-10-08T11:11:11.095Z"
    },
    "… (còn 3 mục)"
  ],
  "danhGia": [
    {
      "noiDung": "Xe chết máy dưới hầm B2 lúc 7 giờ sáng, 35 phút sau thợ tới, thay ắc quy xong kịp đi làm. Giá đúng như trên web.",
      "tenHienThi": "Anh T.",
      "soSao": 5,
      "ngay": "2027-02-12T00:00:00.000Z",
      "quan": {
        "ten": "Cầu Giấy",
        "slug": "cau-giay"
      },
      "phuong": "Yên Hòa",
      "dichVu": {
        "ten": "Ắc quy",
        "slug": "ac-quy"
      },
      "nguon": "google"
    }
  ],
  "dichVuKhac": [
    {
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky"
    },
    {
      "ten": "Lốp",
      "slug": "lop"
    },
    "… (còn 3 mục)"
  ],
  "noiDung": null,
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  }
}
```
<!-- /vi-du -->

### `GET /api/trang/hang-xe/:hang` và `GET /api/trang/xe-dien`
Ai gọi: công khai. `HangXe`: danh sách hãng, các dòng của hãng (phân khúc, đời từ–đến), bảng giá đủ 4 phân khúc
(`bangGia[].hangMuc[].giaTheoPhanKhuc`: giao diện lấy theo phân khúc của dòng đang chọn). Gợi ý nhóm đời xe (2014–2018…)
do giao diện chia. `noiDung`, `benhHayGap` lấy từ trang hãng xe đã đăng (mục 7), chưa có thì `null`. `XeDien`: các dòng xe điện và 4 nhóm việc (lốp, phanh, ắc quy 12V, điều hoà).

<!-- vi-du:hang-xe -->
Request:
```http
GET /api/trang/hang-xe/toyota
```
Response `200`:
```json
{
  "hangXe": [
    {
      "ten": "Toyota",
      "slug": "toyota",
      "soDong": 13
    },
    {
      "ten": "Hyundai",
      "slug": "hyundai",
      "soDong": 10
    },
    "… (còn 13 mục)"
  ],
  "hang": {
    "id": 1,
    "ten": "Toyota",
    "slug": "toyota",
    "dong": [
      {
        "id": 12,
        "ten": "Avanza",
        "tenDayDu": "Toyota Avanza",
        "slug": "toyota-avanza",
        "phanKhuc": "B",
        "doiTu": 2018,
        "doiDen": 2026,
        "xeDien": false
      },
      {
        "id": 5,
        "ten": "Camry",
        "tenDayDu": "Toyota Camry",
        "slug": "toyota-camry",
        "phanKhuc": "D",
        "doiTu": 2012,
        "doiDen": 2026,
        "xeDien": false
      },
      "… (còn 11 mục)"
    ]
  },
  "phanKhuc": [
    {
      "ma": "A",
      "tenNgan": "Xe nhỏ",
      "moTa": "Xe cỡ nhỏ (i10, Morning, Fadil, VF 3)"
    },
    {
      "ma": "B",
      "tenNgan": "Sedan B",
      "moTa": "Sedan, hatchback hạng B (Vios, Accent, City, Mazda2)"
    },
    "… (còn 2 mục)"
  ],
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "bangGia": [
    {
      "id": 1,
      "ma": "BD",
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky",
      "moTaNgan": "Thay dầu, lọc, kiểm tra 30 hạng mục",
      "ghiChuBangGia": "Dầu theo đúng tiêu chuẩn hãng. Thợ ghi số km và nhắc lần bảo dưỡng sau qua Zalo.",
      "nutKeuGoi": "Đặt lịch bảo dưỡng",
      "thoiGianLam": "60–90 phút",
      "thuTu": 1,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 350000,
      "tomTat": "Tiền công từ 350.000đ · 4 hạng mục",
      "hangMuc": [
        {
          "id": 1,
          "ten": "Bảo dưỡng cấp nhỏ (công, kiểm tra 30 hạng mục)",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 350000,
            "den": 350000
          },
          "giaHienThi": "350.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.018Z"
        },
        {
          "id": 2,
          "ten": "Bảo dưỡng cấp lớn (công)",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 650000,
            "den": 650000
          },
          "giaHienThi": "650.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.039Z"
        },
        "… (còn 2 mục)"
      ]
    },
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "giaCongTu": 150000,
      "tomTat": "Tiền công từ 150.000đ · 4 hạng mục",
      "hangMuc": [
        {
          "id": 5,
          "ten": "Đo kiểm tra ắc quy và máy phát",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 0,
            "den": 0
          },
          "giaHienThi": "Miễn phí",
          "mienPhi": true,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:11:11.095Z"
        },
        {
          "id": 6,
          "ten": "Kích nổ tại chỗ",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 150000,
            "den": 150000
          },
          "giaHienThi": "150.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T11:54:07.115Z"
        },
        "… (còn 2 mục)"
      ]
    },
    "… (còn 4 mục)"
  ],
  "noiDung": null,
  "benhHayGap": []
}
```
<!-- /vi-du -->

### `GET /api/xe?hang=toyota&xeDien=1`
Ai gọi: công khai. Hãng → dòng (`slug`, `phanKhuc`, `doiTu`, `doiDen`, `xeDien`). Dòng `phanKhuc: null` là dòng mới chưa gán.

<!-- vi-du:xe -->
Request:
```http
GET /api/xe?hang=vinfast&xeDien=1
```
Response `200`:
```json
[
  {
    "id": 5,
    "ten": "VinFast",
    "slug": "vinfast",
    "dong": [
      {
        "id": 42,
        "ten": "VF 3",
        "tenDayDu": "VinFast VF 3",
        "slug": "vinfast-vf-3",
        "phanKhuc": "A",
        "doiTu": 2024,
        "doiDen": 2026,
        "xeDien": true
      },
      {
        "id": 43,
        "ten": "VF 5",
        "tenDayDu": "VinFast VF 5",
        "slug": "vinfast-vf-5",
        "phanKhuc": "A",
        "doiTu": 2023,
        "doiDen": 2026,
        "xeDien": true
      },
      "… (còn 5 mục)"
    ]
  }
]
```
<!-- /vi-du -->

### `POST /api/bao-gia-so-bo`
Ai gọi: công khai. Body: `{ "dichVu": ["ac-quy", "lop"], "dongXe": "toyota-vios" }` (`dongXe` là slug hoặc id; hoặc
`"phanKhuc": "B"`; không có xe thì khoảng rộng A–D). Kết quả:
- `trangThai`: `coGia` | `coVanGoiLai` (có dịch vụ tắt báo giá sơ bộ, vd đọc lỗi, cứu hộ) | `chuaChon`.
- `tu`, `den`, `hienThi` ("1,55 – 2,2 triệu"), `ghiChu` (câu dưới khoảng giá), `dong[]` từng dòng (đã gồm phí đi lại, tính một lần).
- Hạng mục "có thể phát sinh" có `coThe: true`, chỉ cộng vào giá cao.

<!-- vi-du:bao-gia -->
Request:
```http
POST /api/bao-gia-so-bo

{
  "dichVu": [
    "ac-quy",
    "lop"
  ],
  "dongXe": "toyota-vios"
}
```
Response `200`:
```json
{
  "trangThai": "coGia",
  "dong": [
    {
      "dichVu": "ac-quy",
      "ten": "Công thay ắc quy",
      "loai": "cong",
      "coThe": false,
      "tu": 150000,
      "den": 150000,
      "hienThi": "150.000đ"
    },
    {
      "dichVu": "ac-quy",
      "ten": "Ắc quy 12V",
      "loai": "phuTung",
      "coThe": false,
      "tu": 1350000,
      "den": 2000000,
      "hienThi": "1.350.000 – 2.000.000đ"
    },
    "… (còn 4 mục)"
  ],
  "tu": 1670000,
  "den": 4370000,
  "phanKhuc": "B",
  "xe": {
    "ten": "Toyota Vios",
    "slug": "toyota-vios",
    "phanKhuc": "B",
    "canGanPhanKhuc": false
  },
  "hienThi": "1,67 – 4,37 triệu",
  "ghiChu": "Đã gồm phí đi lại 50.000đ. Giá chính thức chốt sau khi thợ kiểm tra."
}
```
<!-- /vi-du -->

Lỗi: 400 `DICH_VU_KHONG_CO`, `XE_KHONG_CO`, `QUA_NHIEU_DICH_VU`.

## 3. Vùng phục vụ, giờ nhận đơn

### `POST /api/vung-phuc-vu/kiem-tra`
Ai gọi: công khai. Body: `{ "diaChi": "18 Trần Thái Tông, Cầu Giấy" }` hoặc `{ "lat": 21.03, "lng": 105.79 }` (nút
"Lấy vị trí"). Kết quả: `trongVung`, `lyDo` (`null` | `ngoaiQuan` | `quanChuaPhucVu` | `phuongTamTat`), `quan`, `phuong`,
`eta` `{ tu, den }` phút, `viTri` (toạ độ + địa chỉ bản đồ trả), `thongBao` (câu hiện cho khách).

<!-- vi-du:vung -->
Request:
```http
POST /api/vung-phuc-vu/kiem-tra

{
  "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy"
}
```
Response `200`:
```json
{
  "trongVung": true,
  "lyDo": null,
  "quan": {
    "ten": "Cầu Giấy",
    "slug": "cau-giay",
    "id": 1
  },
  "phuong": {
    "ten": "Dịch Vọng Hậu"
  },
  "eta": {
    "tu": 25,
    "den": 40
  },
  "viTri": {
    "lat": 21.0325,
    "lng": 105.79,
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy, Hà Nội"
  },
  "thongBao": "Trong vùng phục vụ. Thợ tới dự kiến 25–40 phút."
}
```

Ngoài vùng:

Request:
```http
POST /api/vung-phuc-vu/kiem-tra

{
  "lat": 21.04,
  "lng": 105.7
}
```
Response `200`:
```json
{
  "trongVung": false,
  "lyDo": "ngoaiQuan",
  "quan": null,
  "phuong": null,
  "eta": null,
  "viTri": {
    "lat": 21.04,
    "lng": 105.7,
    "diaChi": "Gần An Khánh, Hoài Đức, Hà Nội"
  },
  "thongBao": "Địa chỉ này ngoài vùng phục vụ. Gọi cố vấn để được hướng dẫn, hoặc đặt kéo xe về xưởng Auto Speedy."
}
```
<!-- /vi-du -->

Lỗi: 422 `KHONG_TIM_THAY_DIA_CHI`; 502 `BAN_DO_LOI`; 503 `BAN_DO_CHUA_CAU_HINH`.

### `GET /api/lich-dat/khung-gio?tuNgay=2026-10-09&soNgay=4`
Ai gọi: công khai. Mặc định từ hôm nay, số ngày theo cấu hình (4). Mỗi ngày: `nhan` ("Hôm nay", "T6"…), `ngayThang`,
`nghi`; mỗi khung: `nhan` ("8h – 10h"), `conCho`, `day` (đầy: gạch ngang), `daQua` (đã qua hoặc còn dưới 60 phút),
`datDuoc`. Không cache: gọi lại trước khi gửi đơn.

<!-- vi-du:khung-gio -->
Request:
```http
GET /api/lich-dat/khung-gio?soNgay=2
```
Response `200`:
```json
{
  "ngay": [
    {
      "ngay": "2026-10-08",
      "thu": "T5",
      "nhan": "Hôm nay",
      "ngayThang": "08/10",
      "nghi": false,
      "khung": [
        {
          "ma": "08-10",
          "batDau": "08:00",
          "ketThuc": "10:00",
          "nhan": "8h – 10h",
          "conCho": 1,
          "day": false,
          "daQua": true,
          "datDuoc": false
        },
        {
          "ma": "10-12",
          "batDau": "10:00",
          "ketThuc": "12:00",
          "nhan": "10h – 12h",
          "conCho": 4,
          "day": false,
          "daQua": true,
          "datDuoc": false
        },
        "… (còn 4 mục)"
      ]
    },
    {
      "ngay": "2026-10-09",
      "thu": "T6",
      "nhan": "T6",
      "ngayThang": "09/10",
      "nghi": false,
      "khung": [
        {
          "ma": "08-10",
          "batDau": "08:00",
          "ketThuc": "10:00",
          "nhan": "8h – 10h",
          "conCho": 0,
          "day": true,
          "daQua": false,
          "datDuoc": false
        },
        {
          "ma": "10-12",
          "batDau": "10:00",
          "ketThuc": "12:00",
          "nhan": "10h – 12h",
          "conCho": 0,
          "day": true,
          "daQua": false,
          "datDuoc": false
        },
        "… (còn 4 mục)"
      ]
    }
  ],
  "ngayNghi": [
    {
      "ngay": "2027-02-05",
      "ten": "Tết Nguyên đán"
    },
    {
      "ngay": "2027-02-06",
      "ten": "Tết Nguyên đán"
    },
    "… (còn 6 mục)"
  ]
}
```
<!-- /vi-du -->

## 4. Đơn hàng

### `GET /api/trang/dat-lich` và `GET /api/trang/goi-gap`
Ai gọi: công khai. Mọi thứ form cần trong một lần gọi. `dat-lich`: dịch vụ nhận đặt (kèm `baoGiaSoBo` để biết có giá
ngay hay "cố vấn gọi lại"), hãng → dòng xe, chỗ đỗ, lịch 4 ngày, phí, giới hạn tệp. `goi-gap`: các sự cố, quận, cam kết
phút, `gioNhanGap.dangNhan` (ngoài giờ thì mời gọi hotline).

<!-- vi-du:trang-dat-lich -->
Request:
```http
GET /api/trang/dat-lich
```
Response `200`:
```json
{
  "dichVu": [
    {
      "ma": "BD",
      "ten": "Bảo dưỡng định kỳ",
      "slug": "bao-duong-dinh-ky",
      "moTaNgan": "Thay dầu, lọc, kiểm tra 30 hạng mục",
      "baoGiaSoBo": true
    },
    {
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "baoGiaSoBo": true
    },
    "… (còn 4 mục)"
  ],
  "hangXe": [
    {
      "id": 1,
      "ten": "Toyota",
      "slug": "toyota",
      "dong": [
        {
          "id": 12,
          "ten": "Avanza",
          "tenDayDu": "Toyota Avanza",
          "slug": "toyota-avanza",
          "phanKhuc": "B",
          "doiTu": 2018,
          "doiDen": 2026,
          "xeDien": false
        },
        {
          "id": 5,
          "ten": "Camry",
          "tenDayDu": "Toyota Camry",
          "slug": "toyota-camry",
          "phanKhuc": "D",
          "doiTu": 2012,
          "doiDen": 2026,
          "xeDien": false
        },
        "… (còn 11 mục)"
      ]
    },
    {
      "id": 2,
      "ten": "Hyundai",
      "slug": "hyundai",
      "dong": [
        {
          "id": 15,
          "ten": "Accent",
          "tenDayDu": "Hyundai Accent",
          "slug": "hyundai-accent",
          "phanKhuc": "B",
          "doiTu": 2018,
          "doiDen": 2026,
          "xeDien": false
        },
        {
          "id": 23,
          "ten": "Creta",
          "tenDayDu": "Hyundai Creta",
          "slug": "hyundai-creta",
          "phanKhuc": null,
          "doiTu": 2022,
          "doiDen": 2026,
          "xeDien": false
        },
        "… (còn 8 mục)"
      ]
    },
    "… (còn 13 mục)"
  ],
  "choDo": [
    {
      "value": "nha",
      "label": "Nhà riêng"
    },
    {
      "value": "ham",
      "label": "Hầm chung cư"
    },
    "… (còn 2 mục)"
  ],
  "lich": [
    {
      "ngay": "2026-10-08",
      "thu": "T5",
      "nhan": "Hôm nay",
      "ngayThang": "08/10",
      "nghi": false,
      "khung": [
        {
          "ma": "08-10",
          "batDau": "08:00",
          "ketThuc": "10:00",
          "nhan": "8h – 10h",
          "conCho": 1,
          "day": false,
          "daQua": true,
          "datDuoc": false
        },
        {
          "ma": "10-12",
          "batDau": "10:00",
          "ketThuc": "12:00",
          "nhan": "10h – 12h",
          "conCho": 4,
          "day": false,
          "daQua": true,
          "datDuoc": false
        },
        "… (còn 4 mục)"
      ]
    },
    {
      "ngay": "2026-10-09",
      "thu": "T6",
      "nhan": "T6",
      "ngayThang": "09/10",
      "nghi": false,
      "khung": [
        {
          "ma": "08-10",
          "batDau": "08:00",
          "ketThuc": "10:00",
          "nhan": "8h – 10h",
          "conCho": 0,
          "day": true,
          "daQua": false,
          "datDuoc": false
        },
        {
          "ma": "10-12",
          "batDau": "10:00",
          "ketThuc": "12:00",
          "nhan": "10h – 12h",
          "conCho": 0,
          "day": true,
          "daQua": false,
          "datDuoc": false
        },
        "… (còn 4 mục)"
      ]
    },
    "… (còn 2 mục)"
  ],
  "phi": {
    "phiDiLai": 50000,
    "phiKiemTra": 100000,
    "hienThi": {
      "phiDiLai": "50.000đ",
      "phiKiemTra": "100.000đ"
    }
  },
  "camKet": {
    "cuuHoPhut": 60,
    "baoHanhPhuTungThang": 6,
    "baoHanhCongThang": 3,
    "coVanGoiLaiPhut": 15
  },
  "vungPhucVu": {
    "quan": [
      {
        "ten": "Cầu Giấy",
        "slug": "cau-giay",
        "etaTu": 25,
        "etaDen": 40
      },
      {
        "ten": "Đống Đa",
        "slug": "dong-da",
        "etaTu": 30,
        "etaDen": 45
      },
      "… (còn 2 mục)"
    ],
    "tenCacQuan": "Cầu Giấy, Đống Đa, Thanh Xuân, Ba Đình"
  },
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  },
  "gioiHanTep": {
    "soAnh": 3,
    "soVideo": 1,
    "anhToiDaMB": 8,
    "videoToiDaMB": 60,
    "videoToiDaGiay": 30
  }
}
```
<!-- /vi-du -->

<!-- vi-du:trang-goi-gap -->
Request:
```http
GET /api/trang/goi-gap
```
Response `200`:
```json
{
  "suCo": [
    {
      "ma": "aq",
      "ten": "Hết ắc quy",
      "moTa": "Đề không quay, đèn mờ",
      "dichVu": "ac-quy"
    },
    {
      "ma": "lop",
      "ten": "Thủng, xẹp lốp",
      "moTa": "Vá hoặc thay tại chỗ",
      "dichVu": "lop"
    },
    "… (còn 2 mục)"
  ],
  "camKet": {
    "cuuHoPhut": 60,
    "baoHanhPhuTungThang": 6,
    "baoHanhCongThang": 3,
    "coVanGoiLaiPhut": 15
  },
  "vungPhucVu": {
    "quan": [
      {
        "ten": "Cầu Giấy",
        "slug": "cau-giay",
        "etaTu": 25,
        "etaDen": 40
      },
      {
        "ten": "Đống Đa",
        "slug": "dong-da",
        "etaTu": 30,
        "etaDen": 45
      },
      "… (còn 2 mục)"
    ],
    "tenCacQuan": "Cầu Giấy, Đống Đa, Thanh Xuân, Ba Đình"
  },
  "gioNhanGap": {
    "tu": "06:00",
    "den": "22:00",
    "dangNhan": true
  },
  "lienHe": {
    "hotline": "1900 1068",
    "zalo": "https://zalo.me/0000000000",
    "email": "lienhe@thotoi.test",
    "xuongDoiTac": "xưởng Auto Speedy",
    "chinhSachDuLieu": "/chinh-sach-du-lieu/"
  }
}
```
<!-- /vi-du -->

### `POST /api/don-hang/dat-lich`
Ai gọi: công khai (form `DatLich`). Body JSON, hoặc `multipart/form-data` khi có tệp: ô `duLieu` = JSON dưới đây,
ô `tep` lặp lại (≤3 ảnh ≤8 MB, ≤1 video ≤60 MB), ô `thoiLuongVideo` = số giây video (trình duyệt đo, ≤30).

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `dichVu` | có | mảng slug dịch vụ (1–6) |
| `trieuChung` | | ≤2000 ký tự |
| `xe.hang`, `xe.dong` | có `dong` (hoặc `xe.tenXe` gõ tay) | slug từ `/api/xe` |
| `xe.doi`, `xe.soKm` | | số nguyên |
| `xe.bienSo` | | gõ liền cũng được (`30a12345` → `30A-123.45`) |
| `viTri.diaChi` hoặc `viTri.lat`+`viTri.lng` | có | server tự kiểm tra vùng |
| `viTri.choDo` | có | `nha` \| `ham` \| `bai` \| `duong` |
| `viTri.ghiChuChoTho` | | |
| `khungGio.ngay`, `khungGio.ma` | có | từ `/api/lich-dat/khung-gio` |
| `khach.hoTen`, `khach.sdt` | có | sdt di động VN |
| `hoaDon.mst`, `hoaDon.tenCongTy`, `hoaDon.diaChi`, `hoaDon.email` | | xuất hoá đơn công ty |
| `maKhuyenMai` | | mã khuyến mãi / đối tác: sai, hết hạn thì 409 `MA_KHUYEN_MAI_KHONG_DUNG_DUOC` (ô `maKhuyenMai`), trừ khi tính tiền |
| `maGioiThieu` | | mã giới thiệu bạn bè (mục 8) hoặc mã từ link `?ma=`; không áp được thì vẫn nhận đơn, báo trong `gioiThieu.lyDo` |
| `dongY` | **có**, `true` | chưa đồng ý thì không lưu gì; server lưu thời điểm đồng ý |
| `nhacBaoDuong` | | nhắc bảo dưỡng qua Zalo |
| `nguon` | | `{ utm_source, utm_medium, utm_campaign, ma, qr, trangVao, referrer }`: giữ suốt phiên, gửi kèm đơn |
| `website` | | ô bẫy bot, để trống |

Kết quả 201: `ma` (`TT-000123`), `linkTheoDoi` (link riêng, gửi khách), `token`, `khungGio`, `viTri` (quận, thời gian tới),
`giaSoBo` (đúng giá khách thấy lúc đặt, đã lưu vào đơn), `khuyenMai`, `gioiThieu`, `hoiVien` (xe có gói còn hạn). Sau đó server tự gửi đơn sang phần mềm điều phối và nhắn Zalo
(SMS dự phòng) xác nhận cho khách.

<!-- vi-du:dat-lich -->
Request:
```http
POST /api/don-hang/dat-lich

{
  "dichVu": [
    "ac-quy"
  ],
  "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
  "xe": {
    "hang": "toyota",
    "dong": "toyota-vios",
    "doi": 2019,
    "bienSo": "30a12345",
    "soKm": 48000
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "choDo": "ham",
    "ghiChuChoTho": "Hầm B2, ô 112"
  },
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12"
  },
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912 345 678"
  },
  "dongY": true,
  "nhacBaoDuong": true,
  "nguon": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "trangVao": "/dich-vu/ac-quy/"
  },
  "website": ""
}
```
Response `201`:
```json
{
  "ma": "TT-000067",
  "loai": "datLich",
  "trangThai": "daNhan",
  "linkTheoDoi": "http://localhost:3000/don/168zw-NR9iq2WBwEWizgwPr7_aIOfVx6/",
  "token": "168zw-NR9iq2WBwEWizgwPr7_aIOfVx6",
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12",
    "nhan": "10h – 12h, 11/10"
  },
  "viTri": {
    "quan": "Cầu Giấy",
    "phuong": "Dịch Vọng Hậu",
    "etaTu": 25,
    "etaDen": 40
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000,
    "hienThi": "1,55 – 2,2 triệu",
    "ghiChu": "Đã gồm phí đi lại 50.000đ. Giá chính thức chốt sau khi thợ kiểm tra."
  },
  "khuyenMai": null,
  "gioiThieu": null,
  "hoiVien": null,
  "nhanLuc": "2026-10-08T11:54:25.898Z"
}
```
<!-- /vi-du -->

Lỗi (ví dụ thật):

<!-- vi-du:dat-lich-loi -->
Request:
```http
POST /api/don-hang/dat-lich

{
  "dichVu": [],
  "khach": {
    "sdt": "0912"
  },
  "xe": {
    "bienSo": "abc"
  },
  "dongY": false
}
```
Response `400`:
```json
{
  "loi": "Thông tin chưa đúng, xem lại các ô được đánh dấu.",
  "ma": "DU_LIEU_SAI",
  "truong": {
    "dongY": "Bạn cần tích ô đồng ý xử lý dữ liệu để gửi đơn.",
    "khach.sdt": "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).",
    "viTri.diaChi": "Cho biết vị trí xe: bấm lấy vị trí hoặc gõ địa chỉ.",
    "dichVu": "Chọn ít nhất một việc cần làm.",
    "viTri.choDo": "Chọn nơi xe đang đỗ.",
    "khungGio": "Chọn ngày và khung giờ.",
    "khach.hoTen": "Cho biết họ tên để thợ xưng hô.",
    "xe.bienSo": "Biển số chưa đúng, ví dụ 30A-123.45 (gõ liền 30a12345 cũng được).",
    "xe.dong": "Chọn hãng và dòng xe."
  }
}
```
<!-- /vi-du -->

<!-- vi-du:dat-lich-ngoai-vung -->
Request:
```http
POST /api/don-hang/dat-lich

{
  "dichVu": [
    "ac-quy"
  ],
  "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
  "xe": {
    "hang": "toyota",
    "dong": "toyota-vios",
    "doi": 2019,
    "bienSo": "30a12345",
    "soKm": 48000
  },
  "viTri": {
    "diaChi": "Đại lộ Thăng Long, Hoài Đức",
    "choDo": "duong"
  },
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12"
  },
  "khach": {
    "hoTen": "Lan",
    "sdt": "0912 345 679"
  },
  "dongY": true,
  "nhacBaoDuong": true,
  "nguon": {
    "utm_source": "google",
    "utm_medium": "cpc",
    "trangVao": "/dich-vu/ac-quy/"
  },
  "website": ""
}
```
Response `422`:
```json
{
  "loi": "Địa chỉ này ngoài vùng phục vụ. Gọi cố vấn để được hướng dẫn, hoặc đặt kéo xe về xưởng Auto Speedy.",
  "ma": "NGOAI_VUNG",
  "vung": {
    "trongVung": false,
    "lyDo": "ngoaiQuan",
    "quan": null,
    "phuong": null,
    "eta": null,
    "viTri": {
      "lat": 21.034999999999997,
      "lng": 105.7,
      "diaChi": "Đại lộ Thăng Long, Hoài Đức, Hà Nội"
    },
    "thongBao": "Địa chỉ này ngoài vùng phục vụ. Gọi cố vấn để được hướng dẫn, hoặc đặt kéo xe về xưởng Auto Speedy."
  }
}
```
<!-- /vi-du -->

Khung giờ vừa kín chỗ: 409 `KHUNG_DAY` (`truong.khungGio`); đã qua: 409 `KHUNG_DA_QUA`; ngày nghỉ: 409 `NGAY_NGHI`;
dịch vụ tạm ngừng nhận: 409 `DICH_VU_TAM_NGUNG`.

### `POST /api/don-hang/goi-gap`
Ai gọi: công khai (form `GoiGap`). Body: `suCo` (mã từ `/api/trang/goi-gap`), `moTaSuCo`, `viTri` (`lat`/`lng` hoặc `diaChi`),
`khach.sdt`, `khach.hoTen` (không bắt buộc), `dongY: true`, `nguon`, `website`. Đơn gắn loại **khẩn cấp**: lên đầu hàng chờ,
gửi điều phối với `uuTien: 1`, nhắn số trực điều phối (`SDT_TRUC_DIEU_PHOI`). Ngoài giờ nhận gấp: 409 `NGOAI_GIO_NHAN_GAP`.

<!-- vi-du:goi-gap -->
Request:
```http
POST /api/don-hang/goi-gap

{
  "suCo": "aq",
  "moTaSuCo": "",
  "viTri": {
    "lat": 21.02,
    "lng": 105.82
  },
  "khach": {
    "sdt": "0987 654 321"
  },
  "dongY": true,
  "website": ""
}
```
Response `201`:
```json
{
  "ma": "TT-000068",
  "loai": "khanCap",
  "trangThai": "daNhan",
  "linkTheoDoi": "http://localhost:3000/don/iSnuMU4HxEA4F24C0d4NM-tT3mr__P1V/",
  "token": "iSnuMU4HxEA4F24C0d4NM-tT3mr__P1V",
  "khungGio": null,
  "viTri": {
    "quan": "Đống Đa",
    "phuong": "Láng Thượng",
    "etaTu": 30,
    "etaDen": 45
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1400000,
    "den": 3000000,
    "hienThi": "1,4 – 3 triệu",
    "ghiChu": "Đã gồm phí đi lại 50.000đ. Giá chính thức chốt sau khi thợ kiểm tra. Chưa biết dòng xe nên khoảng giá rộng."
  },
  "khuyenMai": null,
  "gioiThieu": null,
  "hoiVien": null,
  "nhanLuc": "2026-10-08T11:54:26.383Z"
}
```
<!-- /vi-du -->

### `GET /api/don-hang/theo-doi/:token`
Ai gọi: công khai, chỉ ai có link (token 32 ký tự ngẫu nhiên). Màn `TheoDoi`: trạng thái, 7 bước (`done`/`now`/`todo` kèm
thời điểm), dịch vụ, xe, địa chỉ, khung giờ, số điện thoại **đã che**, giá sơ bộ, `tho` (thợ, vị trí, giờ đến; `null` khi chưa xếp), `viecCanLam`, `thanhToan` (mục 6). Hỏi lại mỗi 30 giây. Link hết hạn 24 giờ sau khi đơn hoàn thành hoặc huỷ: 410 `LINK_HET_HAN`. Không bao giờ tra
được bằng mã đơn.

<!-- vi-du:theo-doi -->
Request:
```http
GET /api/don-hang/theo-doi/168zw-NR9iq2WBwEWizgwPr7_aIOfVx6
```
Response `200`:
```json
{
  "ma": "TT-000067",
  "loai": "datLich",
  "trangThai": "daNhan",
  "nhanTrangThai": "Đã nhận",
  "cacBuoc": [
    {
      "trangThai": "daNhan",
      "nhan": "Đã nhận",
      "luc": "2026-10-08T11:54:26.202Z",
      "tinhTrang": "now"
    },
    {
      "trangThai": "daXepTho",
      "nhan": "Đã xếp thợ",
      "luc": null,
      "tinhTrang": "todo"
    },
    "… (còn 5 mục)"
  ],
  "dichVu": [
    {
      "ten": "Ắc quy",
      "slug": "ac-quy"
    }
  ],
  "suCo": null,
  "xe": {
    "ten": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45"
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "quan": "Cầu Giấy",
    "etaTu": 25,
    "etaDen": 40
  },
  "khungGio": "10h – 12h, 11/10",
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912 xxx 678"
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000
  },
  "tho": null,
  "viTriTho": null,
  "thoDuKienDenLuc": null,
  "viecCanLam": null,
  "thanhToan": null,
  "hotline": "1900 1068",
  "taoLuc": "2026-10-08T11:54:26.210Z",
  "hetHanLinkLuc": null
}
```
<!-- /vi-du -->

### Trạng thái đơn
`daNhan` → `daXepTho` → `thoDangDen` → `choDuyetBaoGia` → `dangSua` → `choThanhToan` → `hoanThanh`, và `huy`.
Chỉ đi tới (được bỏ qua bước), không quay lại; huỷ được khi chưa xong; đơn xong/huỷ thì đứng yên (Quản trị sửa tay được trong admin).

## 5. Điều phối (VCsoft) và quản trị

### `POST /api/don-hang/:ma/trang-thai`
Ai gọi: `dieuPhoi`, `quanLyDichVu`, `quanTri` (đăng nhập hoặc khoá API). `:ma` là `TT-000123` hoặc id.
Body: `{ "trangThai": "daXepTho", "ghiChu": "Thợ Đức nhận" }`. Kết quả: trạng thái mới và lịch sử.
Tài khoản vai trò Điều phối đổi thì web không báo ngược lại sang điều phối; người trong công ty đổi trên web thì web báo
sang điều phối (`POST {DIEU_PHOI_URL}/don-hang/:ma/trang-thai`).

<!-- vi-du:trang-thai -->
Header `Authorization: users API-Key <khoá>` (hoặc `JWT <token>`):

Request:
```http
POST /api/don-hang/TT-000067/trang-thai

{
  "trangThai": "daXepTho",
  "ghiChu": "Thợ Đức nhận đơn"
}
```
Response `200`:
```json
{
  "ma": "TT-000067",
  "trangThai": "daXepTho",
  "nhan": "Đã xếp thợ",
  "lichSu": [
    {
      "id": "6ac78472f10bf73502bb8ad2",
      "trangThai": "daNhan",
      "luc": "2026-10-08T11:54:26.202Z",
      "boi": "Khách (web)",
      "ghiChu": null
    },
    {
      "id": "6ac78472f10bf73502bb8ad4",
      "trangThai": "daXepTho",
      "luc": "2026-10-08T11:54:26.611Z",
      "boi": "Điều phối thử",
      "ghiChu": "Thợ Đức nhận đơn"
    }
  ]
}
```
<!-- /vi-du -->

<!-- vi-du:trang-thai-loi -->
Quay lại bước trước:

Request:
```http
POST /api/don-hang/TT-000067/trang-thai

{
  "trangThai": "daNhan"
}
```
Response `409`:
```json
{
  "loi": "Không quay lại \"Đã nhận\" từ \"Đã xếp thợ\".",
  "ma": "KHONG_DOI_DUOC"
}
```
<!-- /vi-du -->

**Web gửi sang điều phối khi có đơn mới** (adapter `lib/tich-hop/dieu-phoi.ts`, chờ VCsoft xác nhận):
`POST {DIEU_PHOI_URL}/don-hang`, header `Authorization: Bearer {DIEU_PHOI_KEY}`, body:
```json
{ "ma": "TT-000123", "loai": "datLich|khanCap", "uuTien": 0, "trangThai": "daNhan", "dichVu": ["ac-quy"],
  "suCo": "Hết ắc quy", "trieuChung": "...", "xe": { "ten": "Toyota Vios", "bienSo": "30A-123.45", "doi": 2019, "soKm": 48000 },
  "viTri": { "lat": 21.03, "lng": 105.79, "diaChi": "...", "quan": "Cầu Giấy", "phuong": "Dịch Vọng Hậu", "choDo": "Hầm chung cư", "ghiChuChoTho": "..." },
  "khungGio": { "ngay": "2026-10-09", "batDau": "08-10", "ketThuc": "" }, "khach": { "hoTen": "...", "sdt": "0912345678" },
  "giaSoBo": { "tu": 1550000, "den": 2200000 }, "linkTheoDoi": "https://.../don/<token>/" }
```
Trả `200 { "id": "<mã bên điều phối>" }`. Lỗi được ghi vào đơn (tab "Nguồn, tích hợp"), đơn vẫn giữ.

### Sửa giá (màn `QtBangGia`)
- Đọc: `GET /api/danh-muc-dich-vu`, `GET /api/hang-muc-gia?where[dichVu][equals]=<id>&limit=100` (REST chuẩn của Payload).
- Sửa một hạng mục: `PATCH /api/hang-muc-gia/:id` `{ "gia": 170000, "lyDoDoi": "..." }` hoặc
  `{ "giaPhanKhuc": { "A": { "tu": .., "den": .. }, ... } }`.
- **Lưu nhiều một lần** ("Lưu 3 thay đổi giá"): `POST /api/hang-muc-gia/luu-nhieu`
  `{ "thayDoi": [{ "id": 6, "gia": 170000 }], "lyDo": "Giá nhập tăng" }`. Lưu cả lô hoặc không lưu gì.
- Nhật ký đổi giá: `GET /api/nhat-ky-gia?sort=-createdAt&limit=50` (`moTa`, `giaCu`, `giaMoi`, `lyDo`, `tenNguoi`, `vaiTro`, `createdAt`).
- Phí chung, bảo hành, phân khúc: `GET/POST /api/globals/bang-gia-chung` (thêm `lyDoDoi` để ghi nhật ký).
- Danh mục dịch vụ (bật/tắt nhận đặt, báo giá sơ bộ): `PATCH /api/danh-muc-dich-vu/:id`.
- Hãng, dòng xe: `/api/hang-xe`, `/api/dong-xe` (`where[canGan][equals]=true` = dòng mới cần gán phân khúc);
  đồng bộ VCparts: `POST /api/dong-xe/dong-bo-vcparts` → `{ luc, soHang, hangMoi, soDong, dongMoi[], canGan }`.
- Vùng: `/api/quan`, `/api/phuong` (bật/tắt `dangPhucVu`, `etaTu`, `etaDen`). Giờ, khung, ngày nghỉ:
  `GET/POST /api/globals/lich-nhan-don`. Cấu hình chung: `GET/POST /api/globals/cai-dat`.
- Tình trạng tích hợp: `GET /api/tich-hop/trang-thai` (quản trị, quản lý dịch vụ).

<!-- vi-du:luu-nhieu -->
Đăng nhập vai trò quanLyDichVu:

Request:
```http
POST /api/hang-muc-gia/luu-nhieu

{
  "thayDoi": [
    {
      "id": 6,
      "gia": 170000
    }
  ],
  "lyDo": "VCparts báo tăng giá"
}
```
Response `200`:
```json
{
  "daLuu": 1,
  "hangMuc": [
    {
      "id": 6,
      "dichVu": 2,
      "ten": "Kích nổ tại chỗ",
      "loai": "cong",
      "gia": 170000,
      "donVi": null,
      "giaPhanKhuc": {
        "A": {
          "tu": null,
          "den": null
        },
        "B": {
          "tu": null,
          "den": null
        },
        "C": {
          "tu": null,
          "den": null
        },
        "D": {
          "tu": null,
          "den": null
        }
      },
      "ghiChu": null,
      "baoGiaSoBo": "khong",
      "nguonGia": "tay",
      "thuTu": 2,
      "noiBat": true,
      "quyenLoiHoiVien": "kichNo",
      "tenNgan": "Kích nổ ắc quy",
      "lyDoDoi": null,
      "capNhatGiaLuc": "2026-10-08T11:54:26.839Z",
      "capNhatGiaBoi": "Trần Minh Đức (thử)",
      "updatedAt": "2026-10-08T11:54:26.840Z",
      "createdAt": "2026-10-08T11:11:11.108Z"
    }
  ]
}
```
<!-- /vi-du -->

<!-- vi-du:nhat-ky -->
Request:
```http
GET /api/nhat-ky-gia?sort=-createdAt&limit=2&depth=0
```
Response `200`:
```json
{
  "docs": [
    {
      "id": 49,
      "moTa": "Ắc quy › Kích nổ tại chỗ",
      "hangMuc": 6,
      "dichVu": 2,
      "giaCu": "170.000đ",
      "giaMoi": "150.000đ",
      "lyDo": "Trả lại giá (script ví dụ)",
      "nguoi": 2,
      "tenNguoi": "Trần Minh Đức (thử)",
      "vaiTro": "Quản lý dịch vụ",
      "updatedAt": "2026-10-08T11:54:26.889Z",
      "createdAt": "2026-10-08T11:54:26.889Z"
    },
    {
      "id": 48,
      "moTa": "Ắc quy › Kích nổ tại chỗ",
      "hangMuc": 6,
      "dichVu": 2,
      "giaCu": "150.000đ",
      "giaMoi": "170.000đ",
      "lyDo": "VCparts báo tăng giá",
      "nguoi": 2,
      "tenNguoi": "Trần Minh Đức (thử)",
      "vaiTro": "Quản lý dịch vụ",
      "updatedAt": "2026-10-08T11:54:26.845Z",
      "createdAt": "2026-10-08T11:54:26.845Z"
    }
  ],
  "hasNextPage": true,
  "hasPrevPage": false,
  "limit": 2,
  "nextPage": 2,
  "page": 1,
  "pagingCounter": 1,
  "prevPage": null,
  "totalDocs": 49,
  "totalPages": 25
}
```
<!-- /vi-du -->

## 6. Phục vụ khách (P1)

Luồng: điều phối **xếp thợ** → thợ gửi **vị trí** (`thoDangDen`) → thợ kiểm tra, gửi **báo giá chính thức**
(`choDuyetBaoGia`) → khách **duyệt** từng hạng mục (`dangSua`) hoặc **từ chối** (chỉ trả phí kiểm tra) → thợ bấm **xong**
(`choThanhToan`, tính tiền) → khách chuyển khoản **VietQR**, ngân hàng gọi **webhook** → đủ tiền thì `hoanThanh`, tự xuất
**hoá đơn điện tử**, lập **phiếu bảo hành** `BH-`, gửi tin. 24 giờ sau gửi **link đánh giá** (việc định kỳ).

Endpoint của thợ/điều phối: đăng nhập hoặc khoá API, vai trò `dieuPhoi`, `quanLyDichVu`, `quanTri`; `:ma` là `TT-000123`
hoặc id. Endpoint của khách: theo link riêng `:token` (như màn theo dõi), giới hạn 30 lần ghi / 200 lần đọc mỗi 10 phút mỗi IP.

### Thợ: `POST /api/don-hang/:ma/xep-tho`, `POST /api/don-hang/:ma/vi-tri-tho`
- `xep-tho`: `{ "tho": "THO-1" | <id thợ>, "duKienDenLuc"?: ISO }`. `tho` là mã thợ bên điều phối (`maBenDieuPhoi`) hoặc id
  trong collection `tho`. Đơn sang `daXepTho`, gửi tin "Đã xếp thợ" (tên, SĐT thợ) cho khách.
- `vi-tri-tho`: `{ "lat", "lng", "duKienDenLuc"? }`, gọi mỗi 30–60 giây khi thợ đang đi. Lần đầu đưa đơn sang `thoDangDen`.
- Danh sách thợ: `GET /api/tho` (REST Payload, `maBenDieuPhoi`, `ten`, `sdt`, `anh`, `namKinhNghiem`, `chuyenMon`, `diem`, `soDon`).
- Màn theo dõi (`GET /api/don-hang/theo-doi/:token`) có thêm `tho`, `viTriTho`, `thoDuKienDenLuc`, `viecCanLam`
  (báo giá chờ duyệt, thanh toán, đánh giá) và `thanhToan`.

<!-- vi-du:xep-tho -->
Đăng nhập vai trò dieuPhoi (VCsoft dùng khoá API):

Request:
```http
POST /api/don-hang/TT-000069/xep-tho

{
  "tho": "THO-1",
  "duKienDenLuc": "2026-10-08T12:19:27.063Z"
}
```
Response `200`:
```json
{
  "id": 121,
  "ma": "TT-000069",
  "loai": "datLich",
  "uuTien": 0,
  "trangThai": "daXepTho",
  "lichSuTrangThai": [
    {
      "id": "6ac78473f10bf73502bb8ad5",
      "trangThai": "daNhan",
      "luc": "2026-10-08T11:54:27.023Z",
      "boi": "Khách (web)",
      "ghiChu": null
    },
    {
      "id": "6ac78473f10bf73502bb8ad6",
      "trangThai": "daXepTho",
      "luc": "2026-10-08T11:54:27.135Z",
      "boi": "Điều phối thử",
      "ghiChu": null
    }
  ],
  "ghiChuNoiBo": null,
  "dichVu": [
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "updatedAt": "2026-10-08T11:11:11.085Z",
      "createdAt": "2026-10-08T11:11:11.085Z"
    }
  ],
  "suCo": null,
  "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
  "tep": [],
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12",
    "nhan": "10h – 12h, 11/10",
    "batDauLuc": "2026-10-11T03:00:00.000Z"
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000,
    "phanKhuc": "B",
    "dong": [
      {
        "tu": 150000,
        "den": 150000,
        "ten": "Công thay ắc quy",
        "loai": "cong",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "150.000đ"
      },
      {
        "tu": 1350000,
        "den": 2000000,
        "ten": "Ắc quy 12V",
        "loai": "phuTung",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "1.350.000 – 2.000.000đ"
      },
      "… (còn 1 mục)"
    ]
  },
  "xe": {
    "hang": {
      "id": 1,
      "ten": "Toyota",
      "slug": "toyota",
      "thuTu": 1,
      "maVCparts": "TOYOTA",
      "nguon": "vcparts",
      "updatedAt": "2026-10-08T11:11:11.356Z",
      "createdAt": "2026-10-08T11:11:11.356Z"
    },
    "dong": {
      "id": 1,
      "hang": 1,
      "ten": "Vios",
      "tenDayDu": "Toyota Vios",
      "slug": "toyota-vios",
      "phanKhuc": "B",
      "goiYPhanKhuc": "B",
      "canGan": false,
      "doiTu": 2014,
      "doiDen": 2026,
      "xeDien": false,
      "maVCparts": "TOYOTA-VIOS",
      "nguon": "vcparts",
      "dongBoLuc": "2026-10-08T11:11:11.351Z",
      "updatedAt": "2026-10-08T11:11:13.396Z",
      "createdAt": "2026-10-08T11:11:11.362Z"
    },
    "tenXe": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45",
    "soKm": 48000,
    "phanKhuc": "B"
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "lat": 21.0325,
    "lng": 105.79,
    "quan": {
      "id": 1,
      "ten": "Cầu Giấy",
      "slug": "cau-giay",
      "thanhPho": "Hà Nội",
      "etaTu": 25,
      "etaDen": 40,
      "ghiChu": "Dữ liệu mẫu: đo lại thời gian tới thực tế.",
      "ranhGioi": null,
      "dangPhucVu": true,
      "thuTu": 1,
      "updatedAt": "2026-10-08T11:11:13.493Z",
      "createdAt": "2026-10-08T11:11:13.493Z"
    },
    "phuong": "Dịch Vọng Hậu",
    "trongVung": true,
    "etaTu": 25,
    "etaDen": 40,
    "choDo": "ham",
    "ghiChuChoTho": "Hầm B2, ô 112"
  },
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912366957"
  },
  "hoaDon": {
    "can": null,
    "mst": null,
    "tenCongTy": null,
    "diaChi": null,
    "email": null
  },
  "maGioiThieu": null,
  "maKhuyenMai": "XANG-TDH12",
  "gioiThieu": null,
  "gioiThieuApDung": false,
  "hoiVien": null,
  "dongY": {
    "dongYXuLyDuLieu": true,
    "dongYLuc": "2026-10-08T11:54:27.018Z",
    "nhacBaoDuongZalo": true
  },
  "tho": {
    "id": 1,
    "ten": "Trần Minh Đức",
    "sdt": null,
    "maBenDieuPhoi": "THO-1",
    "anh": null,
    "soNamNghe": 7,
    "bienSoXeVan": "29H-512.36",
    "khuVuc": [
      1
    ],
    "chungChi": [
      {
        "id": "6ac77a521b2df71b91e30e6f",
        "ten": "VCedu Bảo dưỡng"
      },
      {
        "id": "6ac77a521b2df71b91e30e70",
        "ten": "VCedu Phanh, gầm"
      }
    ],
    "gioiThieu": "DỮ LIỆU MẪU",
    "dangHoatDong": true,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "viTri": {
      "lat": 21.0298,
      "lng": 105.7931,
      "luc": "2026-10-08T11:54:07.507Z"
    },
    "updatedAt": "2026-10-08T11:54:07.516Z",
    "createdAt": "2026-10-08T11:11:14.430Z"
  },
  "thoDuKienDenLuc": "2026-10-08T12:19:27.063Z",
  "viTriTho": {
    "lat": null,
    "lng": null,
    "luc": null
  },
  "ketQua": "binhThuong",
  "khuyenMai": {
    "id": 1,
    "ma": "XANG-TDH12",
    "loai": "xang",
    "doiTac": "Cây xăng 12 Trần Duy Hưng",
    "kieuGiam": "phanTram",
    "giaTri": 10,
    "giamToiDa": 100000,
    "batDau": "2026-01-01T00:00:00.000Z",
    "hetHan": "2027-12-31T00:00:00.000Z",
    "soLuotToiDa": 300,
    "moiSdtMotLan": true,
    "hoaHongPhanTram": 5,
    "tamDung": false,
    "ghiChu": "DỮ LIỆU MẪU",
    "updatedAt": "2026-10-08T11:11:14.454Z",
    "createdAt": "2026-10-08T11:11:14.454Z"
  },
  "xongLuc": null,
  "soKmKhiXong": null,
  "quyenLoi": {
    "mienDiLai": null,
    "kichNo": null,
    "vaLop": null,
    "giamHoiVien": null,
    "giamMa": null,
    "uuTienHoiVien": false
  },
  "thanhToan": {
    "soTien": null,
    "giam": null,
    "daNhan": 0,
    "trangThai": "chuaTinh",
    "chiTiet": null,
    "thanhToanLuc": null,
    "maGiaoDich": null,
    "hinhThuc": null
  },
  "hoaDonDienTu": {
    "so": null,
    "kyHieu": null,
    "maCQT": null,
    "xuatLuc": null,
    "linkXem": null,
    "linkPdf": null,
    "loi": null
  },
  "phieuBaoHanh": null,
  "danhGia": {
    "guiLuc": null,
    "luc": null,
    "soSao": null,
    "token": null
  },
  "nguon": {
    "kenh": "QR cây xăng",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "",
    "maQR": "",
    "trangVao": "/dich-vu/ac-quy/",
    "referrer": ""
  },
  "tichHop": {
    "dieuPhoiId": null,
    "guiDieuPhoiLuc": null,
    "loiDieuPhoi": null,
    "xacNhanKenh": null,
    "xacNhanLuc": null,
    "loiThongBao": null
  },
  "tokenTheoDoi": "nowWuF26fljUm98Qo_vrSet-8tLDv63d",
  "ketThucLuc": null,
  "hetHanLinkLuc": null,
  "updatedAt": "2026-10-08T11:54:27.151Z",
  "createdAt": "2026-10-08T11:54:27.031Z"
}
```
<!-- /vi-du -->

<!-- vi-du:vi-tri-tho -->
Request:
```http
POST /api/don-hang/TT-000069/vi-tri-tho

{
  "lat": 21.0298,
  "lng": 105.7931
}
```
Response `200`:
```json
{
  "id": 121,
  "ma": "TT-000069",
  "loai": "datLich",
  "uuTien": 0,
  "trangThai": "thoDangDen",
  "lichSuTrangThai": [
    {
      "id": "6ac78473f10bf73502bb8ad5",
      "trangThai": "daNhan",
      "luc": "2026-10-08T11:54:27.023Z",
      "boi": "Khách (web)",
      "ghiChu": null
    },
    {
      "id": "6ac78473f10bf73502bb8ad6",
      "trangThai": "daXepTho",
      "luc": "2026-10-08T11:54:27.135Z",
      "boi": "Điều phối thử",
      "ghiChu": null
    },
    "… (còn 1 mục)"
  ],
  "ghiChuNoiBo": null,
  "dichVu": [
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "updatedAt": "2026-10-08T11:11:11.085Z",
      "createdAt": "2026-10-08T11:11:11.085Z"
    }
  ],
  "suCo": null,
  "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
  "tep": [],
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12",
    "nhan": "10h – 12h, 11/10",
    "batDauLuc": "2026-10-11T03:00:00.000Z"
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000,
    "phanKhuc": "B",
    "dong": [
      {
        "tu": 150000,
        "den": 150000,
        "ten": "Công thay ắc quy",
        "loai": "cong",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "150.000đ"
      },
      {
        "tu": 1350000,
        "den": 2000000,
        "ten": "Ắc quy 12V",
        "loai": "phuTung",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "1.350.000 – 2.000.000đ"
      },
      "… (còn 1 mục)"
    ]
  },
  "xe": {
    "hang": {
      "id": 1,
      "ten": "Toyota",
      "slug": "toyota",
      "thuTu": 1,
      "maVCparts": "TOYOTA",
      "nguon": "vcparts",
      "updatedAt": "2026-10-08T11:11:11.356Z",
      "createdAt": "2026-10-08T11:11:11.356Z"
    },
    "dong": {
      "id": 1,
      "hang": 1,
      "ten": "Vios",
      "tenDayDu": "Toyota Vios",
      "slug": "toyota-vios",
      "phanKhuc": "B",
      "goiYPhanKhuc": "B",
      "canGan": false,
      "doiTu": 2014,
      "doiDen": 2026,
      "xeDien": false,
      "maVCparts": "TOYOTA-VIOS",
      "nguon": "vcparts",
      "dongBoLuc": "2026-10-08T11:11:11.351Z",
      "updatedAt": "2026-10-08T11:11:13.396Z",
      "createdAt": "2026-10-08T11:11:11.362Z"
    },
    "tenXe": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45",
    "soKm": 48000,
    "phanKhuc": "B"
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "lat": 21.0325,
    "lng": 105.79,
    "quan": {
      "id": 1,
      "ten": "Cầu Giấy",
      "slug": "cau-giay",
      "thanhPho": "Hà Nội",
      "etaTu": 25,
      "etaDen": 40,
      "ghiChu": "Dữ liệu mẫu: đo lại thời gian tới thực tế.",
      "ranhGioi": null,
      "dangPhucVu": true,
      "thuTu": 1,
      "updatedAt": "2026-10-08T11:11:13.493Z",
      "createdAt": "2026-10-08T11:11:13.493Z"
    },
    "phuong": "Dịch Vọng Hậu",
    "trongVung": true,
    "etaTu": 25,
    "etaDen": 40,
    "choDo": "ham",
    "ghiChuChoTho": "Hầm B2, ô 112"
  },
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912366957"
  },
  "hoaDon": {
    "can": null,
    "mst": null,
    "tenCongTy": null,
    "diaChi": null,
    "email": null
  },
  "maGioiThieu": null,
  "maKhuyenMai": "XANG-TDH12",
  "gioiThieu": null,
  "gioiThieuApDung": false,
  "hoiVien": null,
  "dongY": {
    "dongYXuLyDuLieu": true,
    "dongYLuc": "2026-10-08T11:54:27.018Z",
    "nhacBaoDuongZalo": true
  },
  "tho": {
    "id": 1,
    "ten": "Trần Minh Đức",
    "sdt": null,
    "maBenDieuPhoi": "THO-1",
    "anh": null,
    "soNamNghe": 7,
    "bienSoXeVan": "29H-512.36",
    "khuVuc": [
      1
    ],
    "chungChi": [
      {
        "id": "6ac77a521b2df71b91e30e6f",
        "ten": "VCedu Bảo dưỡng"
      },
      {
        "id": "6ac77a521b2df71b91e30e70",
        "ten": "VCedu Phanh, gầm"
      }
    ],
    "gioiThieu": "DỮ LIỆU MẪU",
    "dangHoatDong": true,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "viTri": {
      "lat": 21.0298,
      "lng": 105.7931,
      "luc": "2026-10-08T11:54:27.235Z"
    },
    "updatedAt": "2026-10-08T11:54:27.243Z",
    "createdAt": "2026-10-08T11:11:14.430Z"
  },
  "thoDuKienDenLuc": "2026-10-08T12:19:27.063Z",
  "viTriTho": {
    "lat": 21.0298,
    "lng": 105.7931,
    "luc": "2026-10-08T11:54:27.235Z"
  },
  "ketQua": "binhThuong",
  "khuyenMai": {
    "id": 1,
    "ma": "XANG-TDH12",
    "loai": "xang",
    "doiTac": "Cây xăng 12 Trần Duy Hưng",
    "kieuGiam": "phanTram",
    "giaTri": 10,
    "giamToiDa": 100000,
    "batDau": "2026-01-01T00:00:00.000Z",
    "hetHan": "2027-12-31T00:00:00.000Z",
    "soLuotToiDa": 300,
    "moiSdtMotLan": true,
    "hoaHongPhanTram": 5,
    "tamDung": false,
    "ghiChu": "DỮ LIỆU MẪU",
    "updatedAt": "2026-10-08T11:11:14.454Z",
    "createdAt": "2026-10-08T11:11:14.454Z"
  },
  "xongLuc": null,
  "soKmKhiXong": null,
  "quyenLoi": {
    "mienDiLai": null,
    "kichNo": null,
    "vaLop": null,
    "giamHoiVien": null,
    "giamMa": null,
    "uuTienHoiVien": false
  },
  "thanhToan": {
    "soTien": null,
    "giam": null,
    "daNhan": 0,
    "trangThai": "chuaTinh",
    "chiTiet": null,
    "thanhToanLuc": null,
    "maGiaoDich": null,
    "hinhThuc": null
  },
  "hoaDonDienTu": {
    "so": null,
    "kyHieu": null,
    "maCQT": null,
    "xuatLuc": null,
    "linkXem": null,
    "linkPdf": null,
    "loi": null
  },
  "phieuBaoHanh": null,
  "danhGia": {
    "guiLuc": null,
    "luc": null,
    "soSao": null,
    "token": null
  },
  "nguon": {
    "kenh": "QR cây xăng",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "",
    "maQR": "",
    "trangVao": "/dich-vu/ac-quy/",
    "referrer": ""
  },
  "tichHop": {
    "dieuPhoiId": null,
    "guiDieuPhoiLuc": null,
    "loiDieuPhoi": null,
    "xacNhanKenh": null,
    "xacNhanLuc": null,
    "loiThongBao": null
  },
  "tokenTheoDoi": "nowWuF26fljUm98Qo_vrSet-8tLDv63d",
  "ketThucLuc": null,
  "hetHanLinkLuc": null,
  "updatedAt": "2026-10-08T11:54:27.275Z",
  "createdAt": "2026-10-08T11:54:27.031Z"
}
```
<!-- /vi-du -->

<!-- vi-du:theo-doi-tho -->
Request:
```http
GET /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d
```
Response `200`:
```json
{
  "ma": "TT-000069",
  "loai": "datLich",
  "trangThai": "thoDangDen",
  "nhanTrangThai": "Thợ đang đến",
  "cacBuoc": [
    {
      "trangThai": "daNhan",
      "nhan": "Đã nhận",
      "luc": "2026-10-08T11:54:27.023Z",
      "tinhTrang": "done"
    },
    {
      "trangThai": "daXepTho",
      "nhan": "Đã xếp thợ",
      "luc": "2026-10-08T11:54:27.135Z",
      "tinhTrang": "done"
    },
    "… (còn 5 mục)"
  ],
  "dichVu": [
    {
      "ten": "Ắc quy",
      "slug": "ac-quy"
    }
  ],
  "suCo": null,
  "xe": {
    "ten": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45"
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "quan": "Cầu Giấy",
    "etaTu": 25,
    "etaDen": 40
  },
  "khungGio": "10h – 12h, 11/10",
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912 xxx 957"
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000
  },
  "tho": {
    "ten": "Trần Minh Đức",
    "vietTat": "MĐ",
    "anh": null,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "soNamNghe": 7,
    "chungChi": [
      "VCedu Bảo dưỡng",
      "VCedu Phanh, gầm"
    ],
    "bienSoXeVan": "29H-512.36"
  },
  "viTriTho": {
    "lat": 21.0298,
    "lng": 105.7931,
    "luc": "2026-10-08T11:54:27.235Z"
  },
  "thoDuKienDenLuc": "2026-10-08T12:19:27.063Z",
  "viecCanLam": null,
  "thanhToan": null,
  "hotline": "1900 1068",
  "taoLuc": "2026-10-08T11:54:27.031Z",
  "hetHanLinkLuc": null
}
```
<!-- /vi-du -->

### Báo giá chính thức: `POST /api/don-hang/:ma/bao-gia`
Thợ gửi: `{ "chanDoan"?, "hangMuc": [{ "ma", "ten", "lyDo", "loai": "cong"|"phuTung", "gia", "batBuoc"?, "mucDo":
"canLamNgay"|"nenLam"|"coTheDeSau", "baoHanhThang"?, "anh"?: [<id tệp đơn>], "hangMucGia"?: <id hạng mục bảng giá> }] }`.
`hangMucGia` để biết hạng mục nào hội viên được miễn (kích nổ, vá lốp, mục 8); không gửi thì so theo tên. `ma` là khoá của hạng mục trong báo giá
(khách bỏ chọn theo `ma`). `baoHanhThang` bỏ trống thì lấy theo bảng giá chung (công / phụ tùng).
Gửi lại khi đơn đang `choDuyetBaoGia` thì báo giá cũ thành `thayThe`. Gửi khi đang `dangSua` = **báo giá phát sinh**: đơn
quay về `choDuyetBaoGia`, khách duyệt riêng phần phát sinh. Tiền đi lại tính một lần, không theo từng báo giá.

<!-- vi-du:tao-bao-gia -->
Request:
```http
POST /api/don-hang/TT-000069/bao-gia

{
  "chanDoan": "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.",
  "hangMuc": [
    {
      "ma": "aq",
      "ten": "Ắc quy 12V 45Ah",
      "lyDo": "Điện áp khởi động 8,9V, dưới mức an toàn",
      "loai": "phuTung",
      "gia": 1650000,
      "batBuoc": true,
      "mucDo": "canLamNgay"
    },
    {
      "ma": "cong",
      "ten": "Công thay ắc quy",
      "lyDo": "Gồm lưu bộ nhớ xe",
      "loai": "cong",
      "gia": 150000,
      "batBuoc": true,
      "mucDo": "canLamNgay"
    },
    {
      "ma": "coc",
      "ten": "Vệ sinh cọc, thay đầu cos",
      "lyDo": "Cọc âm bị rỉ trắng",
      "loai": "cong",
      "gia": 120000,
      "mucDo": "nenLam"
    },
    {
      "ma": "gat",
      "ten": "Thay lưỡi gạt mưa",
      "lyDo": "Lưỡi gạt chai, để vệt khi gạt",
      "loai": "phuTung",
      "gia": 280000,
      "mucDo": "coTheDeSau"
    }
  ]
}
```
Response `200`:
```json
{
  "id": 49,
  "donHang": {
    "id": 121,
    "ma": "TT-000069",
    "loai": "datLich",
    "uuTien": 0,
    "trangThai": "thoDangDen",
    "lichSuTrangThai": [
      {
        "id": "6ac78473f10bf73502bb8ad5",
        "trangThai": "daNhan",
        "luc": "2026-10-08T11:54:27.023Z",
        "boi": "Khách (web)",
        "ghiChu": null
      },
      {
        "id": "6ac78473f10bf73502bb8ad6",
        "trangThai": "daXepTho",
        "luc": "2026-10-08T11:54:27.135Z",
        "boi": "Điều phối thử",
        "ghiChu": null
      },
      "… (còn 1 mục)"
    ],
    "ghiChuNoiBo": null,
    "dichVu": [
      {
        "id": 2,
        "ma": "AQ",
        "ten": "Ắc quy",
        "slug": "ac-quy",
        "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
        "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
        "nutKeuGoi": "Gọi thợ thay ắc quy",
        "thoiGianLam": "20–30 phút",
        "thuTu": 2,
        "nhanDatLich": true,
        "baoGiaSoBo": true,
        "hienTrenBangGia": true,
        "updatedAt": "2026-10-08T11:11:11.085Z",
        "createdAt": "2026-10-08T11:11:11.085Z"
      }
    ],
    "suCo": null,
    "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
    "tep": [],
    "khungGio": {
      "ngay": "2026-10-11",
      "ma": "10-12",
      "nhan": "10h – 12h, 11/10",
      "batDauLuc": "2026-10-11T03:00:00.000Z"
    },
    "giaSoBo": {
      "trangThai": "coGia",
      "tu": 1550000,
      "den": 2200000,
      "phanKhuc": "B",
      "dong": [
        {
          "tu": 150000,
          "den": 150000,
          "ten": "Công thay ắc quy",
          "loai": "cong",
          "coThe": false,
          "dichVu": "ac-quy",
          "hienThi": "150.000đ"
        },
        {
          "tu": 1350000,
          "den": 2000000,
          "ten": "Ắc quy 12V",
          "loai": "phuTung",
          "coThe": false,
          "dichVu": "ac-quy",
          "hienThi": "1.350.000 – 2.000.000đ"
        },
        "… (còn 1 mục)"
      ]
    },
    "xe": {
      "hang": {
        "id": 1,
        "ten": "Toyota",
        "slug": "toyota",
        "thuTu": 1,
        "maVCparts": "TOYOTA",
        "nguon": "vcparts",
        "updatedAt": "2026-10-08T11:11:11.356Z",
        "createdAt": "2026-10-08T11:11:11.356Z"
      },
      "dong": {
        "id": 1,
        "hang": 1,
        "ten": "Vios",
        "tenDayDu": "Toyota Vios",
        "slug": "toyota-vios",
        "phanKhuc": "B",
        "goiYPhanKhuc": "B",
        "canGan": false,
        "doiTu": 2014,
        "doiDen": 2026,
        "xeDien": false,
        "maVCparts": "TOYOTA-VIOS",
        "nguon": "vcparts",
        "dongBoLuc": "2026-10-08T11:11:11.351Z",
        "updatedAt": "2026-10-08T11:11:13.396Z",
        "createdAt": "2026-10-08T11:11:11.362Z"
      },
      "tenXe": "Toyota Vios",
      "doi": 2019,
      "bienSo": "30A-123.45",
      "soKm": 48000,
      "phanKhuc": "B"
    },
    "viTri": {
      "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
      "lat": 21.0325,
      "lng": 105.79,
      "quan": {
        "id": 1,
        "ten": "Cầu Giấy",
        "slug": "cau-giay",
        "thanhPho": "Hà Nội",
        "etaTu": 25,
        "etaDen": 40,
        "ghiChu": "Dữ liệu mẫu: đo lại thời gian tới thực tế.",
        "ranhGioi": null,
        "dangPhucVu": true,
        "thuTu": 1,
        "updatedAt": "2026-10-08T11:11:13.493Z",
        "createdAt": "2026-10-08T11:11:13.493Z"
      },
      "phuong": "Dịch Vọng Hậu",
      "trongVung": true,
      "etaTu": 25,
      "etaDen": 40,
      "choDo": "ham",
      "ghiChuChoTho": "Hầm B2, ô 112"
    },
    "khach": {
      "hoTen": "Nguyễn Văn Hoàng",
      "sdt": "0912366957"
    },
    "hoaDon": {
      "can": null,
      "mst": null,
      "tenCongTy": null,
      "diaChi": null,
      "email": null
    },
    "maGioiThieu": null,
    "maKhuyenMai": "XANG-TDH12",
    "gioiThieu": null,
    "gioiThieuApDung": false,
    "hoiVien": null,
    "dongY": {
      "dongYXuLyDuLieu": true,
      "dongYLuc": "2026-10-08T11:54:27.018Z",
      "nhacBaoDuongZalo": true
    },
    "tho": {
      "id": 1,
      "ten": "Trần Minh Đức",
      "sdt": null,
      "maBenDieuPhoi": "THO-1",
      "anh": null,
      "soNamNghe": 7,
      "bienSoXeVan": "29H-512.36",
      "khuVuc": [
        1
      ],
      "chungChi": [
        {
          "id": "6ac77a521b2df71b91e30e6f",
          "ten": "VCedu Bảo dưỡng"
        },
        {
          "id": "6ac77a521b2df71b91e30e70",
          "ten": "VCedu Phanh, gầm"
        }
      ],
      "gioiThieu": "DỮ LIỆU MẪU",
      "dangHoatDong": true,
      "diemSao": 4.9,
      "soDanhGia": 214,
      "viTri": {
        "lat": 21.0298,
        "lng": 105.7931,
        "luc": "2026-10-08T11:54:27.235Z"
      },
      "updatedAt": "2026-10-08T11:54:27.243Z",
      "createdAt": "2026-10-08T11:11:14.430Z"
    },
    "thoDuKienDenLuc": "2026-10-08T12:19:27.063Z",
    "viTriTho": {
      "lat": 21.0298,
      "lng": 105.7931,
      "luc": "2026-10-08T11:54:27.235Z"
    },
    "ketQua": "binhThuong",
    "khuyenMai": {
      "id": 1,
      "ma": "XANG-TDH12",
      "loai": "xang",
      "doiTac": "Cây xăng 12 Trần Duy Hưng",
      "kieuGiam": "phanTram",
      "giaTri": 10,
      "giamToiDa": 100000,
      "batDau": "2026-01-01T00:00:00.000Z",
      "hetHan": "2027-12-31T00:00:00.000Z",
      "soLuotToiDa": 300,
      "moiSdtMotLan": true,
      "hoaHongPhanTram": 5,
      "tamDung": false,
      "ghiChu": "DỮ LIỆU MẪU",
      "updatedAt": "2026-10-08T11:11:14.454Z",
      "createdAt": "2026-10-08T11:11:14.454Z"
    },
    "xongLuc": null,
    "soKmKhiXong": null,
    "quyenLoi": {
      "mienDiLai": null,
      "kichNo": null,
      "vaLop": null,
      "giamHoiVien": null,
      "giamMa": null,
      "uuTienHoiVien": false
    },
    "thanhToan": {
      "soTien": null,
      "giam": null,
      "daNhan": 0,
      "trangThai": "chuaTinh",
      "chiTiet": null,
      "thanhToanLuc": null,
      "maGiaoDich": null,
      "hinhThuc": null
    },
    "hoaDonDienTu": {
      "so": null,
      "kyHieu": null,
      "maCQT": null,
      "xuatLuc": null,
      "linkXem": null,
      "linkPdf": null,
      "loi": null
    },
    "phieuBaoHanh": null,
    "danhGia": {
      "guiLuc": null,
      "luc": null,
      "soSao": null,
      "token": null
    },
    "nguon": {
      "kenh": "QR cây xăng",
      "utmSource": "google",
      "utmMedium": "cpc",
      "utmCampaign": "",
      "maQR": "",
      "trangVao": "/dich-vu/ac-quy/",
      "referrer": ""
    },
    "tichHop": {
      "dieuPhoiId": null,
      "guiDieuPhoiLuc": null,
      "loiDieuPhoi": null,
      "xacNhanKenh": null,
      "xacNhanLuc": null,
      "loiThongBao": null
    },
    "tokenTheoDoi": "nowWuF26fljUm98Qo_vrSet-8tLDv63d",
    "ketThucLuc": null,
    "hetHanLinkLuc": null,
    "updatedAt": "2026-10-08T11:54:27.275Z",
    "createdAt": "2026-10-08T11:54:27.031Z"
  },
  "maDon": "TT-000069",
  "phienBan": 1,
  "tieuDe": "TT-000069 · báo giá",
  "trangThai": "choDuyet",
  "chanDoan": "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.",
  "hangMuc": [
    {
      "id": "6ac78473f10bf73502bb8ad8",
      "ma": "aq",
      "ten": "Ắc quy 12V 45Ah",
      "loai": "phuTung",
      "gia": 1650000,
      "lyDo": "Điện áp khởi động 8,9V, dưới mức an toàn",
      "batBuoc": true,
      "mucDo": "canLamNgay",
      "baoHanhThang": null,
      "hangMucGia": null,
      "quyenLoi": null,
      "anh": []
    },
    {
      "id": "6ac78473f10bf73502bb8ad9",
      "ma": "cong",
      "ten": "Công thay ắc quy",
      "loai": "cong",
      "gia": 150000,
      "lyDo": "Gồm lưu bộ nhớ xe",
      "batBuoc": true,
      "mucDo": "canLamNgay",
      "baoHanhThang": null,
      "hangMucGia": null,
      "quyenLoi": null,
      "anh": []
    },
    "… (còn 2 mục)"
  ],
  "tongNeuLamHet": 2200000,
  "taoBoi": "Điều phối thử",
  "ketQua": {
    "luc": null,
    "sdt": null,
    "boHangMuc": [],
    "tienCong": null,
    "phuTung": null,
    "lyDoTuChoi": null,
    "banChup": null
  },
  "updatedAt": "2026-10-08T11:54:27.387Z",
  "createdAt": "2026-10-08T11:54:27.387Z"
}
```
<!-- /vi-du -->

### Khách: `GET /api/don-hang/theo-doi/:token/bao-gia`, `POST .../bao-gia/duyet`, `POST .../bao-gia/tu-choi`
- Xem (màn `BaoGia`): hạng mục chia theo `mucDo`, ảnh lỗi qua `GET .../theo-doi/:token/anh/:id`, tổng tiền.
- Duyệt: `{ "boHangMuc": ["<ma>", ...], "dongY": true }`. `dongY` là ô "Tôi đồng ý báo giá" (bắt buộc). Không bỏ được hạng mục
  `batBuoc`. Lưu bản chụp giá và lúc duyệt; đơn sang `dangSua`.
- Từ chối: `{ "lyDo"? }`. Đơn chuyển sang `choThanhToan` với số tiền = phí kiểm tra (`bang-gia-chung.phiKiemTra`).

<!-- vi-du:xem-bao-gia -->
Request:
```http
GET /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/bao-gia
```
Response `200`:
```json
{
  "ma": "TT-000069",
  "xe": {
    "ten": "Toyota Vios",
    "bienSo": "30A-123.45"
  },
  "tho": {
    "ten": "Trần Minh Đức",
    "vietTat": "MĐ",
    "anh": null,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "soNamNghe": 7,
    "chungChi": [
      "VCedu Bảo dưỡng",
      "VCedu Phanh, gầm"
    ],
    "bienSoXeVan": "29H-512.36"
  },
  "baoGia": {
    "id": 49,
    "lan": 1,
    "phatSinh": false,
    "trangThai": "choDuyet",
    "chanDoan": "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.",
    "hangMuc": [
      {
        "ma": "aq",
        "ten": "Ắc quy 12V 45Ah",
        "lyDo": "Điện áp khởi động 8,9V, dưới mức an toàn",
        "loai": "phuTung",
        "loaiNhan": "Phụ tùng",
        "gia": 1650000,
        "giaHienThi": "1.650.000đ",
        "batBuoc": true,
        "tuyChon": false,
        "mucDo": "canLamNgay",
        "mucDoNhan": "Cần làm ngay",
        "anh": []
      },
      {
        "ma": "cong",
        "ten": "Công thay ắc quy",
        "lyDo": "Gồm lưu bộ nhớ xe",
        "loai": "cong",
        "loaiNhan": "Tiền công",
        "gia": 150000,
        "giaHienThi": "150.000đ",
        "batBuoc": true,
        "tuyChon": false,
        "mucDo": "canLamNgay",
        "mucDoNhan": "Cần làm ngay",
        "anh": []
      },
      "… (còn 2 mục)"
    ],
    "tongNeuLamHet": 2200000,
    "ketQua": null,
    "taoLuc": "2026-10-08T11:54:27.387Z"
  },
  "daDuyetTruoc": [],
  "phiDiLai": 50000,
  "phiKiemTra": 100000,
  "khuyenMai": {
    "ma": "XANG-TDH12",
    "kieuGiam": "phanTram",
    "giaTri": 10,
    "giamToiDa": 100000
  }
}
```
<!-- /vi-du -->

<!-- vi-du:duyet-bao-gia-loi -->
Bỏ hạng mục bắt buộc:

Request:
```http
POST /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/bao-gia/duyet

{
  "boHangMuc": [
    "aq"
  ],
  "dongY": true
}
```
Response `400`:
```json
{
  "loi": "\"Ắc quy 12V 45Ah\" là hạng mục bắt buộc, không bỏ được.",
  "ma": "BO_HANG_MUC_SAI"
}
```
<!-- /vi-du -->

<!-- vi-du:duyet-bao-gia -->
Request:
```http
POST /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/bao-gia/duyet

{
  "boHangMuc": [
    "gat"
  ],
  "dongY": true
}
```
Response `200`:
```json
{
  "baoGia": {
    "id": 49,
    "lan": 1,
    "phatSinh": false,
    "trangThai": "daDuyet",
    "chanDoan": "Ắc quy chỉ còn 8,9V khi đề, cần thay mới.",
    "hangMuc": [
      {
        "ma": "aq",
        "ten": "Ắc quy 12V 45Ah",
        "lyDo": "Điện áp khởi động 8,9V, dưới mức an toàn",
        "loai": "phuTung",
        "loaiNhan": "Phụ tùng",
        "gia": 1650000,
        "giaHienThi": "1.650.000đ",
        "batBuoc": true,
        "tuyChon": false,
        "mucDo": "canLamNgay",
        "mucDoNhan": "Cần làm ngay",
        "anh": []
      },
      {
        "ma": "cong",
        "ten": "Công thay ắc quy",
        "lyDo": "Gồm lưu bộ nhớ xe",
        "loai": "cong",
        "loaiNhan": "Tiền công",
        "gia": 150000,
        "giaHienThi": "150.000đ",
        "batBuoc": true,
        "tuyChon": false,
        "mucDo": "canLamNgay",
        "mucDoNhan": "Cần làm ngay",
        "anh": []
      },
      "… (còn 2 mục)"
    ],
    "tongNeuLamHet": 2200000,
    "ketQua": {
      "luc": "2026-10-08T11:54:27.657Z",
      "boHangMuc": [
        "gat"
      ],
      "tienCong": 270000,
      "phuTung": 1650000,
      "lyDoTuChoi": null
    },
    "taoLuc": "2026-10-08T11:54:27.387Z"
  },
  "trangThai": "dangSua"
}
```
<!-- /vi-du -->

<!-- vi-du:tu-choi -->
Request:
```http
POST /api/don-hang/theo-doi/ubkSnVU8wy7dpFaJJfF2sLCun0T9a514/bao-gia/tu-choi

{
  "lyDo": "Để tự mua ắc quy"
}
```
Response `200`:
```json
{
  "trangThai": "choThanhToan",
  "thongBao": "Đơn kết thúc. Bạn chỉ trả phí kiểm tra 100.000đ."
}
```
<!-- /vi-du -->

### Xong việc: `POST /api/don-hang/:ma/xong`
`{ "soKm"? }`. Tính tiền: hạng mục đã duyệt (mọi báo giá) + phí đi lại − giảm từ mã khuyến mãi. Đơn sang `choThanhToan`,
gửi tin mời thanh toán. Thu tiền mặt / quẹt thẻ: `POST /api/don-hang/:ma/thu-tay` `{ "soTien" }` (ghi một giao dịch tay).

<!-- vi-du:xong -->
Request:
```http
POST /api/don-hang/TT-000069/xong

{
  "soKm": 48200
}
```
Response `200`:
```json
{
  "id": 121,
  "ma": "TT-000069",
  "loai": "datLich",
  "uuTien": 0,
  "trangThai": "choThanhToan",
  "lichSuTrangThai": [
    {
      "id": "6ac78473f10bf73502bb8ad5",
      "trangThai": "daNhan",
      "luc": "2026-10-08T11:54:27.023Z",
      "boi": "Khách (web)",
      "ghiChu": null
    },
    {
      "id": "6ac78473f10bf73502bb8ad6",
      "trangThai": "daXepTho",
      "luc": "2026-10-08T11:54:27.135Z",
      "boi": "Điều phối thử",
      "ghiChu": null
    },
    "… (còn 4 mục)"
  ],
  "ghiChuNoiBo": null,
  "dichVu": [
    {
      "id": 2,
      "ma": "AQ",
      "ten": "Ắc quy",
      "slug": "ac-quy",
      "moTaNgan": "Kích nổ, đo, thay mới tại chỗ",
      "ghiChuBangGia": "Đo miễn phí trước, ắc quy còn tốt thì thợ nói thật, không ép thay.",
      "nutKeuGoi": "Gọi thợ thay ắc quy",
      "thoiGianLam": "20–30 phút",
      "thuTu": 2,
      "nhanDatLich": true,
      "baoGiaSoBo": true,
      "hienTrenBangGia": true,
      "updatedAt": "2026-10-08T11:11:11.085Z",
      "createdAt": "2026-10-08T11:11:11.085Z"
    }
  ],
  "suCo": null,
  "trieuChung": "Sáng đề không nổ, đèn táp-lô mờ",
  "tep": [],
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "10-12",
    "nhan": "10h – 12h, 11/10",
    "batDauLuc": "2026-10-11T03:00:00.000Z"
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000,
    "phanKhuc": "B",
    "dong": [
      {
        "tu": 150000,
        "den": 150000,
        "ten": "Công thay ắc quy",
        "loai": "cong",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "150.000đ"
      },
      {
        "tu": 1350000,
        "den": 2000000,
        "ten": "Ắc quy 12V",
        "loai": "phuTung",
        "coThe": false,
        "dichVu": "ac-quy",
        "hienThi": "1.350.000 – 2.000.000đ"
      },
      "… (còn 1 mục)"
    ]
  },
  "xe": {
    "hang": {
      "id": 1,
      "ten": "Toyota",
      "slug": "toyota",
      "thuTu": 1,
      "maVCparts": "TOYOTA",
      "nguon": "vcparts",
      "updatedAt": "2026-10-08T11:11:11.356Z",
      "createdAt": "2026-10-08T11:11:11.356Z"
    },
    "dong": {
      "id": 1,
      "hang": 1,
      "ten": "Vios",
      "tenDayDu": "Toyota Vios",
      "slug": "toyota-vios",
      "phanKhuc": "B",
      "goiYPhanKhuc": "B",
      "canGan": false,
      "doiTu": 2014,
      "doiDen": 2026,
      "xeDien": false,
      "maVCparts": "TOYOTA-VIOS",
      "nguon": "vcparts",
      "dongBoLuc": "2026-10-08T11:11:11.351Z",
      "updatedAt": "2026-10-08T11:11:13.396Z",
      "createdAt": "2026-10-08T11:11:11.362Z"
    },
    "tenXe": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45",
    "soKm": 48000,
    "phanKhuc": "B"
  },
  "viTri": {
    "diaChi": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy",
    "lat": 21.0325,
    "lng": 105.79,
    "quan": {
      "id": 1,
      "ten": "Cầu Giấy",
      "slug": "cau-giay",
      "thanhPho": "Hà Nội",
      "etaTu": 25,
      "etaDen": 40,
      "ghiChu": "Dữ liệu mẫu: đo lại thời gian tới thực tế.",
      "ranhGioi": null,
      "dangPhucVu": true,
      "thuTu": 1,
      "updatedAt": "2026-10-08T11:11:13.493Z",
      "createdAt": "2026-10-08T11:11:13.493Z"
    },
    "phuong": "Dịch Vọng Hậu",
    "trongVung": true,
    "etaTu": 25,
    "etaDen": 40,
    "choDo": "ham",
    "ghiChuChoTho": "Hầm B2, ô 112"
  },
  "khach": {
    "hoTen": "Nguyễn Văn Hoàng",
    "sdt": "0912366957"
  },
  "hoaDon": {
    "can": null,
    "mst": null,
    "tenCongTy": null,
    "diaChi": null,
    "email": null
  },
  "maGioiThieu": null,
  "maKhuyenMai": "XANG-TDH12",
  "gioiThieu": null,
  "gioiThieuApDung": false,
  "hoiVien": null,
  "dongY": {
    "dongYXuLyDuLieu": true,
    "dongYLuc": "2026-10-08T11:54:27.018Z",
    "nhacBaoDuongZalo": true
  },
  "tho": {
    "id": 1,
    "ten": "Trần Minh Đức",
    "sdt": null,
    "maBenDieuPhoi": "THO-1",
    "anh": null,
    "soNamNghe": 7,
    "bienSoXeVan": "29H-512.36",
    "khuVuc": [
      1
    ],
    "chungChi": [
      {
        "id": "6ac77a521b2df71b91e30e6f",
        "ten": "VCedu Bảo dưỡng"
      },
      {
        "id": "6ac77a521b2df71b91e30e70",
        "ten": "VCedu Phanh, gầm"
      }
    ],
    "gioiThieu": "DỮ LIỆU MẪU",
    "dangHoatDong": true,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "viTri": {
      "lat": 21.0298,
      "lng": 105.7931,
      "luc": "2026-10-08T11:54:27.235Z"
    },
    "updatedAt": "2026-10-08T11:54:27.243Z",
    "createdAt": "2026-10-08T11:11:14.430Z"
  },
  "thoDuKienDenLuc": "2026-10-08T12:19:27.063Z",
  "viTriTho": {
    "lat": 21.0298,
    "lng": 105.7931,
    "luc": "2026-10-08T11:54:27.235Z"
  },
  "ketQua": "binhThuong",
  "khuyenMai": {
    "id": 1,
    "ma": "XANG-TDH12",
    "loai": "xang",
    "doiTac": "Cây xăng 12 Trần Duy Hưng",
    "kieuGiam": "phanTram",
    "giaTri": 10,
    "giamToiDa": 100000,
    "batDau": "2026-01-01T00:00:00.000Z",
    "hetHan": "2027-12-31T00:00:00.000Z",
    "soLuotToiDa": 300,
    "moiSdtMotLan": true,
    "hoaHongPhanTram": 5,
    "tamDung": false,
    "ghiChu": "DỮ LIỆU MẪU",
    "updatedAt": "2026-10-08T11:11:14.454Z",
    "createdAt": "2026-10-08T11:11:14.454Z"
  },
  "xongLuc": "2026-10-08T11:54:27.866Z",
  "soKmKhiXong": 48200,
  "quyenLoi": {
    "mienDiLai": null,
    "kichNo": 0,
    "vaLop": 0,
    "giamHoiVien": 0,
    "giamMa": 27000,
    "uuTienHoiVien": false
  },
  "thanhToan": {
    "soTien": 1943000,
    "giam": 27000,
    "daNhan": 0,
    "trangThai": "choTien",
    "chiTiet": [
      {
        "ten": "Ắc quy 12V 45Ah",
        "loai": "phuTung",
        "soTien": 1650000
      },
      {
        "ten": "Công thay ắc quy",
        "loai": "cong",
        "soTien": 150000
      },
      "… (còn 3 mục)"
    ],
    "thanhToanLuc": null,
    "maGiaoDich": null,
    "hinhThuc": null
  },
  "hoaDonDienTu": {
    "so": null,
    "kyHieu": null,
    "maCQT": null,
    "xuatLuc": null,
    "linkXem": null,
    "linkPdf": null,
    "loi": null
  },
  "phieuBaoHanh": null,
  "danhGia": {
    "guiLuc": null,
    "luc": null,
    "soSao": null,
    "token": null
  },
  "nguon": {
    "kenh": "QR cây xăng",
    "utmSource": "google",
    "utmMedium": "cpc",
    "utmCampaign": "",
    "maQR": "",
    "trangVao": "/dich-vu/ac-quy/",
    "referrer": ""
  },
  "tichHop": {
    "dieuPhoiId": null,
    "guiDieuPhoiLuc": null,
    "loiDieuPhoi": null,
    "xacNhanKenh": null,
    "xacNhanLuc": null,
    "loiThongBao": null
  },
  "tokenTheoDoi": "nowWuF26fljUm98Qo_vrSet-8tLDv63d",
  "ketThucLuc": null,
  "hetHanLinkLuc": null,
  "updatedAt": "2026-10-08T11:54:27.900Z",
  "createdAt": "2026-10-08T11:54:27.031Z"
}
```
<!-- /vi-du -->

### Thanh toán VietQR: `GET /api/don-hang/theo-doi/:token/thanh-toan`
Màn `ThanhToan`: chi tiết tiền, `vietQR.chuoi` (chuỗi EMVCo, dùng để tự vẽ QR) và `vietQR.anh` (PNG data URL vẽ sẵn),
`chuyenKhoan` (ngân hàng, số tài khoản, chủ tài khoản, số tiền còn lại, **nội dung `TT000123`**). Hỏi lại mỗi 5 giây
đến khi `trangThai = daThanhToan`. Cấu hình tài khoản trong `cai-dat` tab "Ngân hàng (VietQR)"; chưa nhập thì `chuyenKhoan`,
`vietQR` là `null` (giao diện mời gọi hotline). Dòng `loai: "quyenLoi"` / `"giam"` là số âm (hội viên, giới thiệu, mã khuyến mãi).

`thanhToan.trangThai`: `chuaTinh` | `choTien` | `thieu` (đã nhận một phần, QR hiện số còn lại) | `daThanhToan`.

<!-- vi-du:xem-thanh-toan -->
`vietQR.anh` là ảnh PNG dạng data URL (rút gọn ở đây):

Request:
```http
GET /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/thanh-toan
```
Response `200`:
```json
{
  "ma": "TT-000069",
  "xe": {
    "ten": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45"
  },
  "tho": {
    "ten": "Trần Minh Đức",
    "vietTat": "MĐ",
    "anh": null,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "soNamNghe": 7,
    "chungChi": [
      "VCedu Bảo dưỡng",
      "VCedu Phanh, gầm"
    ],
    "bienSoXeVan": "29H-512.36"
  },
  "xongLuc": "2026-10-08T11:54:27.866Z",
  "trangThai": "choTien",
  "daThanhToan": false,
  "hangMuc": [
    {
      "ten": "Ắc quy 12V 45Ah",
      "loai": "phuTung",
      "soTien": 1650000,
      "hienThi": "1.650.000đ"
    },
    {
      "ten": "Công thay ắc quy",
      "loai": "cong",
      "soTien": 150000,
      "hienThi": "150.000đ"
    },
    "… (còn 3 mục)"
  ],
  "tong": 1943000,
  "tongHienThi": "1.943.000đ",
  "daNhan": 0,
  "conPhaiTra": 1943000,
  "chuyenKhoan": {
    "nganHang": "Vietcombank – CN Hà Nội (MẪU)",
    "soTaiKhoan": "1023456789",
    "chuTaiKhoan": "CONG TY TNHH THOTOI MAU",
    "soTien": 1943000,
    "soTienHienThi": "1.943.000đ",
    "noiDung": "TT000069"
  },
  "vietQR": {
    "chuoi": "00020101021238540010A00000072701240006970436011010234567890208QRIBFTTA5303704540719430005802VN62120808TT0000696304A8E5",
    "anh": "data:image/png;base64,iVBORw0KGgoAAAANSU…"
  },
  "bienNhan": null,
  "hoaDon": null,
  "baoHanh": null,
  "sdtNhanHoaDon": "0912 xxx 957",
  "hotline": "1900 1068",
  "hetHanLinkLuc": null
}
```
<!-- /vi-du -->

### Webhook ngân hàng: `POST /api/thanh-toan/webhook`
Ai gọi: SePay (header `Authorization: Apikey <NGAN_HANG_WEBHOOK_KEY>`) hoặc Casso (header `secure-token`), chọn bằng
`NGAN_HANG_NHA_CUNG_CAP`. Sai khoá: 401. Đọc mã `TT123456` (hoặc `HV123456` cho gói hội viên, mục 8) trong nội dung chuyển khoản,
cộng vào đơn. Mỗi giao dịch ghi một dòng `giao-dich` (khoá duy nhất theo mã giao dịch ngân hàng: gửi lại không cộng hai lần),
`ketQua`: `du` | `thieu` | `khongThayDon` | `trung`. Luôn trả 200 khi đã ghi, kể cả không khớp đơn (để đối soát tay).

<!-- vi-du:webhook -->
Định dạng SePay (Casso: `{ error: 0, data: [{ tid, amount, description, when }] }` + header `secure-token`). Ví dụ chuyển thiếu:

Request:
```http
POST /api/thanh-toan/webhook

{
  "id": 92704,
  "gateway": "Vietcombank",
  "transactionDate": "2026-10-08 11:47:02",
  "accountNumber": "1023456789",
  "content": "NGUYEN VAN HOANG chuyen tien TT000069",
  "transferType": "in",
  "transferAmount": 1000000,
  "referenceCode": "FT1791460468061"
}
```
Response `200`:
```json
{
  "success": true,
  "ketQua": [
    {
      "ketQua": "thieu",
      "maGiaoDich": "FT1791460468061",
      "maDon": "TT-000069",
      "daNhan": 1000000,
      "canTra": 1943000
    }
  ]
}
```
<!-- /vi-du -->

<!-- vi-du:gia-lap-tien-ve -->
Chỉ có khi ngân hàng chạy giả lập (máy chạy thử, kiểm thử end-to-end):

Request:
```http
POST /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/gia-lap-tien-ve
```
Response `200`:
```json
{
  "ketQua": "du",
  "maGiaoDich": "GIALAP1791460468159",
  "maDon": "TT-000069",
  "daNhan": 1943000,
  "canTra": 1943000
}
```
<!-- /vi-du -->

<!-- vi-du:da-thanh-toan -->
Request:
```http
GET /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/thanh-toan
```
Response `200`:
```json
{
  "ma": "TT-000069",
  "xe": {
    "ten": "Toyota Vios",
    "doi": 2019,
    "bienSo": "30A-123.45"
  },
  "tho": {
    "ten": "Trần Minh Đức",
    "vietTat": "MĐ",
    "anh": null,
    "diemSao": 4.9,
    "soDanhGia": 214,
    "soNamNghe": 7,
    "chungChi": [
      "VCedu Bảo dưỡng",
      "VCedu Phanh, gầm"
    ],
    "bienSoXeVan": "29H-512.36"
  },
  "xongLuc": "2026-10-08T11:54:27.866Z",
  "trangThai": "daThanhToan",
  "daThanhToan": true,
  "hangMuc": [
    {
      "ten": "Ắc quy 12V 45Ah",
      "loai": "phuTung",
      "soTien": 1650000,
      "hienThi": "1.650.000đ"
    },
    {
      "ten": "Công thay ắc quy",
      "loai": "cong",
      "soTien": 150000,
      "hienThi": "150.000đ"
    },
    "… (còn 3 mục)"
  ],
  "tong": 1943000,
  "tongHienThi": "1.943.000đ",
  "daNhan": 1943000,
  "conPhaiTra": 0,
  "chuyenKhoan": {
    "nganHang": "Vietcombank – CN Hà Nội (MẪU)",
    "soTaiKhoan": "1023456789",
    "chuTaiKhoan": "CONG TY TNHH THOTOI MAU",
    "soTien": 0,
    "soTienHienThi": "0đ",
    "noiDung": "TT000069"
  },
  "vietQR": null,
  "bienNhan": {
    "soTien": 1943000,
    "luc": "2026-10-08T11:54:28.159Z",
    "hinhThuc": "Chuyển khoản VietQR",
    "maGiaoDich": "GIALAP1791460468159"
  },
  "hoaDon": {
    "so": "0468319",
    "kyHieu": "1C26TTT",
    "maCQT": "GIALAP-0468319",
    "linkXem": null,
    "linkPdf": null
  },
  "baoHanh": {
    "ma": "BH-000029",
    "bienSo": "30A-123.45",
    "hangMuc": [
      {
        "ten": "Ắc quy 12V 45Ah (phụ tùng)",
        "loai": "phuTung",
        "tuNgay": "2026-10-08T11:54:28.159Z",
        "denNgay": "2027-04-08T11:54:28.159Z",
        "conNgay": 182,
        "phanTram": 100,
        "hetHan": false
      },
      {
        "ten": "Công thay ắc quy (công)",
        "loai": "cong",
        "tuNgay": "2026-10-08T11:54:28.159Z",
        "denNgay": "2027-01-08T11:54:28.159Z",
        "conNgay": 92,
        "phanTram": 100,
        "hetHan": false
      },
      "… (còn 1 mục)"
    ]
  },
  "sdtNhanHoaDon": "0912 xxx 957",
  "hotline": "1900 1068",
  "hetHanLinkLuc": "2026-10-09T11:54:28.273Z"
}
```
<!-- /vi-du -->

### Hoá đơn điện tử, phiếu bảo hành
- Đủ tiền thì tự gọi nhà cung cấp hoá đơn (adapter `lib/tich-hop/hoa-don.ts`, `HOA_DON_URL`, `HOA_DON_KEY`). Đơn có
  `hoaDon.can` (mã số thuế) thì xuất cho công ty, không thì xuất cho người mua lẻ. Kết quả trong `don.hoaDonDienTu`
  (`so`, `kyHieu`, `linkPdf`, `trangThai`, `loi`). Lỗi thì đơn vẫn `hoanThanh`, quản trị bấm xuất lại trong admin.
- Gửi lại hoá đơn: `POST /api/don-hang/theo-doi/:token/gui-hoa-don` `{ "kenh": "zalo" }` hoặc `{ "kenh": "email", "email" }`
  (3 lần/giờ).
- Phiếu bảo hành `BH-000123`: tạo cùng lúc, mỗi hạng mục đã duyệt một dòng `tuNgay`/`denNgay` theo `baoHanhThang`.
  Xem trong tra cứu lịch sử xe và admin (`/api/phieu-bao-hanh`).

<!-- vi-du:gui-hoa-don -->
Request:
```http
POST /api/don-hang/theo-doi/nowWuF26fljUm98Qo_vrSet-8tLDv63d/gui-hoa-don

{
  "kenh": "zalo"
}
```
Response `200`:
```json
{
  "daGui": "zalo",
  "toi": "0912 xxx 957"
}
```
<!-- /vi-du -->

### Đánh giá, khiếu nại: `GET/POST /api/don-hang/danh-gia/:token`
Link riêng `/don/<tokenDanhGia>/danh-gia/` gửi qua Zalo 24 giờ sau khi xong (việc định kỳ), khác link theo dõi. Dùng một lần.
- `GET`: thông tin đơn (thợ, việc, ngày), danh sách `vanDe`, đã gửi chưa.
- `POST { "soSao": 1..5, "vanDe"?: ["tre"|"thaido"|"gia"|"chatluong"|"vesinh"|"khac"], "moTa"?, "sdtGoiLai"? }`.
  4–5 sao: lưu đánh giá (chờ duyệt hiển thị), trả `linkGoogle` để mời viết trên Google. 1–3 sao: mở phiếu khiếu nại `KN-`,
  báo CSKH (SMS nội bộ), trả hạn gọi lại (`cai-dat.cskhGoiLaiGio`). Gửi lần hai: 409 `DA_DANH_GIA`.

<!-- vi-du:xem-danh-gia -->
Request:
```http
GET /api/don-hang/danh-gia/pw8jtVYPmZ5qgYgxXlaIYPTn6ZLGLdu9
```
Response `200`:
```json
{
  "ma": "TT-000055",
  "daDanhGia": false,
  "xe": {
    "ten": "Toyota Vios",
    "doi": null,
    "bienSo": "30K-939.39"
  },
  "tho": {
    "ten": "Thợ kiểm thử kt1-1791458819126",
    "vietTat": "TK",
    "anh": null,
    "diemSao": 4.9,
    "soDanhGia": 101,
    "soNamNghe": null,
    "chungChi": [],
    "bienSoXeVan": null
  },
  "dichVu": [
    "Ắc quy"
  ],
  "ngay": "2026-10-08T11:51:03.742Z",
  "noiLam": "18 Trần Thái Tông, phường Dịch Vọng Hậu, Cầu Giấy, Cầu Giấy",
  "vanDe": [
    {
      "ma": "tre",
      "nhan": "Thợ đến trễ"
    },
    {
      "ma": "thaido",
      "nhan": "Thái độ thợ"
    },
    "… (còn 4 mục)"
  ],
  "linkGoogle": "https://g.page/r/MAU/review",
  "hotline": "1900 1068"
}
```
<!-- /vi-du -->

<!-- vi-du:gui-danh-gia -->
Request:
```http
POST /api/don-hang/danh-gia/pw8jtVYPmZ5qgYgxXlaIYPTn6ZLGLdu9

{
  "soSao": 2,
  "vanDe": [
    "tre"
  ],
  "moTa": "Thợ đến trễ gần 40 phút so với giờ hẹn, không báo trước.",
  "sdtGoiLai": "0912345678"
}
```
Response `200`:
```json
{
  "soSao": 2,
  "ketQua": "khieuNai",
  "maPhieu": "KN-000011",
  "maDon": "TT-000055",
  "vanDe": [
    "tre"
  ],
  "guiLuc": "2026-10-08T11:54:29.207Z",
  "cskh": "Chị Ngọc (CSKH, mẫu)",
  "goiLaiTrongGio": 2,
  "hanGoiLai": "2026-10-08T13:54:29.249Z"
}
```
<!-- /vi-du -->

<!-- vi-du:gui-danh-gia-lai -->
Dùng lại link:

Request:
```http
POST /api/don-hang/danh-gia/pw8jtVYPmZ5qgYgxXlaIYPTn6ZLGLdu9

{
  "soSao": 5
}
```
Response `409`:
```json
{
  "loi": "Link đánh giá chỉ dùng một lần, bạn đã đánh giá đơn này rồi.",
  "ma": "DA_DANH_GIA"
}
```
<!-- /vi-du -->

### Tra cứu lịch sử xe: `/api/tra-cuu-xe/...`
1. `POST /gui-ma { "bienSo" }`: gửi mã 6 số qua Zalo (không có Zalo thì SMS) tới SĐT của đơn gần nhất của biển số. Mã sống
   5 phút, gửi lại sau 45 giây; 5 lần/giờ mỗi biển số. Biển số chưa có đơn: 404 `KHONG_CO_XE`. `maGiaLap` chỉ có khi tin
   nhắn đang chạy giả lập (máy chạy thử).
2. `POST /xac-nhan { "bienSo", "ma" }`: đúng thì trả `phien`; sai trả 400 `MA_SAI` + `conLanThu`; sai 5 lần: 429.
3. `GET /lich-su` với header `Authorization: Phien <phien>`: xe, số km gần nhất, bảo hành còn lại, mốc bảo dưỡng tiếp theo,
   lịch sử sửa (kèm hoá đơn). Phiên tự đóng sau 30 phút không dùng: 401 `HET_PHIEN`. `POST /thoat` để đóng ngay.

<!-- vi-du:tra-cuu-gui-ma -->
Request:
```http
POST /api/tra-cuu-xe/gui-ma

{
  "bienSo": "30a12345"
}
```
Response `429`:
```json
{
  "loi": "Vui lòng chờ 26 giây rồi gửi lại mã.",
  "ma": "GUI_LAI_QUA_NHANH",
  "guiLaiSauGiay": 26
}
```
<!-- /vi-du -->

<!-- vi-du:tra-cuu-xac-nhan -->
Request:
```http
POST /api/tra-cuu-xe/xac-nhan

{
  "bienSo": "30A-123.45"
}
```
Response `400`:
```json
{
  "loi": "Nhập đủ biển số và mã 6 số.",
  "ma": "DU_LIEU_SAI"
}
```
<!-- /vi-du -->

<!-- vi-du:tra-cuu-lich-su -->
Header `Authorization: Phien <phien>`:

Request:
```http
GET /api/tra-cuu-xe/lich-su
```
Response `401`:
```json
{
  "loi": "Phiên xem đã đóng sau 30 phút không dùng. Nhập lại biển số.",
  "ma": "HET_PHIEN"
}
```
<!-- /vi-du -->

### Tin Zalo ZNS
Adapter `lib/tich-hop/thong-bao.ts`. Mỗi bước một mẫu ZNS (biến môi trường `ZALO_ZNS_MAU_*`): `xacNhan`, `daXepTho`,
`baoGia`, `thanhToan`, `hoanThanh`, `danhGia`, `maXacNhan`, `hoaDon`; P2: `hoiVienThanhToan`, `hoiVienKichHoat`,
`hoiVienSapHet`, `maGioiThieu`, `gioiThieuThuong`. Không gửi được ZNS (số chưa có Zalo, mẫu chưa duyệt)
thì gửi SMS cùng nội dung. Mọi tin ghi vào `tin-nhan` (đọc: vai trò xử lý đơn), số điện thoại đã che.

## 7. Quản trị (P1)

### Vai trò
`quanTri`, `quanLyDichVu` (giá, dịch vụ, duyệt bài), `bienTap` (VCmedia: viết nháp, gửi duyệt), `marketing` (mã khuyến mãi,
số liệu, viết nháp). `dieuPhoi` là tài khoản máy của VCsoft. Bảng quyền ở cuối tài liệu.

### Bài viết, trang khu vực, trang hãng xe
Bốn loại có cùng quy trình: `cam-nang`, `dich-vu`, `trang-khu-vuc`, `trang-hang-xe` (REST Payload, bản nháp `?draft=true`).
`trangThaiDuyet`: `nhap` → `choDuyet` → (`daHenGio` + `henGioDang`) → đăng. Người viết chỉ đưa tới `choDuyet`; người duyệt
(`quanTri`, `quanLyDichVu`) hẹn giờ hoặc đăng. Gửi duyệt / đăng bị chặn (400 kèm danh sách lỗi) khi không qua kiểm tra
(`lib/kiem-tra.mjs`). Trang khu vực thêm điều kiện chống trang trùng: đoạn riêng ≥ 150 chữ, ≥ 2 ảnh thật, ≥ 1 đánh giá
thật trong quận, trùng nội dung với trang khu vực khác ≤ 70%.

- Danh sách (màn `QtBaiViet`): `GET /api/quan-tri/bai-viet?loai=cam-nang|dich-vu|khu-vuc|hang-xe&trangThai=nhap|choDuyet|daHenGio|daDang&q=`.
- Tạo trang khu vực từ mẫu: `POST /api/trang-khu-vuc/tao-tu-mau { "dichVu": "<slug>", "quan": "<slug>" }`: điền sẵn
  tiêu đề, từ khoá, FAQ, đánh giá thật trong quận; đoạn riêng và ảnh thật để người viết bổ sung.
- Trình soạn thảo có khối `khoiGia` (bảng giá dịch vụ), `khoiDatLich` (nút đặt lịch), `videoYoutube`.
- Bài hẹn giờ được đăng bởi việc định kỳ (dưới).

<!-- vi-du:bai-viet -->
Đăng nhập biên tập:

Request:
```http
GET /api/quan-tri/bai-viet?loai=khu-vuc
```
Response `200`:
```json
{
  "bai": [
    {
      "id": 14,
      "collection": "trang-khu-vuc",
      "loai": "khu-vuc",
      "loaiNhan": "Trang khu vực",
      "tieuDe": "Đọc lỗi, chẩn đoán ô tô tận nơi Ba Đình, thợ tới 35–50 phút",
      "title": "Đọc lỗi, chẩn đoán ô tô tận nơi Ba Đình, thợ tới 35–50 phút",
      "description": "Thợ ThợTới tới tận nơi ở Ba Đình: máy đọc lỗi, đèn báo. Có mặt dự kiến 35–50 phút, báo giá trước khi làm, bảo hành 6 tháng phụ tùng.",
      "duongDan": "/dich-vu/doc-loi-chan-doan/ba-dinh/",
      "trangThai": "nhap",
      "trangThaiDuyet": "nhap",
      "daDang": false,
      "tacGia": "Nguyễn Lan Phương (thử)",
      "nguoiDuyet": null,
      "henGioDang": null,
      "capNhat": "2026-10-08T11:54:10.839Z",
      "ngay": "2026-10-08T11:54:10.838Z",
      "chuDe": null,
      "ketQuaKiemTra": "169 chữ\n✗ Bài có 169 chữ, cần tối thiểu 250\n✗ Đoạn mô tả riêng có 0 chữ, cần tối thiểu 150 (khu chung cư, tuyến đường, lỗi khách hay gặp ở quận này)\n✗ Có 0 ảnh thật, cần ít nhất 2\n✗ Chưa gắn đánh giá thật nào của khách ở quận này",
      "ghiChuDuyet": "",
      "sua": "/admin/collections/trang-khu-vuc/14"
    },
    {
      "id": 13,
      "collection": "trang-khu-vuc",
      "loai": "khu-vuc",
      "loaiNhan": "Trang khu vực",
      "tieuDe": "Thay má phanh ô tô tận nơi Ba Đình, thợ tới nhanh",
      "title": "Thay má phanh ô tô tận nơi Ba Đình, thợ tới nhanh",
      "description": "Thợ ThợTới tới tận nơi ở Đống Đa: má phanh, dầu phanh. Có mặt dự kiến 30–45 phút, báo giá trước khi làm, bảo hành 6 tháng phụ tùng.",
      "duongDan": "/dich-vu/phanh/ba-dinh/",
      "trangThai": "nhap",
      "trangThaiDuyet": "nhap",
      "daDang": false,
      "tacGia": null,
      "nguoiDuyet": null,
      "henGioDang": null,
      "capNhat": "2026-10-08T11:51:09.819Z",
      "ngay": "2026-10-08T11:51:09.819Z",
      "chuDe": null,
      "ketQuaKiemTra": "520 chữ\n✗ Trùng 100% nội dung với \"Phanh ô tô tận nơi Đống Đa, thợ tới 30–45 phút\": viết lại cho riêng quận này",
      "ghiChuDuyet": "",
      "sua": "/admin/collections/trang-khu-vuc/13"
    },
    "… (còn 3 mục)"
  ],
  "dem": {
    "tatCa": 5,
    "nhap": 4,
    "choDuyet": 1,
    "henGio": 0,
    "daDang": 0
  }
}
```
<!-- /vi-du -->

<!-- vi-du:tao-tu-mau -->
Request:
```http
POST /api/trang-khu-vuc/tao-tu-mau

{
  "dichVu": "doc-loi-chan-doan",
  "quan": "ba-dinh"
}
```
Response `201`:
```json
{
  "id": 15,
  "slug": "doc-loi-chan-doan-ba-dinh",
  "title": "Đọc lỗi, chẩn đoán ô tô tận nơi Ba Đình, thợ tới 35–50 phút",
  "sua": "/admin/collections/trang-khu-vuc/15",
  "ketQuaKiemTra": "169 chữ\n✗ Bài có 169 chữ, cần tối thiểu 250\n✗ Đoạn mô tả riêng có 0 chữ, cần tối thiểu 150 (khu chung cư, tuyến đường, lỗi khách hay gặp ở quận này)\n✗ Có 0 ảnh thật, cần ít nhất 2\n✗ Chưa gắn đánh giá thật nào của khách ở quận này"
}
```
<!-- /vi-du -->

<!-- vi-du:gui-duyet-loi -->
Gửi duyệt khi chưa đủ điều kiện:

Request:
```http
PATCH /api/trang-khu-vuc/15?draft=true

{
  "trangThaiDuyet": "choDuyet"
}
```
Response `400`:
```json
{
  "errors": [
    {
      "message": "Chưa gửi duyệt được, còn 4 lỗi:\n• Bài có 169 chữ, cần tối thiểu 250\n• Đoạn mô tả riêng có 0 chữ, cần tối thiểu 150 (khu chung cư, tuyến đường, lỗi khách hay gặp ở quận này)\n• Có 0 ảnh thật, cần ít nhất 2\n• Chưa gắn đánh giá thật nào của khách ở quận này"
    }
  ]
}
```
<!-- /vi-du -->

### Mã khuyến mãi, hoa hồng: `/api/ma-khuyen-mai/...`
Loại mã: `km` (khuyến mãi, `KM-`), `koc` (`KOC-`), `xang` (QR cây xăng, `XANG-`), `bql` (ban quản lý chung cư, `BQL-`).
Giảm theo % tiền công (có trần) hoặc số tiền cố định; hoa hồng cho đối tác theo % số tiền khách đã trả hoặc cố định mỗi đơn.
Link `?ma=XANG-TDH12` điền sẵn mã vào form đặt; mã lưu vào đơn khi đặt và trừ khi tính tiền.
- `POST /kiem-tra { "ma", "sdt"? }` (công khai): `hopLe`, `moTa` ("Giảm 10% tiền công, tối đa 200.000đ"), hoặc lý do không dùng được.
- `GET /danh-sach` (màn `QtMaKhuyenMai`), `GET /thong-ke`: lượt dùng, doanh thu, hoa hồng theo mã.
- `GET /hoa-hong?thang=2026-10&dinhDang=json|csv|xlsx`: bảng hoa hồng theo đối tác (đơn đã thanh toán trong tháng).
- `GET /:id/qr.png`: QR in cho cây xăng / BQL trỏ tới `/dat-lich/?ma=<mã>`.
- Thêm, sửa: REST `POST/PATCH /api/ma-khuyen-mai` (vai trò `quanTri`, `marketing`).

<!-- vi-du:km-kiem-tra -->
Request:
```http
POST /api/ma-khuyen-mai/kiem-tra

{
  "ma": "xang-tdh12",
  "sdt": "0987000111"
}
```
Response `200`:
```json
{
  "hopLe": true,
  "id": 1,
  "ma": "XANG-TDH12",
  "moTa": "Giảm 10% tiền công (tối đa 100.000đ)",
  "loai": "xang",
  "doiTac": "Cây xăng 12 Trần Duy Hưng"
}
```

Mã hết hạn:

Request:
```http
POST /api/ma-khuyen-mai/kiem-tra

{
  "ma": "KM-XEDIEN"
}
```
Response `200`:
```json
{
  "hopLe": false,
  "ma": "HETHAN",
  "lyDo": "Mã này đã hết hạn."
}
```
<!-- /vi-du -->

<!-- vi-du:km-danh-sach -->
Đăng nhập marketing:

Request:
```http
GET /api/ma-khuyen-mai/danh-sach
```
Response `200`:
```json
{
  "ma": [
    {
      "id": 18,
      "ma": "KM-MK7862",
      "loai": "km",
      "doiTac": null,
      "kieuGiam": "soTien",
      "giaTri": 1,
      "giamToiDa": null,
      "batDau": null,
      "hetHan": null,
      "soLuotToiDa": null,
      "moiSdtMotLan": true,
      "hoaHongPhanTram": 0,
      "tamDung": false,
      "ghiChu": null,
      "updatedAt": "2026-10-08T11:51:07.864Z",
      "createdAt": "2026-10-08T11:51:07.864Z",
      "trangThai": "dangChay",
      "trangThaiNhan": "Đang chạy",
      "daDung": 0,
      "phanTramDaDung": null,
      "moTaGiam": "Giảm 1đ",
      "loaiNhan": "Khuyến mãi",
      "nguonNhan": "Khuyến mãi",
      "linkDatLich": "http://localhost:3000/dat-lich/?ma=KM-MK7862",
      "anhQR": "/api/ma-khuyen-mai/18/qr.png"
    },
    {
      "id": 17,
      "ma": "KM-KT67035-CU",
      "loai": "km",
      "doiTac": null,
      "kieuGiam": "soTien",
      "giaTri": 50000,
      "giamToiDa": null,
      "batDau": null,
      "hetHan": "2020-01-01T00:00:00.000Z",
      "soLuotToiDa": null,
      "moiSdtMotLan": true,
      "hoaHongPhanTram": 0,
      "tamDung": false,
      "ghiChu": null,
      "updatedAt": "2026-10-08T11:51:07.851Z",
      "createdAt": "2026-10-08T11:51:07.851Z",
      "trangThai": "hetHan",
      "trangThaiNhan": "Hết hạn",
      "daDung": 0,
      "phanTramDaDung": null,
      "moTaGiam": "Giảm 50.000đ",
      "loaiNhan": "Khuyến mãi",
      "nguonNhan": "Khuyến mãi",
      "linkDatLich": "http://localhost:3000/dat-lich/?ma=KM-KT67035-CU",
      "anhQR": "/api/ma-khuyen-mai/17/qr.png"
    },
    "… (còn 16 mục)"
  ],
  "loai": {
    "km": {
      "nhan": "Khuyến mãi",
      "tienTo": "KM-",
      "nguon": "Khuyến mãi"
    },
    "koc": {
      "nhan": "KOC",
      "tienTo": "KOC-",
      "nguon": "KOC"
    },
    "xang": {
      "nhan": "Cây xăng",
      "tienTo": "XANG-",
      "nguon": "QR cây xăng"
    },
    "bql": {
      "nhan": "BQL chung cư",
      "tienTo": "BQL-",
      "nguon": "Ban quản lý chung cư"
    }
  }
}
```
<!-- /vi-du -->

<!-- vi-du:km-thong-ke -->
Request:
```http
GET /api/ma-khuyen-mai/thong-ke
```
Response `200`:
```json
{
  "maDangChay": 13,
  "tongMa": 18,
  "luotDungThangNay": 10,
  "phanTramDonThangNay": 14,
  "tongLuotDung": 10,
  "hoaHongThangNay": 1166070,
  "hoaHongThangNayHienThi": "1.166.070đ",
  "soDoiTacThangNay": 5,
  "thang": "2026-10",
  "ngayCuoiThang": "2026-10-31"
}
```
<!-- /vi-du -->

<!-- vi-du:km-hoa-hong -->
Request:
```http
GET /api/ma-khuyen-mai/hoa-hong
```
Response `200`:
```json
{
  "thang": "2026-10",
  "dong": [
    {
      "ma": "XANG-TDH12",
      "loai": "Cây xăng",
      "doiTac": "Cây xăng 12 Trần Duy Hưng",
      "soDon": 5,
      "doanhThu": 9715000,
      "tyLe": 5,
      "hoaHong": 485750,
      "maDon": "TT-000069 TT-000063 TT-000039 TT-000029 TT-000010",
      "doanhThuHienThi": "9.715.000đ",
      "hoaHongHienThi": "485.750đ"
    },
    {
      "ma": "KM-KT67035",
      "loai": "KOC",
      "doiTac": "KT",
      "soDon": 1,
      "doanhThu": 2223000,
      "tyLe": 8,
      "hoaHong": 177840,
      "maDon": "TT-000059",
      "doanhThuHienThi": "2.223.000đ",
      "hoaHongHienThi": "177.840đ"
    },
    "… (còn 3 mục)"
  ],
  "tong": {
    "soDon": 9,
    "doanhThu": 18219000,
    "hoaHong": 1166070,
    "doanhThuHienThi": "18.219.000đ",
    "hoaHongHienThi": "1.166.070đ"
  },
  "soDoiTac": 5
}
```

`GET /api/ma-khuyen-mai/hoa-hong?dinhDang=csv` → `200` `text/csv; charset=utf-8`:
```csv
Mã,Loại,Đối tác,Số đơn đã thanh toán,Doanh thu (đ),Tỷ lệ hoa hồng (%),Hoa hồng (đ),Danh sách mã đơn
XANG-TDH12,Cây xăng,Cây xăng 12 Trần Duy Hưng,5,9715000,5,485750,TT-000069 TT-000063 TT-000039 TT-000029 TT-000010
KM-KT67035,KOC,KT,1,2223000,8,177840,TT-000059
KM-KT26231,KOC,KT,1,2223000,8,177840,TT-000035
KM-KT9426,KOC,KT,1,2223000,8,177840,TT-000023
KOC-LINHXEHOP,KOC,Linh Xế Hộp (TikTok),1,1835000,8,146800,TT-000014
TỔNG,,,9,18219000,,1166070,
```
<!-- /vi-du -->

### Số liệu: `POST /api/su-kien/ghi`, `GET /api/su-kien/bao-cao`
- Ghi (công khai, tối đa 20 sự kiện/lần): `{ "suKien": [{ "loai": "xemTrang"|"bamGoi"|"bamZalo"|"guiForm", "duongDan",
  "nguon": { utm_* }, "phien" }] }`. Đường dẫn bỏ query, link riêng `/don/<token>/` được che. Không lưu IP.
- Báo cáo (màn `QtSoLieu`, vai trò `quanTri`, `quanLyDichVu`, `marketing`): `?ky=ngay|tuan|thang&soKy=6&dinhDang=json|xlsx`.
  KPI (lượt xem, bấm gọi, bấm Zalo, đơn, tỷ lệ đặt lịch so với mục tiêu `cai-dat.mucTieuTyLeDatLich`, doanh thu), đơn theo
  nguồn, trang vào nhiều nhất, đơn mới nhất, đối soát giao dịch chưa khớp. Giờ tính theo giờ Việt Nam.

<!-- vi-du:su-kien -->
Request:
```http
POST /api/su-kien/ghi

{
  "suKien": [
    {
      "loai": "xemTrang",
      "duongDan": "/dich-vu/ac-quy/?utm_source=google",
      "nguon": {
        "utm_source": "google",
        "utm_medium": "cpc"
      },
      "phien": "p-3f9a2c71"
    },
    {
      "loai": "bamGoi",
      "duongDan": "/dich-vu/ac-quy/",
      "nguon": {
        "utm_source": "google"
      },
      "phien": "p-3f9a2c71"
    }
  ]
}
```
Response `202`:
```json
{
  "soGhi": 2
}
```
<!-- /vi-du -->

<!-- vi-du:so-lieu -->
Request:
```http
GET /api/su-kien/bao-cao?ky=thang&soKy=6
```
Response `200`:
```json
{
  "ky": "thang",
  "donVi": "tháng",
  "nhan": [
    "T5/26",
    "T6/26",
    "… (còn 4 mục)"
  ],
  "luotVao": [
    5946,
    5731,
    "… (còn 4 mục)"
  ],
  "soDon": [
    0,
    0,
    "… (còn 4 mục)"
  ],
  "cuocGoi": [
    243,
    255,
    "… (còn 4 mục)"
  ],
  "zalo": [
    188,
    185,
    "… (còn 4 mục)"
  ],
  "tyLe": [
    7.25,
    7.68,
    "… (còn 4 mục)"
  ],
  "mucTieuTyLe": 4,
  "kpi": {
    "luotVao": {
      "giaTri": 1494,
      "thayDoi": -74,
      "donVi": "%"
    },
    "soDon": {
      "giaTri": 67,
      "thayDoi": 100,
      "donVi": "%"
    },
    "tyLe": {
      "giaTri": 12.12,
      "thayDoi": 5.4,
      "donVi": "điểm",
      "datMucTieu": true
    },
    "cuocGoi": {
      "giaTri": 60,
      "thayDoi": -74,
      "donVi": "%"
    },
    "zalo": {
      "giaTri": 54,
      "thayDoi": -66,
      "donVi": "%"
    }
  },
  "donTheoNguon": {
    "Google": [
      0,
      0,
      "… (còn 4 mục)"
    ],
    "Facebook": [
      0,
      0,
      "… (còn 4 mục)"
    ],
    "QR cây xăng": [
      0,
      0,
      "… (còn 4 mục)"
    ],
    "KOC": [
      0,
      0,
      "… (còn 4 mục)"
    ],
    "Giới thiệu": [
      0,
      0,
      "… (còn 4 mục)"
    ],
    "Trực tiếp": [
      0,
      0,
      "… (còn 4 mục)"
    ]
  },
  "nguonKyNay": [
    {
      "kenh": "Trực tiếp",
      "soDon": 38,
      "cuocGoi": 10,
      "zalo": 10,
      "tyTrong": 56.7
    },
    {
      "kenh": "Google",
      "soDon": 13,
      "cuocGoi": 24,
      "zalo": 14,
      "tyTrong": 19.4
    },
    "… (còn 4 mục)"
  ],
  "topTrang": [
    {
      "duongDan": "/dich-vu/ac-quy/cau-giay/",
      "luotVao": 207,
      "soDon": 0,
      "tyLe": 0
    },
    {
      "duongDan": "/dich-vu/ac-quy/",
      "luotVao": 201,
      "soDon": 26,
      "tyLe": 12.9
    },
    "… (còn 7 mục)"
  ],
  "donMoiNhat": [
    {
      "ma": "TT-000070",
      "luc": "2026-10-08T11:54:28.662Z",
      "kenh": "Google",
      "hanhDong": "Gửi form đặt lịch",
      "chiTiet": "Từ trang /dich-vu/ac-quy/"
    },
    {
      "ma": "TT-000069",
      "luc": "2026-10-08T11:54:27.031Z",
      "kenh": "QR cây xăng",
      "hanhDong": "Gửi form đặt lịch",
      "chiTiet": "Mã XANG-TDH12"
    },
    "… (còn 6 mục)"
  ],
  "doiSoat": {
    "kyNay": "T10/26",
    "web": 67,
    "dieuPhoi": null,
    "khop": null
  }
}
```
<!-- /vi-du -->

### Việc định kỳ: `POST /api/viec-dinh-ky`
Gọi mỗi 5 phút (dịch vụ `hen-gio` trong `docker-compose.yml`), header `Authorization: Bearer <VIEC_DINH_KY_KEY>`: gửi link
đánh giá đến hạn, đăng bài đến giờ hẹn, xoá mã xác nhận cũ, chuyển gói hội viên quá hạn và nhắc gia hạn. Chạy lại nhiều lần không sao.

<!-- vi-du:viec-dinh-ky -->
Header `Authorization: Bearer <VIEC_DINH_KY_KEY>` (máy chạy thử không đặt khoá thì bỏ qua):

Request:
```http
POST /api/viec-dinh-ky
```
Response `200`:
```json
{
  "guiLinkDanhGia": 0,
  "dangBaiHenGio": 0,
  "hoiVien": {
    "hetHan": 0,
    "nhacGiaHan": 0
  },
  "luc": "2026-10-08T11:54:30.305Z"
}
```
<!-- /vi-du -->

## 8. Hội viên, giới thiệu, doanh nghiệp, tuyển thợ (P2)

### Gói hội viên (`HoiVien`)
Gói năm gắn **1 biển số**, hiệu lực **12 tháng kể từ lúc thanh toán** (VietQR, nội dung `HV000123`). Biển số đang có gói còn
hạn mà mua tiếp thì gói mới nối tiếp khi gói cũ hết (`noiTiepTu`). Quyền lợi chép từ gói lúc đăng ký (sửa gói sau không ảnh
hưởng người đã mua) và **tự áp khi thợ bấm xong** đơn của biển số đó:

| Quyền lợi | Cách tính |
|---|---|
| Miễn phí đi lại | Đếm lượt trong thời hạn gói (Cơ bản 4 lần, An tâm không giới hạn) |
| Kích nổ, vá lốp miễn phí | Hạng mục tiền công trong báo giá gắn quyền lợi: thợ gửi `hangMuc[].hangMucGia` = id hạng mục bảng giá có `quyenLoiHoiVien` (hoặc đặt đúng tên hạng mục bảng giá) |
| Giảm % tiền công | Trên phần tiền công còn lại, không giảm phụ tùng. **Không cộng dồn với mã khuyến mãi**: lấy mức có lợi hơn cho khách |
| Ưu tiên gọi gấp | Đơn khẩn cấp của xe gói An tâm có `uuTien = 2` (đơn khẩn cấp thường 1, đặt lịch 0) |

Các dòng quyền lợi hiện trong `thanhToan.chiTiet` / màn `ThanhToan` với `loai: "quyenLoi"` (số âm). Lượt đã dùng: `don.quyenLoi`.
Khách xem gói, hạn, lượt còn lại trong tra cứu lịch sử xe (`hoiVien` của `GET /api/tra-cuu-xe/lich-su`).

- `GET /api/trang/hoi-vien`: 2 gói (giá năm, giá mỗi tháng), bảng so sánh dựng từ số liệu gói và bảng giá hiện hành, thưởng giới
  thiệu. Hàm `layTrangHoiVien(payload)` trong `lib/hoi-vien.ts`.
- `POST /api/hoi-vien/dang-ky` `{ goi, hoTen, sdt, bienSo, maGioiThieu?, dongY, website }`: tạo `HV-000123` (chưa trừ tiền),
  gửi link thanh toán qua Zalo. Mã giới thiệu sai: 409 `MA_GIOI_THIEU_KHONG_DUNG` (ô `maGioiThieu`). 5 lần/10 phút mỗi IP.
- `GET /api/hoi-vien/thanh-toan/:token`: màn thanh toán gói (link `/hoi-vien/thanh-toan/<token>/`). Hỏi lại mỗi 5 giây đến khi
  `trangThai = hieuLuc`.
- Tiền về: cùng webhook `POST /api/thanh-toan/webhook` (nội dung có `HV000123`). `ketQua`: `hoiVien` (đủ, đã kích hoạt) |
  `hoiVienThieu` | `trung`. Giả lập: `POST /api/hoi-vien/thanh-toan/:token/gia-lap-tien-ve`.
- Việc định kỳ: gói quá hạn → `hetHan`; còn 14 ngày mà chưa gia hạn → nhắn nhắc một lần.

<!-- vi-du:trang-hoi-vien -->
Request:
```http
GET /api/trang/hoi-vien
```
Response `200`:
```json
{
  "goi": [
    {
      "slug": "co-ban",
      "ten": "Gói Cơ bản",
      "nhan": "Đi lại ít",
      "loiIch": "Hợp với xe đi trong phố, vài lần gọi thợ mỗi năm.",
      "giaNam": 490000,
      "giaNamHienThi": "490.000đ",
      "giaThang": 41000,
      "giaThangHienThi": "41.000đ",
      "quyenLoi": {
        "ten": "Cơ bản",
        "mienDiLaiSoLan": 4,
        "mienKichNoSoLan": 2,
        "mienVaLopSoLan": 0,
        "giamCongPhanTram": 10,
        "uuTienGoiGap": false
      }
    },
    {
      "slug": "an-tam",
      "ten": "Gói An tâm",
      "nhan": "Nhiều người chọn",
      "loiIch": "Gọi thợ bao nhiêu lần cũng không mất phí đi lại, được ưu tiên khi gọi gấp.",
      "giaNam": 1290000,
      "giaNamHienThi": "1.290.000đ",
      "giaThang": 108000,
      "giaThangHienThi": "108.000đ",
      "quyenLoi": {
        "ten": "An tâm",
        "mienDiLaiSoLan": null,
        "mienKichNoSoLan": null,
        "mienVaLopSoLan": null,
        "giamCongPhanTram": 15,
        "uuTienGoiGap": true
      }
    }
  ],
  "tenCot": [
    "Cơ bản",
    "An tâm"
  ],
  "bangSoSanh": [
    {
      "ten": "Phí đi lại (50.000đ/lần)",
      "goi": [
        {
          "chu": "Miễn 4 lần/năm",
          "co": true
        },
        {
          "chu": "Miễn không giới hạn",
          "co": true
        }
      ]
    },
    {
      "ten": "Kích nổ ắc quy (150.000đ)",
      "goi": [
        {
          "chu": "Miễn 2 lần/năm",
          "co": true
        },
        {
          "chu": "Miễn phí",
          "co": true
        }
      ]
    },
    "… (còn 3 mục)"
  ],
  "thoiHanThang": 12,
  "gioiThieu": {
    "banBe": {
      "moTa": "Miễn phí đi lại đơn đầu tiên",
      "tietKiem": 50000,
      "tietKiemHienThi": "50.000đ"
    },
    "ban": {
      "moTa": "1 lượt miễn phí đi lại mỗi bạn",
      "tietKiem": 50000,
      "tietKiemHienThi": "50.000đ/lượt"
    }
  },
  "hotline": "1900 1068"
}
```
<!-- /vi-du -->

<!-- vi-du:hv-dang-ky -->
Request:
```http
POST /api/hoi-vien/dang-ky

{
  "goi": "an-tam",
  "hoTen": "Trần Minh Tuấn",
  "sdt": "0912470331",
  "bienSo": "30h33111",
  "maGioiThieu": "",
  "dongY": true,
  "website": ""
}
```
Response `201`:
```json
{
  "ma": "HV-000008",
  "trangThai": "choThanhToan",
  "goi": {
    "slug": "an-tam",
    "ten": "Gói An tâm",
    "soTien": 1290000,
    "soTienHienThi": "1.290.000đ"
  },
  "bienSo": "30H-331.11",
  "linkThanhToan": "http://localhost:3000/hoi-vien/thanh-toan/mL-t7C0C8rbZGcYTJULvK1eUSvRXQNXG/",
  "token": "mL-t7C0C8rbZGcYTJULvK1eUSvRXQNXG",
  "daGuiQua": "zalo",
  "sdtChe": "0912 xxx 331",
  "noiTiepTu": null,
  "maGioiThieu": null
}
```

Thiếu thông tin:

Request:
```http
POST /api/hoi-vien/dang-ky

{
  "goi": "an-tam",
  "sdt": "0912",
  "dongY": false
}
```
Response `400`:
```json
{
  "loi": "Thông tin đăng ký chưa đúng, xem từng ô.",
  "ma": "DU_LIEU_SAI",
  "truong": {
    "dongY": "Bạn cần tích ô đồng ý xử lý dữ liệu để đăng ký gói.",
    "hoTen": "Cho biết họ tên.",
    "sdt": "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09).",
    "bienSo": "Biển số chưa đúng, ví dụ 30A-123.45. Mỗi gói gắn với 1 biển số."
  }
}
```
<!-- /vi-du -->

<!-- vi-du:hv-thanh-toan -->
`vietQR.anh` là ảnh PNG dạng data URL (rút gọn ở đây):

Request:
```http
GET /api/hoi-vien/thanh-toan/mL-t7C0C8rbZGcYTJULvK1eUSvRXQNXG
```
Response `200`:
```json
{
  "ma": "HV-000008",
  "goi": "Gói An tâm",
  "bienSo": "30H-331.11",
  "hoTen": "Trần Minh Tuấn",
  "sdtChe": "0912 xxx 331",
  "trangThai": "choThanhToan",
  "soTien": 1290000,
  "soTienHienThi": "1.290.000đ",
  "daNhan": 0,
  "conPhaiTra": 1290000,
  "chuyenKhoan": {
    "nganHang": "Vietcombank – CN Hà Nội (MẪU)",
    "soTaiKhoan": "1023456789",
    "chuTaiKhoan": "CONG TY TNHH THOTOI MAU",
    "soTien": 1290000,
    "soTienHienThi": "1.290.000đ",
    "noiDung": "HV000008"
  },
  "vietQR": {
    "chuoi": "00020101021238540010A00000072701240006970436011010234567890208QRIBFTTA5303704540712900005802VN62120808HV0000086304B350",
    "anh": "data:image/png;base64,iVBORw0KGgoAAAANSU…"
  },
  "hotline": "1900 1068",
  "hieuLuc": null,
  "quyenLoi": null
}
```
<!-- /vi-du -->

<!-- vi-du:hv-tien-ve -->
Chỉ khi ngân hàng chạy giả lập. Tiền thật về qua `POST /api/thanh-toan/webhook` với nội dung `HV000123`:

Request:
```http
POST /api/hoi-vien/thanh-toan/mL-t7C0C8rbZGcYTJULvK1eUSvRXQNXG/gia-lap-tien-ve
```
Response `200`:
```json
{
  "ketQua": "hoiVien",
  "maGiaoDich": "GIALAP1791460470499",
  "maDon": "HV-000008",
  "trangThai": "hieuLuc",
  "hetHan": "2027-10-08T11:54:30.499Z"
}
```
<!-- /vi-du -->

<!-- vi-du:hv-da-tra -->
Request:
```http
GET /api/hoi-vien/thanh-toan/mL-t7C0C8rbZGcYTJULvK1eUSvRXQNXG
```
Response `200`:
```json
{
  "ma": "HV-000008",
  "goi": "Gói An tâm",
  "bienSo": "30H-331.11",
  "hoTen": "Trần Minh Tuấn",
  "sdtChe": "0912 xxx 331",
  "trangThai": "hieuLuc",
  "soTien": 1290000,
  "soTienHienThi": "1.290.000đ",
  "daNhan": 1290000,
  "conPhaiTra": 0,
  "chuyenKhoan": {
    "nganHang": "Vietcombank – CN Hà Nội (MẪU)",
    "soTaiKhoan": "1023456789",
    "chuTaiKhoan": "CONG TY TNHH THOTOI MAU",
    "soTien": 0,
    "soTienHienThi": "0đ",
    "noiDung": "HV000008"
  },
  "vietQR": null,
  "hotline": "1900 1068",
  "hieuLuc": {
    "tu": "2026-10-08T11:54:30.499Z",
    "den": "2027-10-08T11:54:30.499Z"
  },
  "quyenLoi": {
    "ma": "HV-000008",
    "goi": "Gói An tâm",
    "bienSo": "30H-331.11",
    "batDau": "2026-10-08T11:54:30.499Z",
    "hetHan": "2027-10-08T11:54:30.499Z",
    "conLai": {
      "diLai": null,
      "kichNo": null,
      "vaLop": null
    },
    "giamCongPhanTram": 15,
    "uuTienGoiGap": true,
    "ghiChu": "null = không giới hạn"
  }
}
```
<!-- /vi-du -->

<!-- vi-du:hv-don -->
Đơn của xe hội viên An tâm sau khi thợ bấm xong (báo giá gửi `hangMucGia` của hạng mục kích nổ). Chỉ trích các trường liên quan, đủ mọi dòng:

Request:
```http
GET /api/don-hang/theo-doi/3Tjwfl5wsJ5rJCqkgbefTSy-o06MY1nB/thanh-toan
```
Response `200` (trích):
```json
{
  "ma": "TT-000071",
  "hangMuc": [
    {
      "ten": "Kích nổ tại chỗ",
      "loai": "cong",
      "soTien": 150000,
      "quyenLoi": "kichNo",
      "hienThi": "150.000đ"
    },
    {
      "ten": "Vệ sinh cọc, thay đầu cos",
      "loai": "cong",
      "soTien": 120000,
      "hienThi": "120.000đ"
    },
    {
      "ten": "Phí đi lại",
      "loai": "phi",
      "soTien": 50000,
      "hienThi": "50.000đ"
    },
    {
      "ten": "Kích nổ tại chỗ: miễn phí (hội viên An tâm)",
      "loai": "quyenLoi",
      "soTien": -150000,
      "hienThi": "−150.000đ"
    },
    {
      "ten": "Miễn phí đi lại (hội viên An tâm)",
      "loai": "quyenLoi",
      "soTien": -50000,
      "hienThi": "−50.000đ"
    },
    {
      "ten": "Giảm 15% tiền công (hội viên An tâm)",
      "loai": "quyenLoi",
      "soTien": -18000,
      "hienThi": "−18.000đ"
    }
  ],
  "tong": 102000,
  "tongHienThi": "102.000đ",
  "conPhaiTra": 102000
}
```
<!-- /vi-du -->

### Giới thiệu bạn bè
Mỗi số điện thoại khách một mã (`TUAN2481`: tên gọi không dấu + 4 số). Link chia sẻ `https://<web>/?ma=TUAN2481`: frontend lưu
mã (vd `sessionStorage`), điền sẵn vào ô "Mã giới thiệu" khi đặt lịch, và gọi `POST /api/gioi-thieu/mo` một lần.
- **Bạn bè**: đơn đầu tiên đặt bằng mã được miễn phí đi lại. Đơn tạo kèm `gioiThieu: { ma, apDung, moTa | lyDo }`: mã có thật
  nhưng không áp (không phải đơn đầu, mã của chính mình) thì vẫn nhận đơn, báo `lyDo`.
- **Người giới thiệu**: khi đơn của bạn bè xong và đã thanh toán (hoặc bạn bè mua gói hội viên) được 1 lượt miễn phí đi lại,
  nhắn Zalo báo, tự trừ vào đơn kế tiếp. Lượt tính từ đơn thật (đơn huỷ không tính), CSKH cộng tay được (`luotThuongThem`).
- Thứ tự miễn phí đi lại: gói hội viên → bạn mới → lượt thưởng (một đơn chỉ dùng một nguồn).

- `POST /api/gioi-thieu/gui-ma { sdt }` ("Nhận mã qua Zalo"): số đã đặt thợ hoặc mua gói thì nhận mã + link xem lượt thưởng
  `/gioi-thieu/<token>/` qua Zalo. **Trả lời giống nhau cho mọi số** (không dò được ai là khách). 3 lần/giờ mỗi số.
- `GET /api/gioi-thieu/xem/:token`: màn "Mã giới thiệu của bạn": mã, link, `thongKe` (`soLuotMo`, `soDonHoanThanh`,
  `luotDuocThuong`, `luotDaDung`, `luotConLai`).
- `POST /api/gioi-thieu/mo { ma }` → 202: đếm lượt mở link (mỗi IP một lần/6 giờ/mã).
- Kiểm tra mã ở form: dùng chung `POST /api/ma-khuyen-mai/kiem-tra { ma, sdt? }`, mã giới thiệu trả `loai: "gioiThieu"`.

<!-- vi-du:gt-gui-ma -->
Máy chạy thử (tin nhắn giả lập) trả thêm `giaLap`; chạy thật không bao giờ có:

Request:
```http
POST /api/gioi-thieu/gui-ma

{
  "sdt": "0912 345 678"
}
```
Response `200`:
```json
{
  "daGui": true,
  "sdtChe": "0912 xxx 678",
  "thongBao": "Nếu số này đã đặt thợ ThợTới, mã giới thiệu sẽ tới Zalo trong vài giây.",
  "giaLap": {
    "ma": "HOANG9509",
    "token": "14o5_s5_1iYwgvU6QLaZYR_l9sens2qJ",
    "linkXem": "http://localhost:3000/gioi-thieu/14o5_s5_1iYwgvU6QLaZYR_l9sens2qJ/"
  }
}
```
<!-- /vi-du -->

<!-- vi-du:gt-xem -->
Request:
```http
GET /api/gioi-thieu/xem/14o5_s5_1iYwgvU6QLaZYR_l9sens2qJ
```
Response `200`:
```json
{
  "hoTen": "Nguyễn Văn Hoàng",
  "sdtChe": "0912 xxx 678",
  "ma": "HOANG9509",
  "link": "http://localhost:3000/?ma=HOANG9509",
  "tamDung": false,
  "thongKe": {
    "soLuotMo": 6,
    "soDonHoanThanh": 1,
    "soGoiHoiVien": 0,
    "luotDuocThuong": 1,
    "luotDaDung": 0,
    "luotConLai": 1
  },
  "thuong": {
    "banBe": {
      "moTa": "Miễn phí đi lại đơn đầu tiên",
      "tietKiem": 50000,
      "tietKiemHienThi": "50.000đ"
    },
    "ban": {
      "moTa": "1 lượt miễn phí đi lại mỗi bạn",
      "tietKiem": 50000,
      "tietKiemHienThi": "50.000đ/lượt"
    }
  }
}
```
<!-- /vi-du -->

<!-- vi-du:gt-mo -->
Request:
```http
POST /api/gioi-thieu/mo

{
  "ma": "HOANG9509"
}
```
Response `202`:
```json
{
  "daGhi": false
}
```
<!-- /vi-du -->

<!-- vi-du:gt-kiem-tra -->
Cùng endpoint với mã khuyến mãi:

Request:
```http
POST /api/ma-khuyen-mai/kiem-tra

{
  "ma": "HOANG9509",
  "sdt": "0912571405"
}
```
Response `200`:
```json
{
  "hopLe": true,
  "id": 1,
  "ma": "HOANG9509",
  "loai": "gioiThieu",
  "moTa": "Miễn phí đi lại đơn đầu tiên (tiết kiệm 50.000đ), mã giới thiệu của bạn bè"
}
```

Chủ mã tự dùng:

Request:
```http
POST /api/ma-khuyen-mai/kiem-tra

{
  "ma": "HOANG9509",
  "sdt": "0912345678"
}
```
Response `200`:
```json
{
  "hopLe": false,
  "ma": "MA_CUA_BAN",
  "lyDo": "Đây là mã giới thiệu của chính bạn, gửi cho bạn bè để nhận thưởng nhé."
}
```
<!-- /vi-du -->

<!-- vi-du:gt-dat-lich -->
Đặt lịch qua link `?ma=` (form gửi `maGioiThieu`):

Request:
```http
POST /api/don-hang/dat-lich

{
  "...": "như đặt lịch ở trên",
  "maGioiThieu": "HOANG9509"
}
```
Response `201`:
```json
{
  "ma": "TT-000072",
  "loai": "datLich",
  "trangThai": "daNhan",
  "linkTheoDoi": "<link>",
  "token": "<token>",
  "khungGio": {
    "ngay": "2026-10-11",
    "ma": "12-14",
    "nhan": "12h – 14h, 11/10"
  },
  "viTri": {
    "quan": "Cầu Giấy",
    "phuong": "Dịch Vọng Hậu",
    "etaTu": 25,
    "etaDen": 40
  },
  "giaSoBo": {
    "trangThai": "coGia",
    "tu": 1550000,
    "den": 2200000,
    "hienThi": "1,55 – 2,2 triệu",
    "ghiChu": "Đã gồm phí đi lại 50.000đ. Giá chính thức chốt sau khi thợ kiểm tra."
  },
  "khuyenMai": null,
  "gioiThieu": {
    "ma": "HOANG9509",
    "apDung": true,
    "moTa": "Miễn phí đi lại đơn đầu tiên (tiết kiệm 50.000đ), mã giới thiệu của bạn bè",
    "lyDo": null
  },
  "hoiVien": null,
  "nhanLuc": "2026-10-08T11:54:31.565Z"
}
```
<!-- /vi-du -->

### Yêu cầu báo giá doanh nghiệp (`DoanhNghiep`)
- `GET /api/trang/doanh-nghiep`: lựa chọn của form (`loaiXe`, `loaiDoiXe`, `khuVuc` = quận đang phục vụ + `khac`), sales phụ
  trách, link hồ sơ năng lực (cấu hình chung, tab "Doanh nghiệp, tuyển thợ"). Bảng giá theo xe, mức giảm theo số xe trong thiết
  kế là nội dung tiếp thị (giá mẫu), frontend giữ trong trang.
- `GET /api/doanh-nghiep/tra-mst?mst=0101234567`: tự điền tên, địa chỉ (adapter `lib/tich-hop/mst.ts`). 404
  `KHONG_TIM_THAY_MST` (khách tự gõ), 502 `TRA_MST_LOI`. 20 lần/10 phút mỗi IP.
- `POST /api/doanh-nghiep/yeu-cau` `{ tenCongTy, mst?, diaChi?, soXe, loaiXe, loaiDoiXe, khuVuc: [], nguoiLienHe, sdt, email?,
  ghiChu?, dongY, nguon?, website }` → 201 `DN-000045`, báo sales (SMS + email), trả người phụ trách để hiện cho khách.

<!-- vi-du:trang-doanh-nghiep -->
Request:
```http
GET /api/trang/doanh-nghiep
```
Response `200`:
```json
{
  "luaChon": {
    "loaiXe": [
      {
        "value": "4-5-cho",
        "label": "Xe 4–5 chỗ"
      },
      {
        "value": "7-cho",
        "label": "Xe 7 chỗ, MPV"
      },
      "… (còn 3 mục)"
    ],
    "loaiDoiXe": [
      {
        "value": "taxi",
        "label": "Taxi"
      },
      {
        "value": "thue",
        "label": "Cho thuê"
      },
      "… (còn 1 mục)"
    ],
    "khuVuc": [
      {
        "value": "cau-giay",
        "label": "Cầu Giấy"
      },
      {
        "value": "dong-da",
        "label": "Đống Đa"
      },
      "… (còn 3 mục)"
    ]
  },
  "phuTrach": {
    "ten": "Phạm Lan (mẫu)",
    "sdt": "0900000001"
  },
  "camKet": "Sales doanh nghiệp sẽ liên hệ trong 1 giờ làm việc (8h–17h30, thứ 2 đến thứ 7).",
  "hoSoNangLuc": "https://thotoi.test/ho-so-nang-luc-mau.pdf",
  "hotline": "1900 1068"
}
```
<!-- /vi-du -->

<!-- vi-du:tra-mst -->
Tra MST chạy giả lập:

Request:
```http
GET /api/doanh-nghiep/tra-mst?mst=0101234567
```
Response `200`:
```json
{
  "mst": "0101234567",
  "ten": "CÔNG TY TNHH VẬN TẢI MẪU 4567",
  "tenQuocTe": null,
  "tenVietTat": null,
  "diaChi": "12 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội (DỮ LIỆU MẪU)"
}
```

Không tìm thấy:

Request:
```http
GET /api/doanh-nghiep/tra-mst?mst=0101234000
```
Response `404`:
```json
{
  "loi": "Không tìm thấy mã số thuế này, bạn kiểm tra lại hoặc gõ tên công ty.",
  "ma": "KHONG_TIM_THAY_MST"
}
```
<!-- /vi-du -->

<!-- vi-du:dn-yeu-cau -->
Request:
```http
POST /api/doanh-nghiep/yeu-cau

{
  "tenCongTy": "Công ty TNHH Cho thuê xe tự lái Minh Long",
  "mst": "0101234567",
  "soXe": 42,
  "loaiXe": "4-5-cho",
  "loaiDoiXe": "thue",
  "khuVuc": [
    "dong-da",
    "cau-giay"
  ],
  "nguoiLienHe": "Nguyễn Lâm",
  "sdt": "0988 216 401",
  "email": "doixe@minhlong.vn",
  "ghiChu": "Bảo dưỡng buổi tối tại bãi",
  "dongY": true,
  "website": "",
  "nguon": {
    "utm_source": "google",
    "trangVao": "/doanh-nghiep/"
  }
}
```
Response `201`:
```json
{
  "ma": "DN-000004",
  "phuTrach": {
    "ten": "Phạm Lan (mẫu)",
    "sdt": "0900000001"
  },
  "camKet": "Sales doanh nghiệp sẽ liên hệ trong 1 giờ làm việc (8h–17h30, thứ 2 đến thứ 7).",
  "hoSoNangLuc": "https://thotoi.test/ho-so-nang-luc-mau.pdf"
}
```

Thiếu thông tin:

Request:
```http
POST /api/doanh-nghiep/yeu-cau

{
  "tenCongTy": "",
  "soXe": 0,
  "dongY": false
}
```
Response `400`:
```json
{
  "loi": "Thông tin chưa đủ, xem từng ô.",
  "ma": "DU_LIEU_SAI",
  "truong": {
    "dongY": "Bạn cần tích ô đồng ý để gửi yêu cầu.",
    "tenCongTy": "Cho biết tên công ty.",
    "soXe": "Số xe chưa đúng.",
    "loaiXe": "Chọn loại xe chính.",
    "loaiDoiXe": "Chọn loại đội xe.",
    "khuVuc": "Chọn khu vực bãi xe.",
    "nguoiLienHe": "Cho biết người liên hệ.",
    "sdt": "Số điện thoại chưa đúng."
  }
}
```
<!-- /vi-du -->

### Hồ sơ thợ cộng tác (`TuyenTho`)
- `GET /api/trang/tuyen-tho`: lựa chọn (`namKinhNghiem`, `khuVuc`, `dungCu`), giới hạn ảnh, liên hệ nhân sự.
- `POST /api/tuyen-tho/ho-so` (`multipart/form-data`): ô `duLieu` = JSON `{ hoTen, sdt, namKinhNghiem, khuVuc: [], dungCu: [],
  ghiChu?, dongY, website }`, ô `tep` lặp lại tối đa 3 ảnh (JPG, PNG, WEBP, HEIC, mỗi ảnh ≤ 8 MB). → 201 `TH-000087`, báo nhân sự.
  Ảnh lưu riêng (`tep-ho-so`), chỉ quản trị, quản lý dịch vụ xem được. 2 hồ sơ/ngày mỗi số điện thoại.

<!-- vi-du:trang-tuyen-tho -->
Request:
```http
GET /api/trang/tuyen-tho
```
Response `200`:
```json
{
  "luaChon": {
    "namKinhNghiem": [
      {
        "value": "2-3",
        "label": "2–3 năm"
      },
      {
        "value": "4-5",
        "label": "4–5 năm"
      },
      "… (còn 2 mục)"
    ],
    "khuVuc": [
      {
        "value": "cau-giay",
        "label": "Cầu Giấy"
      },
      {
        "value": "dong-da",
        "label": "Đống Đa"
      },
      "… (còn 3 mục)"
    ],
    "dungCu": [
      {
        "value": "obd",
        "label": "Máy đọc lỗi OBD"
      },
      {
        "value": "kich",
        "label": "Kích nâng cá sấu"
      },
      "… (còn 6 mục)"
    ]
  },
  "anh": {
    "toiDa": 3,
    "toiDaMB": 8,
    "loai": [
      "image/jpeg",
      "image/png",
      "… (còn 3 mục)"
    ]
  },
  "nhanSu": {
    "ten": "Phòng nhân sự (mẫu)",
    "zalo": "https://zalo.me/0900000002"
  },
  "camKet": "Bộ phận nhân sự sẽ gọi cho bạn trong 2 ngày làm việc để hẹn lịch kiểm tra tay nghề.",
  "hotline": "1900 1068"
}
```
<!-- /vi-du -->

<!-- vi-du:th-ho-so -->
Request (`multipart/form-data`):
```http
POST /api/tuyen-tho/ho-so

duLieu = {"hoTen":"Lê Văn Bình","sdt":"0977871740","namKinhNghiem":"6-10","khuVuc":["cau-giay","dong-da"],"dungCu":["obd","kich","bom"],"dongY":true,"website":""}
tep    = chung-chi-nghe.png (image/png)
tep    = bang-lai-b2.png (image/png)
```
Response `201`:
```json
{
  "ma": "TH-000004",
  "soAnh": 2,
  "nhanSu": {
    "ten": "Phòng nhân sự (mẫu)",
    "zalo": "https://zalo.me/0900000002"
  },
  "camKet": "Bộ phận nhân sự sẽ gọi cho bạn trong 2 ngày làm việc để hẹn lịch kiểm tra tay nghề."
}
```
<!-- /vi-du -->

## Bảng quyền

| Dữ liệu | Khách | quanTri | quanLyDichVu | bienTap | marketing | dieuPhoi |
|---|---|---|---|---|---|---|
| Danh mục, giá, phí, xe, vùng, giờ: đọc | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| … sửa | | ✓ | ✓ | | | |
| Nhật ký giá: đọc | | ✓ | ✓ | | | |
| Đơn hàng, tệp của đơn: đọc, sửa | | ✓ | ✓ | | | ✓ |
| Đơn hàng: xoá | | ✓ | | | | |
| Đánh giá hiển thị: thêm, sửa | | ✓ | ✓ | | ✓ | |
| Bài viết: viết nháp | | ✓ | ✓ | ✓ | ✓ | |
| Bài viết: đăng, xoá | | ✓ | ✓ | | | |
| Người dùng, vai trò | | ✓ | (sửa mình) | (sửa mình) | (sửa mình) | (sửa mình) |
| Bài viết: hẹn giờ | | ✓ | ✓ | | | |
| Thợ: đọc, sửa (thêm: quanTri, quanLyDichVu) | | ✓ | ✓ | | | ✓ |
| Báo giá, phiếu bảo hành, giao dịch, tin nhắn: đọc | | ✓ | ✓ | | | ✓ |
| Khiếu nại: đọc, xử lý | | ✓ | ✓ | | | ✓ |
| Mã khuyến mãi: đọc, thống kê, hoa hồng | | ✓ | ✓ | | ✓ | |
| Mã khuyến mãi: thêm, sửa | | ✓ | | | ✓ | |
| Số liệu | | ✓ | ✓ | | ✓ | |
| Xem báo giá, duyệt, thanh toán, đánh giá (link riêng) | ✓ | | | | | |
| Gói hội viên: đọc | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gói hội viên: sửa giá, quyền lợi | | ✓ | ✓ | | | |
| Hội viên (đăng ký gói): đọc | | ✓ | ✓ | | ✓ | ✓ |
| Hội viên: sửa (huỷ, ghi chú) | | ✓ | ✓ | | | |
| Mã giới thiệu: đọc | | ✓ | ✓ | | ✓ | |
| Mã giới thiệu: sửa (tạm dừng, cộng lượt) | | ✓ | | | ✓ | |
| Yêu cầu doanh nghiệp | | ✓ | ✓ | | ✓ | |
| Hồ sơ thợ cộng tác, ảnh hồ sơ | | ✓ | ✓ | | | |
