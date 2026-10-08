# Hợp đồng API backend ThợTới

Tài liệu cho phiên frontend và đội VCsoft (phần mềm điều phối). Phạm vi hiện tại: **P0** (danh mục, bảng giá, vùng phục vụ,
giờ nhận đơn, đơn đặt lịch, gọi gấp). P1, P2 bổ sung sau, xem `BAN-GIAO-BE.md`.

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
  "capNhatLuc": "2026-10-08T10:26:03.461Z",
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
          "capNhatGiaLuc": "2026-10-08T10:23:50.405Z"
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
          "capNhatGiaLuc": "2026-10-08T10:23:50.421Z"
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
          "capNhatGiaLuc": "2026-10-08T10:23:50.475Z"
        },
        {
          "id": 6,
          "ten": "Kích nổ tại chỗ",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 170000,
            "den": 170000
          },
          "giaHienThi": "170.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T10:26:03.461Z"
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
      "capNhatGiaLuc": "2026-10-08T10:23:50.475Z"
    },
    {
      "id": 6,
      "ten": "Kích nổ tại chỗ",
      "loai": "cong",
      "loaiNhan": "Tiền công",
      "gia": {
        "tu": 170000,
        "den": 170000
      },
      "giaHienThi": "170.000đ",
      "mienPhi": false,
      "donVi": null,
      "ghiChu": null,
      "giaTheoPhanKhuc": null,
      "capNhatGiaLuc": "2026-10-08T10:26:03.461Z"
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
        "id": "6ac76f3594f2390bc34ed56c",
        "q": "Xe không nổ máy có phải chắc chắn do ắc quy không?",
        "a": "Không hẳn. Ắc quy yếu là nguyên nhân phổ biến, nhưng củ đề, máy phát hay dây cáp lỏng cũng có thể gây ra. Thợ sẽ đo ắc quy và hệ thống sạc để tìm đúng nguyên nhân trước khi thay."
      },
      {
        "id": "6ac76f3594f2390bc34ed56d",
        "q": "Tôi có nên tự câu bình bằng dây mồi không?",
        "a": "Chúng tôi khuyên bạn nên để thợ làm. Câu sai cực hoặc câu vào bình bị phồng, rò có thể gây chập điện, hỏng thiết bị điện tử hoặc nguy hiểm cho người."
      },
      "… (còn 2 mục)"
    ],
    "noiDung": "(nội dung Lexical JSON, rút gọn)",
    "capNhat": "2026-10-08T10:23:49.736Z"
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
dịch vụ khác. `noiDung` (đoạn mô tả riêng, ảnh thật) là `null` tới P1. 404 nếu quận chưa phục vụ.

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
      "capNhatGiaLuc": "2026-10-08T10:23:50.475Z"
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
do giao diện chia. `benhHayGap` là `null` tới P1. `XeDien`: các dòng xe điện và 4 nhóm việc (lốp, phanh, ắc quy 12V, điều hoà).

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
          "capNhatGiaLuc": "2026-10-08T10:23:50.405Z"
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
          "capNhatGiaLuc": "2026-10-08T10:23:50.421Z"
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
          "capNhatGiaLuc": "2026-10-08T10:23:50.475Z"
        },
        {
          "id": 6,
          "ten": "Kích nổ tại chỗ",
          "loai": "cong",
          "loaiNhan": "Tiền công",
          "gia": {
            "tu": 170000,
            "den": 170000
          },
          "giaHienThi": "170.000đ",
          "mienPhi": false,
          "donVi": null,
          "ghiChu": null,
          "giaTheoPhanKhuc": null,
          "capNhatGiaLuc": "2026-10-08T10:26:03.461Z"
        },
        "… (còn 2 mục)"
      ]
    },
    "… (còn 4 mục)"
  ],
  "benhHayGap": null
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
          "conCho": 2,
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
          "conCho": 4,
          "day": false,
          "daQua": false,
          "datDuoc": true
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
          "conCho": 2,
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
          "conCho": 4,
          "day": false,
          "daQua": false,
          "datDuoc": true
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
| `maGioiThieu`, `maKhuyenMai` | | lưu lại; kiểm tra và giảm giá là P1/P2 |
| `dongY` | **có**, `true` | chưa đồng ý thì không lưu gì; server lưu thời điểm đồng ý |
| `nhacBaoDuong` | | nhắc bảo dưỡng qua Zalo |
| `nguon` | | `{ utm_source, utm_medium, utm_campaign, ma, qr, trangVao, referrer }`: giữ suốt phiên, gửi kèm đơn |
| `website` | | ô bẫy bot, để trống |

