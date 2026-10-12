// Mục lục "Trong bài này" từ h2/h3 của bài. Dùng <details> nên đóng/mở được cả khi tắt JavaScript.
import Icon from "../Icon";
import s from "./MucLuc.module.css";

export default function MucLuc({ muc }) {
  const h2 = muc.filter((m) => m.cap === 2);
  if (muc.length < 2) return null;
  // Gom h3 vào dưới h2 đứng trước nó.
  const nhom = [];
  for (const m of muc) {
    if (m.cap === 2 || !nhom.length) nhom.push({ ...m, con: [] });
    else nhom[nhom.length - 1].con.push(m);
  }
  return (
    <nav aria-label="Mục lục" className={s.mucLuc}>
      <details open>
        <summary>
          <span>Trong bài này</span>
          <span className={s.phai}>
            <span className={s.khiMo}>Thu gọn</span>
            <span className={s.khiDong}>{h2.length || muc.length} mục</span>
            <Icon name="xuong" size={18} className={s.mui} />
          </span>
        </summary>
        <ol>
          {nhom.map((m, i) => (
            <li key={m.id}>
              <a href={`#${m.id}`}><span className={s.so}>{i + 1}.</span><span className={s.chu}>{m.chu}</span></a>
              {m.con.length ? (
                <ol className={s.con}>
                  {m.con.map((c) => <li key={c.id}><a href={`#${c.id}`}><span className={s.chu}>{c.chu}</span></a></li>)}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
