// HTML nội dung từ CMS (noiDungHtml() trong lib/noi-dung.ts) có khối giá, khối đặt lịch, video YouTube (bấm phát mới tải).
// Dùng cho trang dịch vụ, khu vực, hãng xe.
import PhatVideo from "../noi-dung/PhatVideo";
import s from "./NoiDungCms.module.css";

export default function NoiDungCms({ html, id = "noi-dung-cms", className = "" }) {
  if (!html) return null;
  return (
    <>
      <div id={id} className={`noi-dung-bai ${s.nd} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
      {html.includes("video-youtube") ? <PhatVideo vungId={id} /> : null}
    </>
  );
}
