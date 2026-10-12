// Tra cứu VCwiki cho AI viết bài.
//
// CHƯA NỐI: đang chờ tài liệu API của VCwiki (địa chỉ, cách đăng nhập, cách tìm kiếm, cách nhận biết
// trang được phép công khai). Khi có, viết phần gọi API trong hàm timVcwiki() và giữ nguyên kiểu trả về.
//
// Hai luật bắt buộc khi nối:
//  1. Chỉ trả về trang được đánh dấu công khai. VCwiki có giá nhập, quy trình, nhân sự — không được lên web.
//  2. Luôn trả kèm đường dẫn trang gốc để người duyệt đối chiếu.

export type KetQuaVcwiki = { tieuDe: string; url: string; doan: string };

export type TraLoiVcwiki =
  | { daNoi: true; ketQua: KetQuaVcwiki[] }
  | { daNoi: false; thongBao: string; ketQua: [] };

export const vcwikiDaNoi = () => false;

export async function timVcwiki(cauHoi: string): Promise<TraLoiVcwiki> {
  void cauHoi;
  return {
    daNoi: false,
    thongBao: "VCwiki chưa được nối. Dùng nguồn công khai (tài liệu hãng, trang chính thức) và ghi rõ trong phần nguồn.",
    ketQua: [],
  };
}
