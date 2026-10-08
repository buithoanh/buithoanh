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
