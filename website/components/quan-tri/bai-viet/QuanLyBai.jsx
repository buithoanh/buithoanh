"use client";
// Màn QtBaiViet (phần tương tác): lọc danh sách bài, xem chi tiết bài đang chọn (SEO, kết quả kiểm tra, góp ý),
// gửi duyệt / trả lại / duyệt & đăng / hẹn giờ đăng qua REST Payload, tạo trang khu vực từ mẫu.
// Nội dung bài soạn trong /admin (nút "Mở trình soạn thảo").
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import IconQt from "../IconQt";
import ThongBao from "../ThongBao";
import { goiApi, ngayGio } from "../api";
import q from "../qt.module.css";
import s from "./QuanLyBai.module.css";

const TT = {
  nhap: { nhan: "Nháp", lop: q.ttXam },
  "cho-duyet": { nhan: "Chờ duyệt", lop: q.ttCam },
  "hen-gio": { nhan: "Đã hẹn giờ", lop: q.ttLam },
  "da-dang": { nhan: "Đã đăng", lop: q.ttXanh },
};
const LOC_TT = [["all", "Tất cả"], ["nhap", "Nháp"], ["cho-duyet", "Chờ duyệt"], ["hen-gio", "Đã hẹn giờ"], ["da-dang", "Đã đăng"]];
const LOC_LOAI = [["all", "Mọi loại"], ["cam-nang", "Bài cẩm nang"], ["dich-vu", "Trang dịch vụ"], ["khu-vuc", "Trang khu vực"], ["hang-xe", "Trang hãng xe"]];
// Luật độ dài giống bộ kiểm tra của CMS (lib/kiem-tra.mjs)
const TIEU_DE = [25, 70];
const MO_TA = [100, 170];

