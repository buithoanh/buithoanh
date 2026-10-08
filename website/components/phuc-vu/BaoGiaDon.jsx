"use client";
// Màn BaoGia (/don/[token]/bao-gia/): khách xem báo giá chính thức của thợ, bỏ hạng mục không bắt buộc
// (tổng tiền cập nhật ngay), tích đồng ý rồi duyệt; hoặc từ chối, chỉ trả phí kiểm tra.
import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DauDon from "@/components/chung/DauDon";
import { lopForm } from "@/components/chung/Form";
import { tinhGiam } from "@/lib/khuyen-mai.mjs";
import TheTho from "./TheTho";
import LoiLink from "./LoiLink";
import { goiApi } from "./hoi-lai";
import { dongPhu, gio, ngay, tien } from "./dinh-dang";
import s from "./phuc-vu.module.css";
import b from "./BaoGiaDon.module.css";

const THU_TU_MUC = { canLamNgay: 0, nenLam: 1, coTheDeSau: 2 };
const LOP_MUC = { canLamNgay: b.mucGap, nenLam: b.mucNen, coTheDeSau: b.mucSau };

function moTaMa(km) {
  if (!km) return "";
  if (km.kieuGiam === "phanTram") return `giảm ${km.giaTri}% tiền công${km.giamToiDa ? `, tối đa ${tien(km.giamToiDa)}` : ""}`;
  return `giảm ${tien(km.giaTri)}`;
}

function DaDuyet({ token, tong, soHangMuc, luc, sdt, tieuDeRef, dangSua }) {
  return (
    <section className={s.ketQua}>
      <span className={s.vongXanh} aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      </span>
      <h1 ref={tieuDeRef} tabIndex={-1}>Đã duyệt báo giá</h1>
      <p>{dangSua ? "Thợ bắt đầu sửa. Bạn sẽ nhận ảnh trước khi sửa và link thanh toán VietQR khi xong." : "Báo giá này đã được bạn duyệt. Xem trạng thái đơn để biết bước tiếp theo."}</p>
      <div className={s.the}>
        <div className={s.hang}><span>Tổng đã duyệt</span><b>{tien(tong)}</b></div>
        <div className={s.hang}><span>Số hạng mục</span><b>{soHangMuc}</b></div>
        {luc ? <div className={s.hang}><span>Thời điểm</span><b>{ngay(luc)} {gio(luc)}</b></div> : null}
        {sdt ? <div className={s.hang}><span>Số điện thoại</span><b>{sdt}</b></div> : null}
      </div>
      <Link className="nut nut-toi nut-day nut-lon" href={`/don/${token}/`}>Xem trạng thái đơn</Link>
    </section>
  );
}

