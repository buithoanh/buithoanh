// Dấu hiệu thương hiệu tạm: ghim vị trí có cờ lê, ý "xe dừng đâu, thợ tới đó". Cùng hình với public/favicon.svg.
export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="12" fill="#e8590c" />
      <path d="M24 9c-7 0-12.5 5.3-12.5 12 0 9 12.5 19 12.5 19s12.5-10 12.5-19C36.5 14.3 31 9 24 9z" fill="#fff" />
      <g transform="translate(24 21) rotate(45)" fill="#13283f">
        <rect x="-1.8" y="-2" width="3.6" height="11" rx="1.6" />
        <path d="M-5.5 -6.5a5.5 5.5 0 1 0 11 0h-2.8v3.2h-5.4v-3.2z" />
      </g>
    </svg>
  );
}
