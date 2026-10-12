// Tuyển thợ cộng tác (thiết kế TuyenTho): cách chia tiền công, điều kiện, quyền lợi, quy trình, form hồ sơ (≤3 ảnh).
// Tiền công trong bảng "Chia tiền thế nào" lấy từ bảng giá chung (hạng mục tiền công nổi bật), không gõ cứng.
import { layPayload } from "@/lib/cms";
import { layChung, tenKhuVuc } from "@/lib/giao-dien";
import { layTrangTuyenTho } from "@/lib/p2";
import { dinhDangTien } from "@/lib/tinh-gia.mjs";
import DuongDan from "@/components/chung/DuongDan";
import JsonLd from "@/components/JsonLd";
import { BuocSo } from "@/components/p2/KhoiP2";
import FormTuyenTho from "@/components/p2/FormTuyenTho";
import Icon from "@/components/Icon";
import site from "@/site.config.mjs";
import s from "./tuyen-tho.module.css";

// Tỷ lệ tiền công về tay thợ cộng tác (theo thiết kế TuyenTho). Chưa có trong cấu hình chung của backend: đổi ở đây.
const TY_LE_THO = 0.5;

/** Mỗi dịch vụ một hạng mục tiền công nổi bật có giá cố định, tối đa 4 dòng. */
async function viecMau(payload) {
  const { docs } = await payload.find({
    collection: "hang-muc-gia", depth: 1, limit: 200, pagination: false, sort: "thuTu",
    where: { and: [{ loai: { equals: "cong" } }, { noiBat: { equals: true } }, { gia: { greater_than: 0 } }] },
  });
  const daCo = new Set();
  const ra = [];
  for (const h of docs) {
    const dv = typeof h.dichVu === "object" ? h.dichVu : null;
    if (dv && (dv.hienTrenBangGia === false || daCo.has(dv.id))) continue;
    daCo.add(dv?.id ?? h.id);
    ra.push({ viec: (h.tenNgan || h.ten).replace(/\s*\(công\)\s*$/i, ""), gia: h.gia });
    if (ra.length === 4) break;
  }
  return ra;
}

export async function generateMetadata() {
  const chung = await layChung();
  const ten = chung.thuongHieu?.ten || site.name;
  return {
    title: "Tuyển thợ sửa ô tô cộng tác",
    description: `${ten} tuyển thợ sửa ô tô cộng tác tại ${chung.thuongHieu?.thanhPho || site.city}: đơn đều mỗi ngày gần nơi bạn ở, tiền công chia rõ từng đơn, thanh toán hằng tuần. Đăng ký trên web trong 3 phút.`,
    alternates: { canonical: "/tuyen-tho/" },
  };
}

