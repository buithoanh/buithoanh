"use client";
import { useState } from "react";

/** Lấy toạ độ GPS của điện thoại và điền vào ô vị trí dạng "Vị trí GPS: lat, lng". */
export function useLocate(onFound) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  function locate() {
    if (!("geolocation" in navigator)) { setLocError("Máy không hỗ trợ định vị. Bạn nhập địa chỉ giúp nhé."); return; }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onFound(`Vị trí GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
      },
      () => {
        setLocating(false);
        setLocError("Chưa lấy được vị trí. Bật định vị cho trình duyệt hoặc nhập địa chỉ giúp nhé.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }
  return { locate, locating, locError };
}
