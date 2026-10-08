#!/usr/bin/env python3
"""Dây chuyền làm video TikTok sản phẩm: ảnh + kịch bản -> video dọc 1080x1920 có giọng đọc.

Các bước:
  1. Ảnh sản phẩm -> khung dọc 1080x1920, chèn tiêu đề   (PhotoCraft CLI; thiếu thì dùng ffmpeg)
  2. Kịch bản -> giọng đọc tiếng Việt                    (VieNeu-TTS, API /v1/audio/speech)
  3. Ghép ảnh + giọng thành video mp4                     (ffmpeg)

Ví dụ:
  python3 pipeline/lam_video.py --anh anh/ma-phanh.jpg --kich-ban kich-ban.txt \
      --tieu-de "Má phanh còn sống không?" --giong "Hải Đăng" --out output/ma-phanh.mp4

Chỉ dùng thư viện chuẩn của Python. Cần ffmpeg trên PATH.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path

W, H = 1080, 1920
SAMPLE_RATE = 48000


def log(msg: str) -> None:
    print(f"[lam_video] {msg}", file=sys.stderr)


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"Lệnh thất bại ({r.returncode}): {' '.join(cmd)}\n{r.stderr.strip()[-2000:]}")


# ---------- Bước 1: ảnh ----------

def photocraft_bin() -> str | None:
    return os.environ.get("PHOTOCRAFT_CLI") or shutil.which("photocraft-cli")


def frame_photocraft(cli: str, src: Path, dst: Path, title: str) -> None:
    # Thu ảnh vừa khung 1080x1920 (giữ tỉ lệ), mở rộng nền trắng, rồi chèn tiêu đề ở phần trên.
    # Tham số lấy từ `photocraft-cli commands --json` (PhotoCraft 0.3.0).
    w, h = image_size(src)
    scale = min(W / w, H / h)
    cmds: list[tuple[str, dict]] = [
        ("image.imageSize", {"width": max(1, round(w * scale)), "height": max(1, round(h * scale)), "resample": "lanczos"}),
        ("image.canvasSize", {"width": W, "height": H, "anchor": "center", "extensionColor": "white"}),
    ]
    if title:
        cmds.append(("type.create", {"text": title, "x": W // 2, "y": 240, "align": "center",
                                     "size": 64, "weight": 800, "color": "#111111"}))
    argv = [cli, "run", str(src)]
    for name, params in cmds:
        argv += ["--cmd", name, "--params", json.dumps(params, ensure_ascii=False)]
    run(argv + ["--out", str(dst)])


def image_size(path: Path) -> tuple[int, int]:
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                        "-of", "csv=p=0", str(path)], capture_output=True, text=True)
    w, h = (int(x) for x in r.stdout.strip().split(",")[:2])
    return w, h


def frame_ffmpeg(src: Path, dst: Path) -> None:
    vf = f"scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=white,format=yuv420p"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", vf, "-frames:v", "1", str(dst)])


def make_frames(images: list[Path], title: str, work: Path, use_photocraft: bool) -> list[Path]:
    cli = photocraft_bin() if use_photocraft else None
    if use_photocraft and not cli:
        log("Không thấy photocraft-cli, dùng ffmpeg để đóng khung ảnh (không chèn tiêu đề lên ảnh).")
    frames = []
    for i, src in enumerate(images):
        dst = work / f"khung_{i:02d}.png"
        if cli:
            try:
                frame_photocraft(cli, src, dst, title if i == 0 else "")
            except SystemExit as e:
                log(f"PhotoCraft lỗi với {src.name}, chuyển sang ffmpeg. Chi tiết: {e}")
                frame_ffmpeg(src, dst)
        else:
            frame_ffmpeg(src, dst)
        # Chuẩn hoá về đúng 1080x1920 dù bước trên ra kích thước nào.
        norm = work / f"khung_{i:02d}_n.png"
        frame_ffmpeg(dst, norm)
        frames.append(norm)
    return frames


# ---------- Bước 2: giọng đọc ----------

def tts_vieneu(text: str, voice: str, url: str, out_wav: Path) -> None:
    body = {"model": "vieneu-v3-turbo", "input": text, "response_format": "pcm", "sample_rate": SAMPLE_RATE}
    if voice:
        body["voice"] = voice
    req = urllib.request.Request(url.rstrip("/") + "/v1/audio/speech", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    key = os.environ.get("VIENEU_API_KEY")
    if key:
        req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            pcm = r.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"VieNeu trả lỗi {e.code}: {e.read().decode(errors='replace')[:500]}")
    except urllib.error.URLError as e:
        raise SystemExit(f"Không kết nối được VieNeu ở {url} ({e.reason}). Đã chạy server VieNeu chưa? Xem pipeline/README.md")
    if not pcm:
        raise SystemExit("VieNeu không trả về âm thanh.")
    raw = out_wav.with_suffix(".pcm")
    raw.write_bytes(pcm)
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SAMPLE_RATE), "-ac", "1",
         "-i", str(raw), str(out_wav)])


def duration(path: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


# ---------- Bước 3: ghép video ----------

def render(frames: list[Path], audio: Path, out: Path) -> None:
    per = max(duration(audio) / len(frames), 0.5)
    argv = ["ffmpeg", "-y", "-loglevel", "error"]
    for f in frames:
        argv += ["-loop", "1", "-t", f"{per:.3f}", "-i", str(f)]
    argv += ["-i", str(audio)]
    # Mỗi ảnh zoom nhẹ cho đỡ tĩnh, rồi nối liền.
    parts = []
    for i in range(len(frames)):
        n = int(per * 30)
        parts.append(f"[{i}:v]scale={W * 2}:{H * 2},zoompan=z='min(zoom+0.0008,1.08)':d={n}:s={W}x{H}:fps=30,setsar=1[v{i}]")
    concat = "".join(f"[v{i}]" for i in range(len(frames))) + f"concat=n={len(frames)}:v=1:a=0,format=yuv420p[v]"
    argv += ["-filter_complex", ";".join(parts + [concat]), "-map", "[v]", "-map", f"{len(frames)}:a",
             "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k",
             "-shortest", "-movflags", "+faststart", str(out)]
    run(argv)


def main() -> int:
    p = argparse.ArgumentParser(description="Làm video TikTok dọc từ ảnh sản phẩm và kịch bản.")
    p.add_argument("--anh", nargs="+", required=True, type=Path, help="Một hoặc nhiều ảnh sản phẩm")
    p.add_argument("--kich-ban", required=True, type=Path, help="File .txt chứa lời đọc")
    p.add_argument("--tieu-de", default="", help="Chữ chèn lên ảnh đầu tiên")
    p.add_argument("--giong", default="Hải Đăng", help="Tên giọng VieNeu (GET /v1/voices)")
    p.add_argument("--vieneu-url", default=os.environ.get("VIENEU_URL", "http://127.0.0.1:8000"))
    p.add_argument("--giong-co-san", type=Path, help="Bỏ qua bước đọc, dùng file âm thanh này")
    p.add_argument("--khong-photocraft", action="store_true", help="Chỉ dùng ffmpeg để xử lý ảnh")
    p.add_argument("--out", required=True, type=Path)
    a = p.parse_args()

    if not shutil.which("ffmpeg"):
        raise SystemExit("Cần cài ffmpeg trước. Xem pipeline/README.md")
    for img in a.anh:
        if not img.is_file():
            raise SystemExit(f"Không thấy ảnh: {img}")
    text = a.kich_ban.read_text(encoding="utf-8").strip()
    if not text:
        raise SystemExit("Kịch bản đang trống.")

    a.out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="lam_video_") as tmp:
        work = Path(tmp)
        log(f"Bước 1/3: xử lý {len(a.anh)} ảnh")
        frames = make_frames(a.anh, a.tieu_de, work, not a.khong_photocraft)
        if a.giong_co_san:
            log("Bước 2/3: dùng file giọng có sẵn")
            audio = a.giong_co_san
        else:
            log(f"Bước 2/3: đọc kịch bản bằng giọng '{a.giong}' ({len(text)} ký tự)")
            audio = work / "giong.wav"
            tts_vieneu(text, a.giong, a.vieneu_url, audio)
        log("Bước 3/3: ghép video")
        render(frames, audio, a.out)
    log(f"Xong: {a.out} ({duration(a.out):.1f} giây)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
