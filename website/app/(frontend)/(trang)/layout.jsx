// Trang công khai: header, nội dung, footer, thanh liên hệ dưới đáy (điện thoại).
import { cheDoNhap } from "@/lib/cms";
import { layChung } from "@/lib/giao-dien";
import site from "@/site.config.mjs";
import Header from "@/components/chung/Header";
import Footer from "@/components/chung/Footer";
import ThanhLienHe from "@/components/chung/ThanhLienHe";

export default async function LayoutTrang({ children }) {
  const [chung, xemTruoc] = await Promise.all([layChung(), cheDoNhap()]);
  return (
    <>
      <Header chung={chung} xemTruoc={xemTruoc} choIndex={site.allowIndex} />
      <main id="noi-dung" tabIndex={-1}>{children}</main>
      <Footer chung={chung} />
      <ThanhLienHe chung={chung} />
    </>
  );
}
