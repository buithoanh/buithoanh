// Link riêng "Mã giới thiệu của bạn" (gửi qua Zalo khi khách bấm "Nhận mã qua Zalo" ở /hoi-vien/): mã, link chia sẻ,
// thống kê lượt mở / đơn hoàn thành / lượt miễn phí còn lại. Không lên Google (robots + header noindex).
import Link from "next/link";
import { notFound } from "next/navigation";
import { layPayload } from "@/lib/cms";
import { layChung } from "@/lib/giao-dien";
import { xemGioiThieu } from "@/lib/gioi-thieu";
import DauDon from "@/components/chung/DauDon";
import Icon from "@/components/Icon";
import NutSaoChep from "@/components/p2/NutSaoChep";
import ChiaSeMa from "@/components/p2/ChiaSeMa";
import { BuocSo, OSo, TheThuong } from "@/components/p2/KhoiP2";
import s from "./gioi-thieu.module.css";

export const metadata = {
  title: "Mã giới thiệu của bạn",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function doc(token) {
  try {
    return await xemGioiThieu(await layPayload(), token);
  } catch (e) {
    if (e?.status === 404) return null;
    throw e;
  }
}

const vietTat = (ten) => String(ten || "").trim().split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase();

export default async function TrangGioiThieu({ params }) {
  const { token } = await params;
  const [d, chung] = await Promise.all([doc(token), layChung()]);
  if (!d) notFound();
  const ten = chung.thuongHieu?.ten || "ThợTới";
  const linkHien = d.link.replace(/^https?:\/\//, "");
  const tk = d.thongKe;
  const loiMoi = `Mình hay gọi ${ten} sửa ô tô tận nơi. Đặt qua link này được ${d.thuong.banBe.moTa.toLowerCase()} (mã ${d.ma}):`;

  return (
    <>
      <DauDon tieuDe="Mã giới thiệu của bạn" phu={`Giới thiệu bạn bè dùng ${ten}`} thuongHieu={ten} />
      <div className={s.than}>
        <h1 className="sr-only">Mã giới thiệu {d.ma}</h1>
        {d.tamDung ? (
          <p className="bao bao-vang" role="status">Mã này đang tạm dừng. Bạn bè đặt bằng mã sẽ chưa được ưu đãi. Gọi {chung.lienHe?.hotline || "hotline"} để được hỗ trợ.</p>
        ) : null}

        <section className={s.hop} aria-label="Mã và link giới thiệu">
          <div className={s.chuMa}>
            {d.hoTen ? <span className={s.avatar} aria-hidden="true">{vietTat(d.hoTen)}</span> : null}
            <span><b>Mã giới thiệu của bạn</b><span className="phu nho">{d.hoTen ? `${d.hoTen} · ` : ""}{d.sdtChe}</span></span>
          </div>
          <div className={s.hangMa}>
            <span className={s.ma} aria-label={`Mã giới thiệu ${d.ma.split("").join(" ")}`}>{d.ma}</span>
            <NutSaoChep giaTri={d.ma} nhan="Sao chép" moTa="mã giới thiệu" toi />
          </div>
          <div className={s.oLink}>
            <label htmlFor="link-gioi-thieu">Link giới thiệu</label>
            <div className={s.hangMa}>
              <input id="link-gioi-thieu" type="text" readOnly value={linkHien} className={s.input} />
              <NutSaoChep giaTri={d.link} nhan="Chép link" moTa="link giới thiệu" toi />
            </div>
          </div>
          <ChiaSeMa link={d.link} loiMoi={loiMoi} />
          <div className={s.so}>
            <OSo so={tk.soLuotMo} chu="bạn đã mở link" />
            <OSo so={tk.soDonHoanThanh + (tk.soGoiHoiVien || 0)} chu={tk.soGoiHoiVien ? "đơn, gói đã hoàn thành" : "đơn đã hoàn thành"} />
            <OSo so={tk.luotConLai} chu="lượt miễn phí đi lại" nhan />
          </div>
          {tk.luotDaDung ? <p className="phu nho">Đã dùng {tk.luotDaDung}/{tk.luotDuocThuong} lượt được thưởng.</p> : null}
        </section>

        <section className={s.khoi} aria-labelledby="tieu-de-thuong">
          <h2 id="tieu-de-thuong">Nhận thưởng thế nào</h2>
          <BuocSo buoc={[
            { t: "Gửi mã hoặc link cho bạn bè", d: `Bấm Chia sẻ qua Zalo, hoặc chép link ${linkHien}.` },
            { t: "Bạn bè đặt lịch qua link", d: "Mã tự gắn vào đơn, bạn bè không cần nhớ hay gõ lại." },
            { t: "Đơn sửa xong, thanh toán", d: "Bạn bè được miễn phí đi lại ngay trong đơn đầu." },
            { t: "Bạn nhận lượt miễn phí", d: `${ten} nhắn Zalo báo, lượt tự trừ vào lần gọi thợ sau.` },
          ]} />
          <TheThuong thuong={d.thuong} />
        </section>

        <section className={s.khoi}>
          <Link href="/hoi-vien/" className={`nut nut-trang nut-day ${s.nutVien}`}><Icon name="shield" size={18} /> Xem gói hội viên</Link>
          <Link href="/dat-lich/" className="nut nut-chinh nut-day">Đặt thợ tới tận nơi</Link>
        </section>

        <p className={s.chan}>
          <Icon name="shield" size={18} />
          <span>Link này chỉ dành cho bạn. Gửi bạn bè link giới thiệu ở trên, đừng gửi link của trang này.</span>
        </p>
      </div>
    </>
  );
}
