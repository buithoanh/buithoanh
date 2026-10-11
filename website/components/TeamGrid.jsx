import Icon from "./Icon";

/** Hồ sơ kỹ thuật viên, học từ trang chuyên gia của Long Châu/Tâm Anh: ảnh thật, số năm, chứng chỉ. */
export default function TeamGrid({ team }) {
  return (
    <div className="team-grid">
      {team.map(({ slug, data: d, html }) => (
        <article key={slug} className="ktv">
          {d.anh ? <img src={d.anh} alt={`Ảnh ${d.ten}`} width="96" height="96" loading="lazy" /> : <span className="avatar avatar-lg"><Icon name="user" size={36} /></span>}
          <h3>{d.ten}</h3>
          {d.chucDanh && <p className="ktv-role">{d.chucDanh}</p>}
          {d.namKinhNghiem && <p className="ktv-exp"><b>{d.namKinhNghiem}</b> năm kinh nghiệm</p>}
          {d.chuyenMon?.length > 0 && <ul className="chips">{d.chuyenMon.map((c) => <li key={c} className="chip">{c}</li>)}</ul>}
          {d.chungChi?.length > 0 && <ul className="ktv-cert">{d.chungChi.map((c) => <li key={c}><Icon name="shield" size={16} />{c}</li>)}</ul>}
          {html.trim() && <div className="ktv-bio" dangerouslySetInnerHTML={{ __html: html }} />}
        </article>
      ))}
    </div>
  );
}