const khoa = (b) => `${b.collection}:${b.id}`;
const boDau = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const catChu = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trim()}…` : t);

/** slug cho /xem-truoc/?loai=&slug= lấy từ đường dẫn công khai. */
function slugXemTruoc(b) {
  const p = b.duongDan.split("/").filter(Boolean);
  if (b.loai === "khu-vuc") return p.length >= 3 ? `${p[1]}-${p[2]}` : "";
  return p[p.length - 1] || "";
}

/** Kết quả kiểm tra của CMS ("723 chữ\n✗ lỗi\n! cảnh báo") → danh sách dòng. */
function dongKiemTra(chu) {
  const dong = String(chu || "").split("\n").map((x) => x.trim()).filter(Boolean);
  return dong.map((d, i) => {
    if (d.startsWith("✗")) return { muc: "loi", chu: d.slice(1).trim() };
    if (d.startsWith("!")) return { muc: "canh-bao", chu: d.slice(1).trim() };
    return { muc: "dat", chu: i === 0 && /^\d+ chữ$/.test(d) ? `Độ dài bài: ${d}` : d };
  });
}

function mai7Gio() {
  const d = new Date(Date.now() + 7 * 3600e3 + 86400e3); // giờ VN ngày mai
  return { ngay: d.toISOString().slice(0, 10), gio: "07:00" };
}

export default function QuanLyBai({ bai, laNguoiDuyet, dichVu, khuVuc, tenMien }) {
  const router = useRouter();
  const [locTT, setLocTT] = useState(laNguoiDuyet && bai.some((b) => b.trangThai === "cho-duyet") ? "cho-duyet" : "all");
  const [locLoai, setLocLoai] = useState("all");
  const [tim, setTim] = useState("");
  const [chon, setChon] = useState(null);
  const [tb, setTb] = useState(null);
  const [dangGui, setDangGui] = useState(false);
  const [moMau, setMoMau] = useState(false);
  const [mau, setMau] = useState({ dichVu: dichVu[0]?.slug || "", quan: khuVuc[0]?.slug || "" });
  const [cheDo, setCheDo] = useState("ngay");
  const [hen, setHen] = useState(mai7Gio);
  const [gopY, setGopY] = useState(null); // null = đóng ô góp ý

  const dem = (k) => bai.filter((b) => k === "all" || b.trangThai === k).length;
  const ds = useMemo(() => {
    const t = boDau(tim.trim());
    return bai.filter((b) => (locTT === "all" || b.trangThai === locTT) && (locLoai === "all" || b.loai === locLoai) &&
      (!t || boDau(`${b.tieuDe} ${b.title} ${b.duongDan}`).includes(t)));
  }, [bai, locTT, locLoai, tim]);
  const hienTai = bai.find((b) => khoa(b) === chon) || ds[0] || bai[0];
  const soTrangKhuVuc = bai.filter((b) => b.loai === "khu-vuc").length;

  const chonBai = (b) => {
    setChon(khoa(b));
    setTb(null);
    setGopY(null);
    if (b.henGioDang) {
      const d = new Date(new Date(b.henGioDang).getTime() + 7 * 3600e3).toISOString();
      setCheDo("hen");
      setHen({ ngay: d.slice(0, 10), gio: d.slice(11, 16) });
    } else {
      setCheDo("ngay");
      setHen(mai7Gio());
    }
  };

  async function lam(viec, goi, thanhCong) {
    if (dangGui) return;
    setDangGui(viec);
    setTb(null);
    try {
      const kq = await goi();
      setTb({ loai: "ok", chu: typeof thanhCong === "function" ? thanhCong(kq) : thanhCong });
      router.refresh();
      return kq;
    } catch (e) {
      setTb({ loai: "loi", chu: e.message });
    } finally {
      setDangGui(false);
    }
  }

  const b = hienTai;
  const urlBai = b ? `/api/${b.collection}/${b.id}` : "";
  const henIso = () => new Date(`${hen.ngay}T${hen.gio}:00+07:00`).toISOString();
  const henChu = () => {
    const d = new Date(`${hen.ngay}T${hen.gio}:00+07:00`);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const guiDuyet = () => lam("gui", () => goiApi(`${urlBai}?draft=true`, { method: "PATCH", body: { trangThaiDuyet: "choDuyet" } }),
    "Đã gửi duyệt. Người duyệt (Quản trị, Quản lý dịch vụ) thấy bài trong mục Chờ duyệt. Bài chỉ lên web sau khi được duyệt.");
  const traLai = () => {
    if (!gopY?.trim()) {
      setTb({ loai: "loi", chu: "Viết góp ý để người viết biết cần sửa gì." });
      return;
    }
    lam("tra", () => goiApi(`${urlBai}?draft=true`, { method: "PATCH", body: { trangThaiDuyet: "canSua", ghiChuDuyet: gopY.trim() } }),
      `Đã trả bài lại${b.tacGia ? ` cho ${b.tacGia}` : ""} kèm góp ý. Bài chuyển về Nháp.`).then((kq) => kq && setGopY(null));
  };
  const duyet = () => {
    if (cheDo === "hen") {
      const iso = henIso();
      if (!(new Date(iso).getTime() > Date.now())) {
        setTb({ loai: "loi", chu: "Chọn ngày giờ đăng trong tương lai." });
        return;
      }
      lam("duyet", () => goiApi(`${urlBai}?draft=true`, { method: "PATCH", body: { trangThaiDuyet: "daHenGio", henGioDang: iso } }),
        `Đã duyệt. Bài sẽ tự lên web lúc ${henChu()}.`);
    } else {
      lam("duyet", () => goiApi(urlBai, { method: "PATCH", body: { _status: "published" } }), "Đã duyệt và đăng. Bài lên web ngay.");
    }
  };
  const taoTuMau = () => lam("mau", () => goiApi("/api/trang-khu-vuc/tao-tu-mau", { method: "POST", body: mau }), (kq) => {
    setMoMau(false);
    setChon(`trang-khu-vuc:${kq.id}`);
    setLocTT("all");
    setLocLoai("all");
    return `Đã tạo bản nháp “${kq.title}” từ mẫu. Viết đoạn riêng, thêm ảnh thật và đánh giá khách ở khu vực này rồi gửi duyệt.`;
  });

  const kiemTra = b ? dongKiemTra(b.ketQuaKiemTra) : [];
  const conLoi = kiemTra.some((k) => k.muc === "loi");
  const tl = b ? (b.title || "").length : 0;
  const ml = b ? (b.description || "").length : 0;
  const demChu = (n, [lo, hi]) => (
    <span className={n >= lo && n <= hi ? s.demDat : s.demLoi}>{n}/{hi} ký tự</span>
  );
  const dvChon = dichVu.find((d) => d.slug === mau.dichVu);
  const kvChon = khuVuc.find((k) => k.slug === mau.quan);

  return (
    <>
      <div className={q.dauTrang}>
        <div>
          <h1>Bài viết &amp; trang</h1>
          <p>Viết bài cẩm nang, sửa trang dịch vụ và trang khu vực. Bài nào cũng phải được duyệt rồi mới lên web.</p>
        </div>
        <div className={q.hangNut}>
          <button type="button" className={q.nut} aria-expanded={moMau} onClick={() => setMoMau((x) => !x)}>
            <IconQt name="vung" />
            Tạo trang khu vực mới từ mẫu
          </button>
          <a className={`${q.nut} ${q.nutChinh}`} href="/admin/collections/cam-nang/create" target="_blank" rel="noopener">
            <IconQt name="them" />
            Viết bài mới
          </a>
        </div>
      </div>

      <ThongBao tb={tb} onDong={() => setTb(null)} />

      {moMau ? (
        <section aria-labelledby="h-mau" className={s.mau}>
          <div className={s.mauDau}>
            <h2 id="h-mau">Tạo trang khu vực mới từ mẫu</h2>
            <span className={q.phu}>Mẫu “Dịch vụ × khu vực” · đang có {soTrangKhuVuc} trang</span>
          </div>
          <div className={q.luoi}>
            <label className={q.truong}>Dịch vụ
              <select className={q.o} value={mau.dichVu} onChange={(e) => setMau({ ...mau, dichVu: e.target.value })}>
                {dichVu.map((d) => <option key={d.slug} value={d.slug}>{d.ten}</option>)}
              </select>
            </label>
            <label className={q.truong}>Khu vực (trong vùng phục vụ)
              <select className={q.o} value={mau.quan} onChange={(e) => setMau({ ...mau, quan: e.target.value })}>
                {khuVuc.map((k) => <option key={k.slug} value={k.slug}>{k.ten}</option>)}
              </select>
            </label>
            <label className={q.truong}>Đường dẫn (tự tạo)
              <input className={q.o} type="text" readOnly value={`/dich-vu/${mau.dichVu}/${mau.quan}/`} />
            </label>
          </div>
          <div className={s.mauHop}>
            <div className={s.hopXam}>
              <b>Mẫu điền sẵn cho bạn</b>
              <span>Tiêu đề, khung bài, khối giá {dvChon ? dvChon.ten.toLowerCase() : ""} (lấy từ Bảng giá), câu hỏi thường gặp, nút đặt lịch đã chọn sẵn dịch vụ.</span>
              {kvChon ? <span>Thời gian đến dự kiến ở {kvChon.ten}: <b>{kvChon.etaTu}–{kvChon.etaDen} phút</b> (lấy từ Vùng phục vụ).</span> : null}
            </div>
            <div className={s.hopCam}>
              <b>Bạn phải tự thêm trước khi gửi duyệt</b>
              <span>Đoạn mô tả riêng về khu này (ít nhất 150 chữ) · ít nhất 2 ảnh việc thật chụp tại {kvChon?.ten || "khu vực này"} · ít nhất 1 đánh giá thật của khách ở {kvChon?.ten || "khu vực này"}.</span>
              <span className={q.phu}>Hệ thống so với các trang khác: trùng nội dung quá 70% thì chưa gửi duyệt được.</span>
            </div>
          </div>
          <div className={s.mauNut}>
            <button type="button" className={q.nut} onClick={() => setMoMau(false)}>Huỷ</button>
            <button type="button" className={`${q.nut} ${q.nutToi}`} disabled={!!dangGui || !mau.dichVu || !mau.quan} onClick={taoTuMau}>
              {dangGui === "mau" ? "Đang tạo…" : "Tạo bản nháp từ mẫu"}
            </button>
          </div>
        </section>
      ) : null}

      <div className={s.hai}>
        <section aria-label="Danh sách bài" className={`${q.the} ${s.danhSach}`}>
          <div className={s.boLoc}>
            <label className={q.truong}>Tìm bài
              <input className={q.o} type="search" value={tim} onChange={(e) => setTim(e.target.value)} placeholder="Gõ tên bài hoặc đường dẫn" />
            </label>
            <div>
              <span className={s.nhanLoc} id="loc-tt">Trạng thái</span>
              <div role="radiogroup" aria-labelledby="loc-tt" className={q.dayVien}>
                {LOC_TT.map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={locTT === k} className={q.vien} onClick={() => setLocTT(k)}>
                    {l} ({dem(k)})
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className={s.nhanLoc} id="loc-loai">Loại</span>
              <div role="radiogroup" aria-labelledby="loc-loai" className={q.dayVien}>
                {LOC_LOAI.map(([k, l]) => (
                  <button key={k} type="button" role="radio" aria-checked={locLoai === k} className={q.vien} onClick={() => setLocLoai(k)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          <div className={s.dem} aria-live="polite">Đang xem {ds.length} / {bai.length} bài và trang</div>
          {ds.length ? (
            <ul className={s.ds}>
              {ds.map((x) => (
                <li key={khoa(x)}>
                  <button type="button" className={s.dongBai} aria-current={b && khoa(x) === khoa(b) ? "true" : undefined} onClick={() => chonBai(x)}>
                    <b>{x.tieuDe}</b>
                    <span className={s.nhanDong}>
                      <span className={`${q.nhanTT} ${TT[x.trangThai]?.lop}`}>{TT[x.trangThai]?.nhan}</span>
                      <span className={`${q.nhanTT} ${q.ttXam}`}>{x.loaiNhan}</span>
                      {x.trangThaiDuyet === "canSua" ? <span className={`${q.nhanTT} ${q.ttDo}`}>Cần sửa</span> : null}
                    </span>
                    <span className={s.meta}>
                      {[x.tacGia, x.trangThai === "hen-gio" && x.henGioDang ? `Lên web ${ngayGio(x.henGioDang)}` : ngayGio(x.capNhat)].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={q.rong}>Không có bài nào khớp bộ lọc này.</p>
          )}
        </section>

        {b ? (
          <section aria-label="Bài đang chọn" className={s.chiTiet}>
            <div className={q.the}>
              <div className={s.ctDau}>
                <span className={`${q.nhanTT} ${TT[b.trangThai]?.lop}`}>{TT[b.trangThai]?.nhan}</span>
                <span className={q.phu}>{b.loaiNhan}{b.tacGia ? ` · ${b.tacGia}` : ""}</span>
                <span className={s.gian} />
                <span className={s.luuLuc}>
                  <IconQt name="dung" size={16} />
                  Cập nhật lúc {ngayGio(b.capNhat)}
                </span>
              </div>

              {laNguoiDuyet ? (
                <div className={`${s.vaiTro} ${s.vaiTroDuyet}`}>
                  Bạn đang dùng vai trò <b>người duyệt</b>: đọc lại bài, góp ý hoặc bấm <b>Duyệt &amp; đăng</b>. Giá trong bài sửa ở mục{" "}
                  <a href="/quan-tri/bang-gia/">Bảng giá &amp; dịch vụ</a>.
                </div>
              ) : (
                <div className={s.vaiTro}>
                  <IconQt name="khoa" />
                  <span>Bạn được viết, sửa, tải ảnh và gửi duyệt. <b>Không có quyền sửa giá.</b> Giá trong bài là khối lấy tự động từ Bảng giá; muốn đổi giá, nhắn Quản lý dịch vụ.</span>
                </div>
              )}

              <dl className={s.thongTin}>
                <div><dt>Loại trang</dt><dd>{b.loaiNhan}</dd></div>
                <div>
                  <dt>Đường dẫn</dt>
                  <dd>{b.daDang ? <a href={b.duongDan} target="_blank" rel="noopener">{b.duongDan}</a> : b.duongDan}</dd>
                </div>
              </dl>
              <div className={s.tieuDeBai}>
                <span className={s.nhanNho}>Tiêu đề bài (tiêu đề lớn duy nhất trên trang)</span>
                <p>{b.tieuDe}</p>
              </div>

              <div className={s.soan}>
                <div>
                  <b>Nội dung bài soạn trong trình soạn thảo của CMS</b>
                  <span>Chữ, tiêu đề mục, danh sách, bảng, ảnh (tự nén, bắt buộc mô tả ảnh), video YouTube, khối đặt lịch và khối giá lấy từ Bảng giá (không gõ giá tay).</span>
                </div>
                <div className={q.hangNut}>
                  <a className={`${q.nut} ${q.nutToi}`} href={b.sua} target="_blank" rel="noopener">
                    <IconQt name="but" />
                    Mở trình soạn thảo
                  </a>
                  <a className={q.nut} href={`/xem-truoc/?loai=${b.loai}&slug=${encodeURIComponent(slugXemTruoc(b))}`} target="_blank" rel="noopener">
                    <IconQt name="con-mat" />
                    Xem trước
                  </a>
                </div>
              </div>
            </div>

            <div className={s.luoiThe}>
              <div className={`${q.the} ${q.theDem}`}>
                <h2 className={s.h2}>Hiển thị trên Google</h2>
                <div className={s.oSeo}>
                  <span className={s.dongNhan}>Tiêu đề cho Google {demChu(tl, TIEU_DE)}</span>
                  <p>{b.title || "Chưa có"}</p>
                </div>
                <div className={s.oSeo}>
                  <span className={s.dongNhan}>Mô tả cho Google {demChu(ml, MO_TA)}</span>
                  <p>{b.description || "Chưa có"}</p>
                </div>
                <span className={q.phu}>Nên: tiêu đề {TIEU_DE[0]}–{TIEU_DE[1]} ký tự, mô tả {MO_TA[0]}–{MO_TA[1]} ký tự. Dài hơn Google sẽ cắt bớt. Sửa trong trình soạn thảo.</span>
                <div className={s.serp} aria-label="Xem trước kết quả Google">
                  <span className={s.serpNhan}>Xem trước kết quả Google</span>
                  <div className={s.serpSite}>
                    <span className={s.serpIcon} aria-hidden="true">TT</span>
                    <span className={s.serpTen}>
                      <span>{tenMien?.ten}</span>
                      <span>{[tenMien?.host, ...b.duongDan.split("/").filter(Boolean)].join(" › ")}</span>
                    </span>
                  </div>
                  <div className={s.serpTieuDe}>{catChu(b.title || b.tieuDe, 60)}</div>
                  <div className={s.serpMoTa}>{catChu(b.description || "", 160)}</div>
                </div>
              </div>

              <div className={`${q.the} ${q.theDem}`}>
                <h2 className={s.h2}>Khi nào lên web</h2>
                {laNguoiDuyet && b.trangThai !== "da-dang" ? (
                  <>
                    <div role="radiogroup" aria-label="Thời điểm đăng" className={s.cheDo}>
                      {[
                        ["ngay", "Đăng ngay khi được duyệt", "Bài lên web ngay lúc bạn bấm duyệt."],
                        ["hen", "Hẹn giờ đăng", "Chọn ngày giờ. Nên đăng 7:00 sáng, lúc khách hay tìm."],
                      ].map(([k, ten, phu]) => (
                        <button key={k} type="button" role="radio" aria-checked={cheDo === k} className={s.luaChon} onClick={() => setCheDo(k)}>
                          <span className={s.cham} aria-hidden="true" />
                          <span><b>{ten}</b><span>{phu}</span></span>
                        </button>
                      ))}
                    </div>
                    {cheDo === "hen" ? (
                      <>
                        <div className={s.henGio}>
                          <label className={q.truong}>Ngày đăng
                            <input className={q.o} type="date" value={hen.ngay} onChange={(e) => setHen({ ...hen, ngay: e.target.value })} />
                          </label>
                          <label className={q.truong}>Giờ đăng
                            <input className={q.o} type="time" value={hen.gio} onChange={(e) => setHen({ ...hen, gio: e.target.value })} />
                          </label>
                        </div>
                        <span className={q.phu}>Bài lên web lúc {henChu()}, chỉ khi đã được duyệt trước giờ đó.</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <p className={q.phu}>
                    {b.trangThai === "da-dang" ? "Bài đang hiện trên web. Sửa trong trình soạn thảo rồi gửi duyệt lại; bản đang hiện giữ nguyên tới khi bản mới được duyệt."
                      : b.trangThai === "hen-gio" && b.henGioDang ? `Đã hẹn lên web lúc ${ngayGio(b.henGioDang)}.`
                        : "Người duyệt chọn đăng ngay hoặc hẹn giờ đăng khi duyệt bài."}
                  </p>
                )}
              </div>

              <div className={`${q.the} ${q.theDem}`}>
                <h2 className={s.h2}>Soát trước khi gửi duyệt</h2>
                <ul className={s.kiemTra}>
                  {kiemTra.map((k, i) => (
                    <li key={i}>
                      <span className={`${s.dau} ${k.muc === "loi" ? s.dauLoi : k.muc === "canh-bao" ? s.dauCanhBao : s.dauDat}`} aria-hidden="true">
                        {k.muc === "dat" ? "✓" : "!"}
                      </span>
                      <span><span className="sr-only">{k.muc === "loi" ? "Lỗi: " : k.muc === "canh-bao" ? "Cảnh báo: " : "Đạt: "}</span>{k.chu}</span>
                    </li>
                  ))}
                  {!kiemTra.length ? <li><span className={q.phu}>Chưa có kết quả kiểm tra. Mở trình soạn thảo và lưu bài một lần.</span></li> : null}
                </ul>
                <span className={q.phu}>Kết quả tự cập nhật mỗi lần lưu bài trong trình soạn thảo. Còn lỗi thì chưa gửi duyệt, chưa đăng được.</span>
              </div>

              {b.ghiChuDuyet ? (
                <div className={`${q.the} ${q.theDem}`}>
                  <h2 className={s.h2}>Góp ý của người duyệt</h2>
                  <p className={s.gopY}>{b.ghiChuDuyet}</p>
                  {b.nguoiDuyet ? <span className={q.phu}>{b.nguoiDuyet}</span> : null}
                </div>
              ) : null}
            </div>

            {gopY !== null ? (
              <div className={`${q.the} ${q.theDem}`}>
                <label className={q.truong}>Góp ý cho người viết
                  <textarea className={q.o} rows={4} value={gopY} onChange={(e) => setGopY(e.target.value)} placeholder="Ví dụ: Đoạn 2 còn chung chung, thêm tên chung cư và tuyến đường cụ thể." />
                </label>
                <div className={q.hangNut}>
                  <button type="button" className={q.nut} onClick={() => setGopY(null)}>Huỷ</button>
                  <button type="button" className={`${q.nut} ${q.nutToi}`} disabled={!!dangGui} onClick={traLai}>
                    {dangGui === "tra" ? "Đang gửi…" : "Trả lại kèm góp ý"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className={s.chanNut}>
              <span>
                {laNguoiDuyet
                  ? `${b.tacGia ? `Bài của ${b.tacGia}` : "Bài"} · cập nhật ${ngayGio(b.capNhat)}. Duyệt xong, bài lên web đúng giờ đã chọn.`
                  : `Gửi duyệt xong, người duyệt (Quản trị, Quản lý dịch vụ) thấy bài trong mục Chờ duyệt. Bài chỉ lên web sau khi được duyệt.`}
              </span>
              <a className={`${q.nut} ${q.nutLon}`} href={b.sua} target="_blank" rel="noopener">Mở trình soạn thảo</a>
              <a className={`${q.nut} ${q.nutLon}`} href={`/xem-truoc/?loai=${b.loai}&slug=${encodeURIComponent(slugXemTruoc(b))}`} target="_blank" rel="noopener">
                Xem thử trên điện thoại
              </a>
              {!laNguoiDuyet || b.trangThai === "nhap" ? (
                <button type="button" className={`${q.nut} ${q.nutChinh} ${q.nutLon}`} disabled={!!dangGui || b.trangThai !== "nhap"}
                  title={conLoi ? "Còn lỗi trong mục Soát trước khi gửi duyệt" : undefined} onClick={guiDuyet}>
                  {dangGui === "gui" ? "Đang gửi…" : b.trangThai === "cho-duyet" ? "Đã gửi duyệt" : "Gửi duyệt"}
                </button>
              ) : null}
              {laNguoiDuyet && b.trangThai !== "nhap" && b.trangThai !== "da-dang" ? (
                <button type="button" className={`${q.nut} ${q.nutLon}`} disabled={!!dangGui} aria-expanded={gopY !== null} onClick={() => setGopY(gopY ?? "")}>
                  Trả lại kèm góp ý
                </button>
              ) : null}
              {laNguoiDuyet && b.trangThai !== "da-dang" ? (
                <button type="button" className={`${q.nut} ${q.nutXanh} ${q.nutLon}`} disabled={!!dangGui} onClick={duyet}>
                  {dangGui === "duyet" ? "Đang duyệt…" : cheDo === "hen" ? "Duyệt & hẹn giờ đăng" : "Duyệt & đăng"}
                </button>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
