"use client";
import { Button, toast, useDocumentInfo } from "@payloadcms/ui";
import { useEffect, useState } from "react";

type TrangThai = "chuaChay" | "dangChay" | "xong" | "loi";
type TuKhoa = { ai?: { trangThai?: TrangThai; thongBao?: string }; baiViet?: number | string | { id: number | string } | null };

export function NutAIVietNhap() {
  const { id } = useDocumentInfo();
  const [tk, setTk] = useState<TuKhoa | null>(null);
  const [dangGui, setDangGui] = useState(false);

  const tai = async () => {
    if (!id) return;
    const r = await fetch(`/api/tu-khoa/${id}?depth=0`, { credentials: "include" });
    if (r.ok) setTk(await r.json());
  };

  useEffect(() => { void tai(); }, [id]);

  // Đang viết thì 10 giây hỏi lại một lần
  const trangThai = tk?.ai?.trangThai;
  useEffect(() => {
    if (trangThai !== "dangChay") return;
    const t = setInterval(() => void tai(), 10_000);
    return () => clearInterval(t);
  }, [trangThai]);

  if (!id) return <p style={{ opacity: 0.7 }}>Lưu từ khoá trước, rồi mới dùng được AI.</p>;

  const bat = async () => {
    setDangGui(true);
    try {
      const r = await fetch(`/api/tu-khoa/${id}/ai-viet-nhap`, { method: "POST", credentials: "include" });
      const kq = await r.json().catch(() => ({}));
      if (r.ok) toast.success("AI bắt đầu viết. Khoảng 2–5 phút, trang tự cập nhật.");
      else toast.error(kq.loi || "Không bắt đầu được.");
      await tai();
    } finally {
      setDangGui(false);
    }
  };

  const baiId = tk?.baiViet && typeof tk.baiViet === "object" ? tk.baiViet.id : tk?.baiViet;
  return (
    <div style={{ marginBottom: 16 }}>
      <Button onClick={bat} disabled={dangGui || trangThai === "dangChay"} buttonStyle="primary" size="medium">
        {trangThai === "dangChay" ? "AI đang viết…" : "AI viết bản nháp"}
      </Button>
      {tk?.ai?.thongBao && <p style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{tk.ai.thongBao}</p>}
      {trangThai === "xong" && baiId && <a href={`/admin/collections/cam-nang/${baiId}`}>Mở bản nháp →</a>}
    </div>
  );
}
