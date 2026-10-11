import site from "../../site.config.mjs";
import { allEntries } from "../../lib/content.mjs";
import TeamGrid from "../../components/TeamGrid";
import { Commitments } from "../../components/Contact";

const team = () => allEntries("ky-thuat-vien").sort((a, b) => (a.data.thuTu ?? 99) - (b.data.thuTu ?? 99));

export function generateMetadata() {
  const has = team().length > 0;
  return {
    title: "Đội ngũ kỹ thuật viên",
    description: `Hồ sơ kỹ thuật viên ${site.name}: tay nghề, số năm kinh nghiệm, chứng chỉ. Người tới sửa xe cho bạn là ai.`,
    alternates: { canonical: "/doi-ngu/" },
    // Chưa có hồ sơ thì không cho Google lập chỉ mục trang trống.
    ...(!has && { robots: { index: false, follow: true } }),
  };
}

export default function TeamPage() {
  const list = team();
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="kicker">Đội ngũ</p>
          <h1>Người tới sửa xe cho bạn là ai</h1>
          <p className="lead">Mỗi kỹ thuật viên có hồ sơ tay nghề rõ ràng. Khi đặt thợ, bạn biết trước tên và ảnh người sẽ tới.</p>
        </div>
      </section>
      <section className="block">
        <div className="wrap">
          {list.length ? <TeamGrid team={list} /> : <p className="notice">Hồ sơ kỹ thuật viên đang được cập nhật.</p>}
          <div className="mt"><Commitments /></div>
        </div>
      </section>
    </>
  );
}
