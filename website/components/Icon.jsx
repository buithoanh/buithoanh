// Biểu tượng nét đơn giản, vẽ inline để không phải tải thêm thư viện. Luôn aria-hidden vì chữ bên cạnh đã mô tả.
const paths = {
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />,
  chat: <path d="M4 5h16v11H9l-5 4zM8 10h8M8 13h5" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="M5 12l5 5 9-10" />,
  battery: <><rect x="2" y="7" width="18" height="12" rx="2" /><path d="M6 4v3M16 4v3M6 13h4M8 11v4M13 13h3" /></>,
  tire: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v5M12 16v5M3 12h5M16 12h5" /></>,
  engine: <path d="M4 10h2V8h4V6h5v2h2l2 2h2v6h-2l-2 3H9l-2-2H4zM1 11v4" />,
  brake: <><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="2.5" /><path d="M16 4a9 9 0 0 1 5 6" /></>,
  tow: <><path d="M2 16V9h9l3 4h6v3" /><circle cx="6" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M14 9l5-5" /></>,
  oil: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
  shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5" />,
  pin: <><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></>,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />,
  wrench: <path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5a4 4 0 0 1-2-2zM14.5 6.5l3-3a4 4 0 0 0-3 3z" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7" />,
  // Luồng đơn (DatLich, GoiGap)
  "dong-x": <path d="M6 6l12 12M18 6L6 18" />,
  "quay-lai": <path d="M15 18l-6-6 6-6" />,
  "may-anh": <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  "dinh-vi": <path d="M3 11l19-9-9 19-2-8z" />,
  "gui-di": <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  "dong-ho": <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  "nguon-dien": <path d="M12 2v6M6.3 6.3a8 8 0 1 0 11.4 0" />,
  "hoi": <><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></>,
  // Nội dung + P2 (cẩm nang, hội viên, doanh nghiệp, tuyển thợ)
  "tim-kiem": <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></>,
  "xuong": <path d="M6 9l6 6 6-6" />,
  "tai-xuong": <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  "sao-chep": <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" /></>,
  "tai-lieu": <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></>,
  "phat": <path d="M8 5v14l11-7z" />,
  "xe": <><path d="M3 13l2-6h14l2 6v5h-3M6 18H3v-5h18" /><circle cx="7.5" cy="17.5" r="1.5" /><circle cx="16.5" cy="17.5" r="1.5" /></>,
};

export default function Icon({ name, size = 20, className }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

// Biểu tượng cho từng dịch vụ theo slug
export const iconDichVu = {
  "bao-duong-dinh-ky": "oil",
  "ac-quy": "battery",
  lop: "tire",
  "doc-loi-chan-doan": "engine",
  phanh: "brake",
  "cuu-ho-keo-xe": "tow",
};