Kết quả 201: `ma` (`TT-000123`), `linkTheoDoi` (link riêng, gửi khách), `token`, `khungGio`, `viTri` (quận, thời gian tới),
`giaSoBo` (đúng giá khách thấy lúc đặt, đã lưu vào đơn). Sau đó server tự gửi đơn sang phần mềm điều phối và nhắn Zalo
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
    "ngay": "2026-10-09",
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
  "ma": "TT-000012",
  "loai": "datLich",
  "trangThai": "daNhan",
  "linkTheoDoi": "http://localhost:3000/don/Olc6WDUMEEqsNas4yGiDUvEdtm-XY7qb/",
  "token": "Olc6WDUMEEqsNas4yGiDUvEdtm-XY7qb",
  "khungGio": {
    "ngay": "2026-10-09",
    "ma": "10-12",
    "nhan": "10h – 12h, 09/10"
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
  "nhanLuc": "2026-10-08T10:43:57.293Z"
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
    "ngay": "2026-10-09",
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
  "ma": "TT-000013",
  "loai": "khanCap",
  "trangThai": "daNhan",
  "linkTheoDoi": "http://localhost:3000/don/RTu7hewH21eLI8STOddVd7HANPsO8RHK/",
  "token": "RTu7hewH21eLI8STOddVd7HANPsO8RHK",
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
  "nhanLuc": "2026-10-08T10:43:57.675Z"
}
```
<!-- /vi-du -->

### `GET /api/don-hang/theo-doi/:token`
Ai gọi: công khai, chỉ ai có link (token 32 ký tự ngẫu nhiên). Màn `TheoDoi`: trạng thái, 7 bước (`done`/`now`/`todo` kèm
thời điểm), dịch vụ, xe, địa chỉ, khung giờ, số điện thoại **đã che**, giá sơ bộ. `tho` (thợ, vị trí, giờ đến) là `null`
tới P1. Hỏi lại mỗi 30 giây. Link hết hạn 24 giờ sau khi đơn hoàn thành hoặc huỷ: 410 `LINK_HET_HAN`. Không bao giờ tra
được bằng mã đơn.

<!-- vi-du:theo-doi -->
Request:
```http
GET /api/don-hang/theo-doi/Olc6WDUMEEqsNas4yGiDUvEdtm-XY7qb
```
Response `200`:
```json
{
  "ma": "TT-000012",
  "loai": "datLich",
  "trangThai": "daNhan",
  "nhanTrangThai": "Đã nhận",
  "cacBuoc": [
    {
      "trangThai": "daNhan",
      "nhan": "Đã nhận",
      "luc": "2026-10-08T10:43:57.304Z",
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
  "khungGio": "10h – 12h, 09/10",
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
  "hotline": "1900 1068",
  "taoLuc": "2026-10-08T10:43:57.330Z",
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
POST /api/don-hang/TT-000012/trang-thai

{
  "trangThai": "daXepTho",
  "ghiChu": "Thợ Đức nhận đơn"
}
```
Response `200`:
```json
{
  "ma": "TT-000012",
  "trangThai": "daXepTho",
  "nhan": "Đã xếp thợ",
  "lichSu": [
    {
      "id": "6ac773edd31690140daf0a7c",
      "trangThai": "daNhan",
      "luc": "2026-10-08T10:43:57.304Z",
      "boi": "Khách (web)",
      "ghiChu": null
    },
    {
      "id": "6ac773edd31690140daf0a7e",
      "trangThai": "daXepTho",
      "luc": "2026-10-08T10:43:57.980Z",
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
POST /api/don-hang/TT-000012/trang-thai

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
      "gia": 190000
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
      "gia": 190000,
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
      "tenNgan": "Kích nổ ắc quy",
      "lyDoDoi": null,
      "capNhatGiaLuc": "2026-10-08T10:43:58.250Z",
      "capNhatGiaBoi": "Trần Minh Đức (thử)",
      "updatedAt": "2026-10-08T10:43:58.251Z",
      "createdAt": "2026-10-08T10:23:50.490Z"
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
      "id": 31,
      "moTa": "Ắc quy › Kích nổ tại chỗ",
      "hangMuc": 6,
      "dichVu": 2,
      "giaCu": "190.000đ",
      "giaMoi": "170.000đ",
      "lyDo": "Trả lại giá (script ví dụ)",
      "nguoi": 2,
      "tenNguoi": "Trần Minh Đức (thử)",
      "vaiTro": "Quản lý dịch vụ",
      "updatedAt": "2026-10-08T10:43:58.307Z",
      "createdAt": "2026-10-08T10:43:58.307Z"
    },
    {
      "id": 30,
      "moTa": "Ắc quy › Kích nổ tại chỗ",
      "hangMuc": 6,
      "dichVu": 2,
      "giaCu": "170.000đ",
      "giaMoi": "190.000đ",
      "lyDo": "VCparts báo tăng giá",
      "nguoi": 2,
      "tenNguoi": "Trần Minh Đức (thử)",
      "vaiTro": "Quản lý dịch vụ",
      "updatedAt": "2026-10-08T10:43:58.261Z",
      "createdAt": "2026-10-08T10:43:58.260Z"
    }
  ],
  "hasNextPage": true,
  "hasPrevPage": false,
  "limit": 2,
  "nextPage": 2,
  "page": 1,
  "pagingCounter": 1,
  "prevPage": null,
  "totalDocs": 30,
  "totalPages": 15
}
```
<!-- /vi-du -->

### Bảng quyền (P0)

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
