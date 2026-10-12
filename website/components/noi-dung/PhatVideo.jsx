"use client";
// Video YouTube trong bài: HTML bài chỉ có ảnh xem trước + nút phát (lib/noi-dung.ts). Bấm phát mới tải iframe
// (youtube-nocookie), để trang không phải tải trình phát YouTube nặng khi mở bài.
import { useEffect } from "react";

export default function PhatVideo({ vungId }) {
  useEffect(() => {
    const vung = document.getElementById(vungId);
    if (!vung) return;
    const bam = (e) => {
      const nut = e.target.closest?.(".video-youtube-phat");
      if (!nut || !vung.contains(nut)) return;
      const fig = nut.closest(".video-youtube");
      const id = fig?.dataset.youtubeId;
      if (!id || !/^[\w-]{11}$/.test(id)) return;
      const ifr = document.createElement("iframe");
      ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      ifr.title = fig.querySelector("figcaption")?.textContent || "Video YouTube";
      ifr.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      ifr.className = "video-youtube-khung";
      fig.querySelector("img")?.remove();
      nut.replaceWith(ifr);
      fig.classList.add("dang-phat");
      ifr.focus();
    };
    vung.addEventListener("click", bam);
    return () => vung.removeEventListener("click", bam);
  }, [vungId]);
  return null;
}