export default async function TrangTuyenTho() {
  const payload = await layPayload();
  const [chung, d, viec] = await Promise.all([layChung(), layTrangTuyenTho(payload), viecMau(payload)]);
  const ten = chung.thuongHieu?.ten || site.name;
  const thanhPho = chung.thuongHieu?.thanhPho || site.city;
  const khuVuc = tenKhuVuc(chung);
  const xuong = chung.lienHe?.xuongDoiTac;
  const phanTram = Math.round(TY_LE_THO * 100);
  const tongCong = viec.reduce((a, x) => a + x.gia, 0);

  const dieuKien = [
    "Từ 2 năm kinh nghiệm sửa ô tô con (gara, xưởng dịch vụ hãng)",
    "Có bằng lái B2 trở lên",
    khuVuc.length ? `Ở hoặc làm quanh khu vực ${khuVuc.join(", ")}` : `Ở hoặc làm trong vùng phục vụ tại ${thanhPho}`,
    "Dùng được điện thoại thông minh để nhận đơn và chụp ảnh báo giá",
    "Thật thà với khách: báo đúng bệnh, không vẽ thêm việc",
  ];
  const quyenLoi = [
    { ma: "Đơn", t: "Đơn đều mỗi ngày", d: "Điều phối chia đơn gần bạn, không phải tự đi tìm khách." },
    { ma: "Xe", t: "Xe van đồ nghề", d: "Thợ tổ chính được giao xe van có đủ đồ nghề, phụ tùng." },
    { ma: "Học", t: "Đào tạo VCedu", d: "Học miễn phí xe điện, chẩn đoán, có chứng chỉ VCedu." },
    { ma: "BH", t: "Bảo hiểm tai nạn", d: "Mua cho thợ trong giờ nhận đơn. Phụ tùng VCparts giao tận nơi." },
  ];

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "JobPosting",
        title: "Thợ sửa ô tô cộng tác (sửa tận nơi)",
        description: `Nhận đơn sửa ô tô tận nơi do ${ten} điều phối. Tiền công chia theo từng đơn, thanh toán hằng tuần. Yêu cầu từ 2 năm kinh nghiệm, bằng lái B2.`,
        datePosted: new Date().toISOString().slice(0, 10),
        employmentType: "CONTRACTOR",
        hiringOrganization: { "@type": "Organization", name: chung.phapNhan?.ten || ten, sameAs: site.url },
        jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: thanhPho, addressCountry: "VN" } },
        directApply: true,
      }} />

      <section className={s.hero}>
        <div className={`wrap ${s.heroTrong}`}>
          <DuongDan cap={[{ ten: "Tuyển thợ cộng tác", href: "/tuyen-tho/" }]} toi />
          <span className={s.nhanHero}>Tuyển thợ cộng tác · {thanhPho}</span>
          <h1>Tay nghề của bạn,<br />đơn của chúng tôi</h1>
          <p className={s.dan}>Bạn lo sửa cho tốt. Tìm khách, báo giá, thu tiền để {ten} lo. Tiền công chia rõ ràng từng đơn.</p>
          <div className={s.tyLe}>
            <b>{phanTram}%</b>
            <span>tiền công mỗi đơn về tay thợ. Thanh toán mỗi tuần vào thứ 2.</span>
          </div>
          <a href="#dang-ky" className="nut nut-chinh nut-lon">Đăng ký làm thợ</a>
        </div>
      </section>

      <div className={`wrap ${s.luoi}`}>
        <div className={s.cotTrai}>
          {viec.length ? (
            <section className={s.khoi} aria-labelledby="tieu-de-chia">
              <div>
                <h2 id="tieu-de-chia">Chia tiền thế nào?</h2>
                <p className="phu">Tiền công theo <a href="/bang-gia/">bảng giá công khai</a> trên web. Bạn nhận {phanTram === 50 ? "một nửa" : `${phanTram}%`}.</p>
              </div>
              <div className={`the ${s.bang}`}>
                <table>
                  <caption className="sr-only">Ví dụ tiền công và phần thợ nhận</caption>
                  <thead><tr><th scope="col">Việc</th><th scope="col">Tiền công</th><th scope="col">Bạn nhận</th></tr></thead>
                  <tbody>
                    {viec.map((x) => (
                      <tr key={x.viec}>
                        <th scope="row">{x.viec}</th>
                        <td>{dinhDangTien(x.gia)}</td>
                        <td><b>{dinhDangTien(Math.round(x.gia * TY_LE_THO))}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={s.viDu}>
                  Ví dụ một ngày làm mỗi việc trên một lần: tiền công {dinhDangTien(tongCong)}, <b>bạn nhận {dinhDangTien(Math.round(tongCong * TY_LE_THO))}</b>. Phụ tùng do công ty cấp, không tính vào phần chia.
                </p>
              </div>
            </section>
          ) : null}

          <section className={s.khoi} aria-labelledby="tieu-de-dieu-kien">
            <h2 id="tieu-de-dieu-kien">Điều kiện</h2>
            <ul className={`the ${s.dieuKien}`}>
              {dieuKien.map((t) => <li key={t}><Icon name="check" size={18} /><span>{t}</span></li>)}
            </ul>
          </section>

          <section className={s.khoi} aria-labelledby="tieu-de-quyen-loi">
            <h2 id="tieu-de-quyen-loi">Bạn được gì</h2>
            <ul className={s.quyenLoi}>
              {quyenLoi.map((q) => (
                <li key={q.t} className="the">
                  <span className={s.ma} aria-hidden="true">{q.ma}</span>
                  <b>{q.t}</b>
                  <span>{q.d}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.khoi} aria-labelledby="tieu-de-quy-trinh">
            <h2 id="tieu-de-quy-trinh">Từ đăng ký đến nhận đơn</h2>
            <BuocSo buoc={[
              { t: "Đăng ký trên web", d: "Điền form bên dưới, gửi ảnh chứng chỉ." },
              { t: "Nhân sự gọi lại", d: d.camKet || "Hỏi thêm về kinh nghiệm và hẹn lịch kiểm tra tay nghề." },
              { t: "Kiểm tra tay nghề", d: `Nửa ngày${xuong ? ` tại ${xuong}` : ""}, sau đó học 3 ngày với VCedu.` },
              { t: "Nhận đơn đầu tiên", d: "Cài ứng dụng thợ, đi kèm thợ cũ 2 đơn đầu rồi tự làm." },
            ]} />
          </section>
        </div>

        <section id="dang-ky" className={`${s.khoi} ${s.cotForm}`} aria-label="Đăng ký làm thợ cộng tác">
          <FormTuyenTho luaChon={d.luaChon} anh={d.anh} chinhSach={chung.lienHe?.chinhSachDuLieu} />
        </section>
      </div>
    </>
  );
}
