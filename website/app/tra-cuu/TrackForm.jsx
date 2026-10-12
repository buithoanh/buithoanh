"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import OrderStatus from "../../components/OrderStatus";
import Icon from "../../components/Icon";
import { traCuu, lenhGanDay } from "../../lib/api";

// Ví dụ hiển thị khi chưa tra cứu. Không phải dữ liệu thật.
const DEMO = {
  ma: "VC-0000", dichVu: "Bảo dưỡng định kỳ", xe: "SUV 7 chỗ", trangThai: "dang-sua",
  ktv: { ten: "Kỹ thuật viên của bạn", chuyenMon: "Bảo dưỡng", bienSo: "30A-•••.••" },
  lichSu: [
    { trangThai: "tiep-nhan", luc: "08:05 · Đã báo giá, bạn đồng ý" },
    { trangThai: "dang-toi", luc: "08:10 · Xuất phát" },
    { trangThai: "dang-sua", luc: "08:42 · Thợ bắt đầu làm" },
  ],
};
const REFRESH_MS = 20000;

export default function TrackForm({ endpoint, mock, hotline, telHref }) {
  const [sdt, setSdt] = useState("");
  const [ma, setMa] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | found | notfound | error | offline
  const [order, setOrder] = useState(null);
  const [recent, setRecent] = useState([]);
  const [updated, setUpdated] = useState("");
  const resultRef = useRef(null);

  const lookup = useCallback(async (s, m, quiet = false) => {
    if (!quiet) setState("loading");
    const r = await traCuu({ endpoint, mock }, s, m);
    if (r.status === 200) {
      setOrder(r.order);
      setState("found");
      setUpdated(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      // Điện thoại: kết quả nằm dưới form, cuộn tới cho khách thấy ngay.
      if (!quiet && window.matchMedia("(max-width: 899px)").matches) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } else if (!quiet) setState(r.status === 404 ? "notfound" : r.status === "offline" ? "offline" : "error");
  }, [endpoint, mock]);

  // Mở từ link sau khi đặt lịch (?sdt=...&ma=...) thì tra cứu luôn.
  useEffect(() => {
    setRecent(lenhGanDay());
    const q = new URLSearchParams(window.location.search);
    if (q.get("sdt") && q.get("ma")) {
      setSdt(q.get("sdt"));
      setMa(q.get("ma"));
      lookup(q.get("sdt"), q.get("ma"));
    }
  }, [lookup]);

  // Đang theo dõi một lệnh chưa xong thì tự cập nhật, giống app gọi xe.
  useEffect(() => {
    if (state !== "found" || order?.trangThai === "da-thanh-toan") return;
    const t = setInterval(() => lookup(sdt, ma, true), REFRESH_MS);
    return () => clearInterval(t);
  }, [state, order, sdt, ma, lookup]);

  function submit(e) {
    e.preventDefault();
    lookup(sdt, ma);
  }
  function pick(s, m) {
    setSdt(s);
    setMa(m);
    lookup(s, m);
  }

  const call = telHref ? <a href={telHref}><b>{hotline}</b></a> : "hotline";
  return (
    <div className="track">
      <div className="track-left">
        <form className="card-lg track-form" onSubmit={submit}>
          <label className="fld">Số điện thoại đặt lịch
            <input required type="tel" inputMode="tel" autoComplete="tel" pattern="[0-9 +.]{9,15}" placeholder="09xx xxx xxx" value={sdt} onChange={(e) => setSdt(e.target.value)} />
          </label>
          <label className="fld">Mã lệnh sửa chữa
            <input required placeholder="Ví dụ: VC-1234" autoCapitalize="characters" value={ma} onChange={(e) => setMa(e.target.value)} />
          </label>
          <button className="btn btn-primary btn-lg" type="submit" disabled={state === "loading"}>
            <Icon name="search" size={20} />{state === "loading" ? "Đang tìm…" : "Tra cứu"}
          </button>
          {state === "notfound" && <p className="notice" role="alert">Không tìm thấy lệnh khớp số điện thoại và mã này. Kiểm tra lại, hoặc gọi {call}.</p>}
          {state === "error" && <p className="notice" role="alert">Chưa tra cứu được. Thử lại sau ít phút, hoặc gọi {call}.</p>}
          {state === "offline" && <p className="notice" role="status">Hệ thống tra cứu online sắp mở. Trong lúc chờ, gọi {call} để hỏi tình trạng xe.</p>}
        </form>
        {recent.length > 0 && (
          <div className="recent">
            <p className="aside-label">Lệnh đã đặt trên máy này</p>
            {recent.map((r) => (
              <button key={r.ma} type="button" className="mini" onClick={() => pick(r.sdt, r.ma)}>
                <span className="mini-ic"><Icon name="receipt" size={20} /></span>
                <span><b>{r.ma}</b><small>{r.dichVu}</small></span>
              </button>
            ))}
          </div>
        )}
        {mock && (
          <div className="mock-hint">
            <b>Dữ liệu mẫu để thử:</b>
            <button type="button" className="link" onClick={() => pick("0912345678", "VC-2401")}>0912 345 678 · VC-2401 (thợ đang tới)</button>
            <button type="button" className="link" onClick={() => pick("0987654321", "VC-2398")}>0987 654 321 · VC-2398 (đang sửa)</button>
            <button type="button" className="link" onClick={() => pick("0901234567", "VC-2385")}>0901 234 567 · VC-2385 (đã thanh toán)</button>
          </div>
        )}
      </div>
      <div className="track-result" aria-live="polite" ref={resultRef}>
        {state === "found" && order ? (
          <>
            <OrderStatus order={order} />
            {order.trangThai !== "da-thanh-toan" && <p className="track-hint track-live"><span className="live-dot" />Tự cập nhật · lần cuối {updated}</p>}
          </>
        ) : (
          <>
            <p className="track-hint">Kết quả tra cứu trông như thế này:</p>
            <OrderStatus order={DEMO} demo />
          </>
        )}
      </div>
    </div>
  );
}
