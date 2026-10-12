import Icon from "./Icon";

// Các bước của một lệnh sửa chữa. Khoá (key) phải khớp trường trangThai mà API VCgarage trả về.
export const ORDER_STEPS = [
  { key: "tiep-nhan", label: "Đã tiếp nhận", note: "Tổng đài đã nhận yêu cầu và báo giá" },
  { key: "dang-toi", label: "Kỹ thuật viên đang tới", note: "Thợ đang di chuyển tới vị trí xe" },
  { key: "dang-sua", label: "Đang sửa", note: "Thợ đang làm việc tại xe" },
  { key: "hoan-tat", label: "Hoàn tất", note: "Bàn giao xe, kiểm tra lại cùng bạn" },
  { key: "da-thanh-toan", label: "Đã thanh toán", note: "Có hoá đơn điện tử" },
];

/**
 * Thẻ trạng thái lệnh sửa chữa: ai đang tới, xe biển số gì, bao lâu tới (học từ Xanh SM/Grab),
 * và dòng thời gian từng bước (học từ Ahamove/GHN). Dùng cho trang tra cứu và hình minh hoạ ở trang chủ.
 */
export default function OrderStatus({ order, demo = false }) {
  const idx = Math.max(0, ORDER_STEPS.findIndex((s) => s.key === order.trangThai));
  const times = Object.fromEntries((order.lichSu || []).map((h) => [h.trangThai, h.luc]));
  const ktv = order.ktv;
  const xong = idx === ORDER_STEPS.length - 1;
  return (
    <div className="order">
      <div className="order-head">
        <div>
          <small>Lệnh sửa chữa {order.ma}</small>
          <b>{order.dichVu}</b>
          {order.xe && <span>{order.xe}</span>}
        </div>
        {demo && <span className="tag">Minh hoạ</span>}
      </div>
      {order.trangThai === "dang-toi" && order.duKienPhut != null && (
        <div className="order-eta"><Icon name="clock" size={20} /><span>Thợ tới sau khoảng <b>{order.duKienPhut} phút</b></span></div>
      )}
      {ktv && (
        <div className="order-ktv">
          {ktv.anh ? <img src={ktv.anh} alt="" width="52" height="52" /> : <span className="avatar"><Icon name="user" size={26} /></span>}
          <div>
            <b>{ktv.ten}</b>
            <span>{[ktv.chuyenMon, ktv.bienSo && `Xe ${ktv.bienSo}`].filter(Boolean).join(" · ")}</span>
          </div>
          {ktv.sdt && <a className="icon-btn icon-btn-brand" href={`tel:${ktv.sdt.replace(/[^\d+]/g, "")}`} aria-label={`Gọi ${ktv.ten}`}><Icon name="phone" size={20} /></a>}
        </div>
      )}
      {order.tongTien && (
        <div className="order-total"><span>Tổng thanh toán</span><b>{order.tongTien}</b></div>
      )}
      <ol className="timeline">
        {ORDER_STEPS.map((s, i) => (
          <li key={s.key} className={i < idx || xong ? "done" : i === idx ? "now" : ""}>
            <span className="dot">{(i < idx || xong) && <Icon name="check" size={14} />}</span>
            <div><b>{s.label}</b><small>{times[s.key] || s.note}</small></div>
          </li>
        ))}
      </ol>
    </div>
  );
}
