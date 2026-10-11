"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export default function MobileMenu({ links }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <div className="mmenu">
      <button className="icon-btn" aria-expanded={open} aria-controls="mmenu-panel" aria-label={open ? "Đóng menu" : "Mở menu"} onClick={() => setOpen(!open)}>
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open && (
        <nav id="mmenu-panel" className="mmenu-panel" aria-label="Menu">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}<Icon name="arrow" size={18} /></Link>
          ))}
        </nav>
      )}
    </div>
  );
}
