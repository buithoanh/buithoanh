// Biểu tượng nét mảnh dùng ở trang chủ. Màu theo currentColor, kích thước theo CSS.
const paths = {
  "bao-duong-dinh-ky": <><path d="M12 3c-3 4-5 6.6-5 9.5a5 5 0 0 0 10 0C17 9.6 15 7 12 3Z" /><path d="M10 14.5a2 2 0 0 0 2 2" /></>,
  "ac-quy": <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M7 7V4.5h3V7M14 7V4.5h3V7M7 13.5h3M14 13.5h3M15.5 12v3" /></>,
  lop: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21" /></>,
  "doc-loi-chan-doan": <><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M7 11h2l1.5-3 3 6 1.5-3h2M9 21h6M12 17v4" /></>,
  phanh: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" /><path d="M5.5 7.5a8.5 8.5 0 0 1 4-3.5M18.5 16.5a8.5 8.5 0 0 1-4 3.5" strokeWidth="3.2" /></>,
  "cuu-ho-keo-xe": <><path d="M2 16V9h9v7M11 11h4l3 3v2M2 16h1M7 16h7M18 16h2" /><circle cx="5" cy="16.5" r="1.8" /><circle cx="16" cy="16.5" r="1.8" /><path d="M11 9 15 4.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />,
  quote: <><path d="M4 5h16v11H9l-5 4Z" /><path d="M8 9.5h8M8 12.5h5" /></>,
  part: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" /><path d="m4 7.5 8 4.5 8-4.5M12 12v9" /></>,
  clean: <><path d="M4 20h16M6 20V10a6 6 0 0 1 12 0v10" /><path d="M9 14h6" /></>,
  receipt: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  van: <><path d="M2 17V7a1 1 0 0 1 1-1h11l4 4h2.5a1.5 1.5 0 0 1 1.5 1.5V17" /><path d="M14 6v4h4M2 17h2M10 17h5M20 17h2" /><circle cx="7" cy="17.5" r="2" /><circle cx="17.5" cy="17.5" r="2" /></>,
  warn: <><path d="M12 3 2 20h20Z" /><path d="M12 10v4M12 17v.5" /></>,
  wrench: <path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4Z" />,
};

export default function Icon({ name, className = "ico" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.wrench}
    </svg>
  );
}
