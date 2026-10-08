// Về chúng tôi (thiết kế VeChungToi). Câu chuyện, hệ sinh thái là chữ tĩnh; số liệu, đội thợ, cam kết, xưởng lấy từ dữ liệu.
import Link from "next/link";
import site from "@/site.config.mjs";
import { layPayload } from "@/lib/cms";
import { layChung } from "@/lib/giao-dien";
import { layTrangVeChungToi } from "@/lib/ve-chung-toi";
import JsonLd from "@/components/JsonLd";
import KhungAnh from "@/components/chung/KhungAnh";
import Hero from "@/components/trang/Hero";
import s from "./ve-chung-toi.module.css";

export const metadata = {
  title: "Về chúng tôi",
  description: `${site.name} là dịch vụ sửa ô tô tận nơi của tập đoàn ${site.parent}: thợ có chứng chỉ VCedu, phụ tùng VCparts, xưởng đối tác cho việc lớn.`,
  alternates: { canonical: "/ve-chung-toi/" },
};

const HE_SINH_THAI = [
  { ma: "VCparts", ten: "VCparts – phụ tùng", lam: "Nhà phân phối phụ tùng chính hãng và hàng thay thế đạt chuẩn cho gara toàn quốc.", choBan: "Phụ tùng có nguồn gốc rõ, giá tham khảo công khai." },
  { ma: "VCedu", ten: "VCedu – đào tạo thợ", lam: "Trường đào tạo nghề ô tô, cấp chứng chỉ cho từng kỹ năng.", choBan: "Thợ tới nhà bạn đã qua kiểm tra tay nghề." },
  { ma: "VCsvc", ten: "VCservice – xưởng dịch vụ", lam: "Chuỗi xưởng sửa chữa, nơi nhận các việc lớn không làm được tại chỗ.", choBan: "Việc lớn có xưởng đỡ, không bỏ dở giữa chừng." },
];

// Số xe chỉ hiện khi đã đủ lớn để có ý nghĩa (lúc mới chạy thử chỉ có vài đơn).
const chuDau = (ten) => ten.split(/\s+/).filter(Boolean).slice(-2).map((x) => x[0]).join("").toUpperCase();
const viHoa = (x) => x.charAt(0).toUpperCase() + x.slice(1);

