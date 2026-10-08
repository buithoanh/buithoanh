import QuanTri from "./QuanTri";

export const metadata = { title: "Quản trị", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <section className="block">
      <div className="wrap">
        <QuanTri />
      </div>
    </section>
  );
}
