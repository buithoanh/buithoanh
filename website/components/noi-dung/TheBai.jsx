// Thẻ bài cẩm nang. kieu: "noiBat" (ảnh to, có tóm tắt), "dong" (ảnh nhỏ bên trái), "ngang" (thẻ hẹp cuộn ngang, bài liên quan).
import Link from "next/link";
import { formatDate } from "@/lib/cms";
import Icon from "../Icon";
import KhungAnh from "../chung/KhungAnh";
import { nhanBai } from "./bai";
import s from "./TheBai.module.css";

export default function TheBai({ bai, kieu = "dong", the: The = "h3" }) {
  const href = `/cam-nang/${bai.slug}/`;
  const ngay = formatDate(bai.ngay);
  const doc = bai.thoiGianDocPhut ? `${bai.thoiGianDocPhut} phút đọc` : null;
  if (kieu === "noiBat") {
    return (
      <Link href={href} className={`${s.the} ${s.noiBat}`}>
        <KhungAnh anh={bai.anh} tiLe="16 / 9" className={s.anhTo} nhan="Ảnh minh hoạ đang cập nhật" />
        <div className={s.than}>
          <span className={s.nhanCam}>{nhanBai(bai)}</span>
          <The className={s.tieuDeTo}>{bai.title}</The>
          {bai.description ? <p className={s.tomTat}>{bai.description}</p> : null}
          <span className={s.meta}>
            <Icon name="calendar" size={14} /> <time dateTime={bai.ngay}>{ngay}</time>
            {doc ? <><span aria-hidden="true">·</span><Icon name="dong-ho" size={14} /> {doc}</> : null}
          </span>
        </div>
      </Link>
    );
  }
  return (
    <Link href={href} className={`${s.the} ${kieu === "ngang" ? s.ngang : s.dong}`}>
      <span className={s.anhNho} aria-hidden="true" />
      <div className={s.than}>
        <span className={s.nhanChu}>{nhanBai(bai)}</span>
        <The className={s.tieuDe}>{bai.title}</The>
        <span className={s.metaNho}><time dateTime={bai.ngay}>{ngay}</time>{doc ? ` · ${doc}` : ""}</span>
      </div>
    </Link>
  );
}