export default async function VeChungToi() {
  const [chung, t] = await Promise.all([layChung(), layPayload().then((p) => layTrangVeChungToi(p))]);
  const { thuongHieu, camKet, google, lienHe } = chung;
  const xuong = lienHe.xuongDoiTac;
  const soLieu = [
    t.soLieu.soXeDaPhucVu >= 100 && { so: t.soLieu.soXeDaPhucVu.toLocaleString("vi-VN"), nhan: "xe đã phục vụ" },
    camKet.cuuHoPhut && { so: `${camKet.cuuHoPhut} phút`, nhan: "cam kết có mặt khi cứu hộ" },
    google.diem && { so: `${String(google.diem).replace(".", ",")} ★`, nhan: google.soDanhGia ? `${google.soDanhGia} đánh giá Google` : "điểm đánh giá Google" },
    t.soLieu.soThoCoChungChi > 0 && { so: `${t.soLieu.soThoCoChungChi} thợ`, nhan: "có chứng chỉ VCedu" },
  ].filter(Boolean);
  const camKetDs = [
    camKet.cuuHoPhut && { lon: `${camKet.cuuHoPhut} phút`, d: "thợ có mặt khi cứu hộ trong vùng phục vụ" },
    { lon: "Báo giá trước", d: "bạn duyệt từng món, đồng ý mới làm" },
    camKet.baoHanhPhuTungThang && { lon: `${camKet.baoHanhPhuTungThang} tháng`, d: "bảo hành phụ tùng thay mới" },
    camKet.baoHanhCongThang && { lon: `${camKet.baoHanhCongThang} tháng`, d: "bảo hành tiền công sửa chữa" },
  ].filter(Boolean);

  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AboutPage", url: `${site.url}/ve-chung-toi/`, name: `Về ${thuongHieu.ten}`,
        about: { "@type": "AutoRepair", name: thuongHieu.ten, url: `${site.url}/`, parentOrganization: { "@type": "Organization", name: thuongHieu.congTyMe } },
      }} />
      <Hero
        nhan="Về chúng tôi"
        tieuDe={<>Do thợ lập ra,<br />để chủ xe đỡ khổ</>}
        moTa={`${thuongHieu.ten} là dịch vụ sửa ô tô tận nơi của tập đoàn ${thuongHieu.congTyMe}, đơn vị làm phụ tùng và đào tạo thợ ô tô nhiều năm nay.`}
        phai={<KhungAnh alt={`Đội thợ ${thuongHieu.ten}`} tiLe="16 / 9" uuTien className={s.anhHero} />}
      />

      <div className="wrap">
        <div className={s.hai}>
          <section className="khoi" aria-labelledby="cau-chuyen">
            <h2 id="cau-chuyen">Câu chuyện của {thuongHieu.ten}</h2>
            <p>Người sáng lập {thuongHieu.congTyMe} đi lên từ nghề kỹ thuật viên ô tô. Ngày còn cầm cờ lê, anh gặp mãi một cảnh: xe chết máy dưới hầm, chủ xe gọi cứu hộ chờ cả buổi, ra gara thì không biết giá trước.</p>
            <p>Chúng tôi làm {thuongHieu.ten} để đổi cảnh đó. Thợ tới tận nơi xe đang đỗ. Giá công đăng công khai. Thợ báo giá từng món trên điện thoại, bạn đồng ý mới làm.</p>
            <blockquote className={s.trich}>
              <b>“Sửa xe cho người ta như sửa xe nhà mình.”</b>
              <span>Câu đầu tiên mỗi thợ {thuongHieu.ten} được dạy ở lớp nhập môn.</span>
            </blockquote>
          </section>

          {soLieu.length ? (
            <section className="khoi" aria-labelledby="con-so">
              <h2 id="con-so">Những con số</h2>
              <dl className={s.soLieu}>
                {soLieu.map((x) => <div key={x.nhan}><dt>{x.nhan}</dt><dd>{x.so}</dd></div>)}
              </dl>
            </section>
          ) : null}
        </div>

        {t.doiTho.length ? (
          <section className="khoi" aria-labelledby="doi-tho">
            <div>
              <h2 id="doi-tho">Đội thợ</h2>
              <p className="phu">Ảnh thật của từng thợ. Ai cũng có chứng chỉ VCedu trước khi nhận đơn.</p>
            </div>
            <ul className={s.tho}>
              {t.doiTho.map((m) => (
                <li key={m.ten}>
                  <article className={s.theTho}>
                    <KhungAnh anh={m.anh} alt={`Thợ ${m.ten}`} tiLe="16 / 7" nhan="Ảnh thợ đang cập nhật" className={s.anhTho} />
                    <div className={s.thoChu}>
                      <div className={s.thoDau}>
                        <span className={s.chuDau} aria-hidden="true">{chuDau(m.ten)}</span>
                        <div>
                          <h3>{m.ten}</h3>
                          <span>{[m.soNamNghe ? `${m.soNamNghe} năm nghề` : null, m.khuVuc.join(", ") || null].filter(Boolean).join(" · ")}</span>
                        </div>
                      </div>
                      {m.chungChi.length ? (
                        <ul className={s.chungChi} aria-label="Chứng chỉ">
                          {m.chungChi.map((c) => (
                            <li key={c}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                              {c}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {m.gioiThieu ? <p className={s.thoGt}>{m.gioiThieu}</p> : null}
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="khoi" aria-labelledby="xuong">
          <h2 id="xuong">{viHoa(xuong)}</h2>
          <p>Việc nào không làm được tại chỗ, thợ kéo xe về {xuong}. Cùng một đội, cùng bảng giá, cùng chế độ bảo hành.</p>
          <div className={s.anhXuong}>
            <KhungAnh alt={`${viHoa(xuong)}`} tiLe="auto" className={s.anhLon} />
            <KhungAnh alt={`Cầu nâng tại ${xuong}`} tiLe="auto" />
            <KhungAnh alt={`Máy chẩn đoán tại ${xuong}`} tiLe="auto" />
          </div>
          <ul className={s.dsXuong}>
            {[
              "Cầu nâng, máy chẩn đoán chuyên sâu cho việc lớn: động cơ, hộp số, gầm",
              "Bạn xem tiến độ và duyệt báo giá qua Zalo như khi thợ tới nhà",
              `Thuộc chuỗi xưởng VCservice của ${thuongHieu.congTyMe}`,
            ].map((x) => (
              <li key={x}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="khoi" aria-labelledby="he-sinh-thai">
          <div>
            <h2 id="he-sinh-thai">Hệ sinh thái {thuongHieu.congTyMe}</h2>
            <p className="phu">Ba đơn vị anh em đứng sau mỗi lần thợ tới nhà bạn.</p>
          </div>
          <ul className={s.hst}>
            {HE_SINH_THAI.map((e) => (
              <li key={e.ma}>
                <span className={s.maHst} aria-hidden="true">{e.ma}</span>
                <div><h3>{e.ten}</h3><span>{e.lam}</span><span className={s.choBan}>{e.choBan}</span></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="khoi" aria-labelledby="cam-ket">
          <h2 id="cam-ket">Cam kết với bạn</h2>
          <dl className={s.camKet}>
            {camKetDs.map((p) => <div key={p.d}><dt>{p.lon}</dt><dd>{p.d}</dd></div>)}
          </dl>
          <div className={s.nut}>
            <Link href="/dat-lich/" className="nut nut-chinh nut-lon">Đặt lịch với {thuongHieu.ten}</Link>
            <Link href="/tuyen-tho/" className={s.tuyenTho}>Bạn là thợ? Làm cùng chúng tôi →</Link>
          </div>
        </section>
      </div>
    </>
  );
}
