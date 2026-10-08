import QuanTri from "./QuanTri";

export const metadata = { title: "Lịch hẹn", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <section className="block">
      <div className="wrap">
        <QuanTri />
      </div>
    </section>
  );
}