export default function BaoGiaDon({ token, banDau, sdt, hotline, trangThaiDon }) {
  const router = useRouter();
  const { baoGia, phiDiLai, phiKiemTra, khuyenMai, tho, xe } = banDau;
  const [bo, setBo] = useState([]);
  const [dongY, setDongY] = useState(false);
  const [loiDongY, setLoiDongY] = useState("");
  const [loi, setLoi] = useState("");
  const [dang, setDang] = useState(false);
  const [daDuyet, setDaDuyet] = useState(baoGia.trangThai === "daDuyet" ? baoGia.ketQua : null);
  const [moTuChoi, setMoTuChoi] = useState(false);
  const [lyDo, setLyDo] = useState("");
  const [tuChoi, setTuChoi] = useState(baoGia.trangThai === "tuChoi" ? { thongBao: "Bạn đã chọn không sửa theo báo giá này." } : null);
  const [loiLink, setLoiLink] = useState(null);
  const tieuDeRef = useRef(null);
  const daChuyen = useRef(false);

  const hangMuc = useMemo(
    () => [...baoGia.hangMuc].sort((x, y) => (THU_TU_MUC[x.mucDo] ?? 9) - (THU_TU_MUC[y.mucDo] ?? 9)),
    [baoGia.hangMuc],
  );
  const chon = hangMuc.filter((h) => !bo.includes(h.ma));
  const tienCong = chon.filter((h) => h.loai === "cong").reduce((a, h) => a + h.gia, 0);
  const phuTung = chon.filter((h) => h.loai !== "cong").reduce((a, h) => a + h.gia, 0);
  const giam = !baoGia.phatSinh && khuyenMai ? tinhGiam(khuyenMai, { tienCong, tongTien: tienCong + phuTung + phiDiLai }) : 0;
  const tong = tienCong + phuTung + phiDiLai - giam;

  // Sau khi duyệt / từ chối: đưa tiêu điểm lên tiêu đề kết quả để trình đọc màn hình đọc ngay
  useEffect(() => {
    if (daChuyen.current) { tieuDeRef.current?.focus(); window.scrollTo(0, 0); }
  }, [daDuyet, tuChoi]);

  if (loiLink) return <LoiLink status={loiLink} hotline={hotline} />;

  const xuLyLoi = (r) => {
    if (r.status === 404 || r.status === 410) return setLoiLink(r.status);
    if (r.status === 409) { router.refresh(); return setLoi(r.json.loi || "Báo giá đã được xử lý. Đang tải lại…"); }
    setLoi(r.json.loi || "Chưa gửi được, thử lại sau ít phút.");
  };

  const duyet = async () => {
    setLoi("");
    if (!dongY) { setLoiDongY("Tích ô đồng ý báo giá trước khi bấm."); return; }
    setDang(true);
    const r = await goiApi(`/api/don-hang/theo-doi/${token}/bao-gia/duyet`, { method: "POST", body: { boHangMuc: bo, dongY: true } });
    setDang(false);
    if (!r.ok) return xuLyLoi(r);
    daChuyen.current = true;
    setDaDuyet(r.json.baoGia?.ketQua || { luc: new Date().toISOString(), boHangMuc: bo, tienCong, phuTung });
  };

  const xacNhanTuChoi = async () => {
    setLoi("");
    setDang(true);
    const r = await goiApi(`/api/don-hang/theo-doi/${token}/bao-gia/tu-choi`, { method: "POST", body: { lyDo } });
    setDang(false);
    if (!r.ok) return xuLyLoi(r);
    daChuyen.current = true;
    setTuChoi(r.json);
  };

  const dau = <DauDon tieuDe={`Báo giá đơn ${banDau.ma}`} phu={dongPhu(xe?.ten, xe?.bienSo)} />;

  if (daDuyet) {
    const soBo = (daDuyet.boHangMuc || []).length;
    return (
      <>
        {dau}
        <DaDuyet
          token={token} tieuDeRef={tieuDeRef} sdt={sdt} luc={daDuyet.luc}
          dangSua={daChuyen.current || ["dangSua", "choDuyetBaoGia"].includes(trangThaiDon)}
          tong={(daDuyet.tienCong || 0) + (daDuyet.phuTung || 0) + phiDiLai}
          soHangMuc={baoGia.hangMuc.length - soBo}
        />
      </>
    );
  }

  if (tuChoi) {
    const thanhToan = tuChoi.trangThai === "choThanhToan";
    return (
      <>
        {dau}
        <section className={s.ketQua}>
          <span className={s.vongCam} aria-hidden="true">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>
          </span>
          <h1 ref={tieuDeRef} tabIndex={-1}>{baoGia.phatSinh ? "Không làm phần phát sinh" : "Không sửa theo báo giá"}</h1>
          <p>{tuChoi.thongBao}</p>
          {thanhToan ? <Link className="nut nut-chinh nut-day nut-lon" href={`/don/${token}/thanh-toan/`}>Thanh toán phí kiểm tra</Link> : null}
          <Link className={thanhToan ? `${s.nutVien} nut-day` : "nut nut-toi nut-day nut-lon"} href={`/don/${token}/`}>Xem trạng thái đơn</Link>
        </section>
      </>
    );
  }

  return (
    <>
      {dau}
      <h1 className="sr-only">Duyệt báo giá đơn {banDau.ma}</h1>
      <section className={s.vung}>
        <TheTho
          tho={tho || { ten: "Thợ ThợTới" }} xeVan={false}
          tieuDe={baoGia.phatSinh ? `Thợ ${tho?.ten || ""} báo hạng mục phát sinh` : `Thợ ${tho?.ten || ""} đã kiểm tra xe`}
          phu="Chọn hạng mục bạn muốn làm rồi bấm Đồng ý."
        />
        {baoGia.chanDoan ? <p className={b.chanDoan}><b>Chẩn đoán:</b> {baoGia.chanDoan}</p> : null}
        {banDau.daDuyetTruoc?.length ? (
          <p className="bao bao-cam">Phần đã duyệt trước vẫn giữ nguyên. Báo giá này chỉ gồm phần phát sinh.</p>
        ) : null}
      </section>

      <section className={s.vungSat} aria-label="Các hạng mục">
        {hangMuc.map((h) => {
          const on = !bo.includes(h.ma);
          const tuyChon = h.tuyChon ?? !h.batBuoc;
          return (
            <div key={h.ma} className={`${b.muc} ${on ? "" : b.mucBo}`}>
              <div className={b.mucTren}>
                {h.anh?.length ? (
                  <a className={b.anh} href={h.anh[0]} target="_blank" rel="noopener" aria-label={`Xem ảnh lỗi: ${h.ten}`}>
                    <img src={h.anh[0]} alt="" width="64" height="64" loading="lazy" />
                    {h.anh.length > 1 ? <span className={b.themAnh}>+{h.anh.length - 1}</span> : null}
                  </a>
                ) : null}
                <div className={b.mucChu}>
                  <b>{h.ten}{on ? null : <span className="sr-only"> (đã bỏ)</span>}</b>
                  {h.lyDo ? <span>{h.lyDo}</span> : null}
                  <span className={`${b.mucDo} ${LOP_MUC[h.mucDo] || b.mucSau}`}>{h.mucDoNhan}</span>
                </div>
                <b className={b.gia}>{h.giaHienThi || tien(h.gia)}</b>
              </div>
              {tuyChon ? (
                <button
                  type="button" className={on ? b.nutBo : b.nutThem}
                  onClick={() => setBo(on ? [...bo, h.ma] : bo.filter((x) => x !== h.ma))}
                  aria-label={on ? `Bỏ hạng mục ${h.ten}` : `Thêm lại hạng mục ${h.ten}`}
                >
                  {on ? "Bỏ hạng mục này" : "Thêm lại"}
                </button>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className={`${s.the} ${b.tongKet}`} aria-label="Tổng tiền">
        <div className={s.hang}><span>Tiền công</span><span>{tien(tienCong)}</span></div>
        <div className={s.hang}><span>Phụ tùng</span><span>{tien(phuTung)}</span></div>
        <div className={s.hang}><span>Phí đi lại</span><span>{phiDiLai ? tien(phiDiLai) : "Đã tính ở báo giá trước"}</span></div>
        {giam ? <div className={s.hang}><span>Mã {khuyenMai.ma} (dự kiến)</span><span className={b.giam}>{tien(-giam)}</span></div> : null}
        <div className={s.ke} />
        <div className={s.tong}><b>Tổng cộng</b><b className={s.tongSo} aria-live="polite">{tien(tong)}</b></div>
        <span className={s.ghiChu}>
          Phụ tùng chính hãng từ VCparts. Phát sinh hạng mục mới, thợ sẽ gửi báo giá để bạn duyệt lại.
          {khuyenMai && !giam ? ` Mã ${khuyenMai.ma} (${moTaMa(khuyenMai)}) được trừ khi thanh toán.` : ""}
          {giam ? ` Mã ${khuyenMai.ma}: ${moTaMa(khuyenMai)}; số tiền chốt khi thợ báo xong.` : ""}
        </span>
      </section>

      <section className={b.hanhDong}>
        <div className={lopForm.oTich}>
          <label htmlFor="dong-y-bao-gia">
            <input
              type="checkbox" id="dong-y-bao-gia" checked={dongY}
              onChange={(e) => { setDongY(e.target.checked); if (e.target.checked) setLoiDongY(""); }}
              aria-invalid={loiDongY ? true : undefined} aria-describedby={loiDongY ? "dong-y-bao-gia-loi" : undefined}
            />
            <span>Tôi đồng ý báo giá trên ({chon.length} hạng mục) và cho thợ bắt đầu làm. <b className={b.batBuoc}>Bắt buộc</b></span>
          </label>
          {loiDongY ? <span id="dong-y-bao-gia-loi" className={s.loi} role="alert">{loiDongY}</span> : null}
        </div>
        {loi ? <p className="bao bao-loi" role="alert">{loi}</p> : null}
        <button type="button" className="nut nut-chinh nut-lon nut-day" onClick={duyet} disabled={dang} aria-busy={dang || undefined}>
          {dang && !moTuChoi ? "Đang gửi…" : `Đồng ý ${tien(tong)}`}
        </button>
        {!moTuChoi ? (
          <button type="button" className={s.nutVien} onClick={() => setMoTuChoi(true)} disabled={dang} aria-expanded="false" aria-controls="tu-choi">
            {baoGia.phatSinh ? "Không làm phần phát sinh" : "Không sửa, chỉ trả phí kiểm tra"}
          </button>
        ) : (
          <div id="tu-choi" className={b.tuChoi}>
            <b>{baoGia.phatSinh ? "Không làm phần phát sinh?" : "Không sửa theo báo giá này?"}</b>
            <span>
              {baoGia.phatSinh
                ? "Thợ chỉ làm tiếp các hạng mục bạn đã đồng ý trước đó."
                : `Đơn kết thúc, bạn chỉ trả phí kiểm tra ${tien(phiKiemTra)}.`}
            </span>
            <label htmlFor="ly-do" className={lopForm.nhan}>Lý do (không bắt buộc)</label>
            <textarea id="ly-do" className={lopForm.o} rows={3} maxLength={500} value={lyDo} onChange={(e) => setLyDo(e.target.value)} />
            <button type="button" className="nut nut-toi nut-day" onClick={xacNhanTuChoi} disabled={dang} aria-busy={dang || undefined}>
              {dang ? "Đang gửi…" : "Xác nhận không sửa"}
            </button>
            <button type="button" className={s.nutChu} onClick={() => setMoTuChoi(false)}>Quay lại báo giá</button>
          </div>
        )}
        <span className={`${s.ghiChu} ${s.giua}`}>Khi bấm Đồng ý, hệ thống lưu thời điểm, số điện thoại và nội dung bạn đã duyệt.</span>
      </section>
    </>
  );
}
