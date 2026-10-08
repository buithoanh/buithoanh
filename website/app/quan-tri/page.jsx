import "./quan-tri.css";
import QuanTri from "./QuanTri";

// Trang quản trị: Cloudflare Access chặn người chưa đăng nhập; dữ liệu lấy qua /api/quan-tri (functions/).
export const metadata = { title: "Quản trị nội dung", robots: { index: false, follow: false } };

export default function Page() {
  return <QuanTri />;
}
