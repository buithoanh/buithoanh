"use client";
// "Lấy mã giới thiệu của bạn": nhập số đã đặt thợ, mã + link xem lượt thưởng gửi qua Zalo (POST /api/gioi-thieu/gui-ma).
// Server trả lời giống nhau cho mọi số (không dò được ai là khách), nên giao diện cũng chỉ báo "nếu số này đã đặt thợ…".
import { useState } from "react";
import Link from "next/link";
import { TruongNhap, oNhap } from "../chung/Form";
import { chuanHoaSdt } from "@/lib/so-dien-thoai.mjs";
import { dungForm, guiJson } from "./dungForm";
import s from "./NhanMaGioiThieu.module.css";

const kiemTra = (v) => (chuanHoaSdt(v.sdt) ? { ok: true, loi: {} } : { ok: false, loi: { sdt: "Số điện thoại chưa đúng (10 số, bắt đầu bằng 03, 05, 07, 08, 09)." } });

export default function NhanMaGioiThieu() {
  const f = dungForm({ sdt: "" }, kiemTra, { tienTo: "gt-" });
  const [kq, datKq] = useState(null);

  async function gui(e) {
    e.preventDefault();
    const r = await f.gui((v) => guiJson("/api/gioi-thieu/gui-ma", { sdt: v.sdt }));
    if (r) datKq(r);
  }

  return (
    <div className={s.hop}>
      <h3 className={s.tieuDe}>Lấy mã giới thiệu của bạn</h3>
      {kq ? (
        <div role="status" className={s.xong}>
          <p>{kq.thongBao || "Nếu số này đã đặt thợ, mã giới thiệu sẽ tới Zalo trong vài giây."}</p>
          <p className="phu nho">Tin nhắn có link xem mã, link chia sẻ và số lượt miễn phí của bạn.</p>
          {kq.giaLap?.linkXem ? (
            <p className="bao bao-vang nho">Máy chạy thử (tin nhắn giả lập): <Link href={new URL(kq.giaLap.linkXem).pathname}>mở link mã {kq.giaLap.ma}</Link></p>
          ) : null}
          <button type="button" className={s.lai} onClick={() => datKq(null)}>Nhập số khác</button>
        </div>
      ) : (
        <form onSubmit={gui} noValidate className={s.form}>
          <p className={s.mo}>Nhập số điện thoại đã đặt thợ, mã riêng gửi về Zalo trong vài giây.</p>
          <TruongNhap id="gt-sdt" nhan="Số điện thoại" loi={f.loi.sdt}>
            <input
              {...oNhap("gt-sdt", f.loi.sdt)} type="tel" inputMode="tel" autoComplete="tel" placeholder="09xx xxx xxx"
              value={f.giaTri.sdt} onChange={(e) => f.doi("sdt", e.target.value)} onBlur={() => f.roi("sdt")}
            />
          </TruongNhap>
          {f.loiChung ? <p className="bao bao-loi" role="alert">{f.loiChung}</p> : null}
          <button type="submit" className="nut nut-toi nut-day" disabled={f.dangGui}>{f.dangGui ? "Đang gửi…" : "Nhận mã qua Zalo"}</button>
        </form>
      )}
    </div>
  );
}
