"use client";
import { useState } from "react";
import OrderStatus, { ORDER_STEPS } from "../../components/OrderStatus";
import Icon from "../../components/Icon";

// Ví dụ hiển thị khi hệ thống tra cứu chưa mở. Không phải dữ liệu thật.
const DEMO = {
  ma: "VC-0000", dichVu: "Bảo dưỡng định kỳ", xe: "SUV 7 chỗ", trangThai: "dang-sua",
  ktv: { ten: "Kỹ thuật viên của bạn", chuyenMon: "Bảo dưỡng", bienSo: "30A-•••.••" },
  lichSu: [
    { trangThai: "tiep-nhan", luc: "08:05 · Đã báo giá, bạn đồng ý" },
    { trangThai: "dang-toi", luc: "08:10 · Xuất phát" },
    { trangThai: "dang-sua", luc: "08:42 · Thợ bắt đầu làm" },
  ],
};

export default function TrackForm({ endpoint, hotline, telHref }) {
  const [sdt, setSdt] = useState("");
  const [ma, setMa] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | found | notfound | error | offline
  const [order, setOrder] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (!endpoint) { setState("offline"); return; }
    setState("loading");
    try {
      const q = new URLSearchParams({ sdt: sdt.replace(/\D/g, ""), ma: ma.trim().toUpperCase() });
      const r = await fetch(`${endpoint}?${q}`, { headers: { Accept: "application/json" } });
      if (r.status === 404) { setState("notfound"); return; }
      if (!r.ok) throw new Error(String(r.status));
      const data = await r.json();
      if (!ORDER_STEPS.some((s) => s.key === data.trangThai)) throw new Error("trangThai");
      setOrder(data);
      setState("found");
    } catch { setState("error"); }
  }

  const call = telHref ? <a href={telHref}><b>{hotline}</b></a> : "hotline";
  return (
    <div className="track">
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
      <div className="track-result">
        {state === "found" && order ? <OrderStatus order={order} /> : (
          <>
            <p className="track-hint">Kết quả tra cứu trông như thế này:</p>
            <OrderStatus order={DEMO} demo />
          </>
        )}
      </div>
    </div>
  );
}
