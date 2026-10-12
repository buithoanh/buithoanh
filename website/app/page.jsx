import Link from "next/link";
import site from "../site.config.mjs";
import { sortedServices, sortedArticles, symptoms, approvedPrice, team as teamEntries, reviews, stats } from "../lib/content.mjs";
import Reviews, { Stars } from "../components/Reviews";
import { CallButton, Commitments, telHref } from "../components/Contact";
import QuickBook from "../components/QuickBook";
import OrderStatus from "../components/OrderStatus";
import Icon from "../components/Icon";
import JsonLd from "../components/JsonLd";
import TeamGrid from "../components/TeamGrid";

// Dữ liệu minh hoạ cho thẻ "biết ai đang tới". Không phải lệnh thật.
const DEMO_ORDER = {
  ma: "VC-0000", dichVu: "Thay ắc quy", xe: "Sedan hạng B", trangThai: "dang-toi", duKienPhut: 15,
  ktv: { ten: "Kỹ thuật viên của bạn", chuyenMon: "Điện, ắc quy", bienSo: "30A-•••.••" },
  lichSu: [{ trangThai: "tiep-nhan", luc: "08:12 · Đã báo giá, bạn đồng ý" }, { trangThai: "dang-toi", luc: "08:15 · Xuất phát" }],
};

export default function Home() {
  const services = sortedServices();
  const articles = sortedArticles().slice(0, 3);
  const team = teamEntries();
  const rv = reviews();
  const st = stats();
  const names = Object.fromEntries(services.map((s) => [s.slug, s.data.ten]));
  const areas = site.serviceAreas.length ? site.serviceAreas.join(", ") : site.city;
  return (
    <>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "AutoRepair", name: site.name, slogan: site.slogan, url: site.url,
        ...(site.hotline && { telephone: site.hotline }),
        areaServed: site.serviceAreas.length ? site.serviceAreas.map((a) => ({ "@type": "AdministrativeArea", name: `${a}, ${site.city}` })) : site.city,
        parentOrganization: { "@type": "Organization", name: site.parent },
      }} />

      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow"><Icon name="pin" size={16} />Sửa ô tô tận nơi · {site.serviceAreas.length > 2 ? `${site.serviceAreas.length} quận ${site.city}` : areas}</p>
            <h1>Xe dừng đâu,<br /><em>thợ tới đó.</em></h1>
            <p className="lead">Thợ mang đồ nghề và phụ tùng tới tận chỗ xe bạn đang đỗ. Báo giá trước, đồng ý mới làm.</p>
          </div>

          <ul className="hero-points">
          <li><Icon name="check" size={18} />Biết trước ai tới, xe biển số gì</li>
          <li><Icon name="check" size={18} />Phụ tùng VCparts rõ nguồn gốc</li>
          <li><Icon name="check" size={18} />Thanh toán VietQR, có hoá đơn điện tử</li>
          </ul>
          {st && (
            <div className="hero-stats">
              <span><b>{st.diem}</b><Stars n={5} /><small>{st.soDanhGia} đánh giá</small></span>
              <span><b>{st.phutToi}′</b><small>thời gian tới trung bình</small></span>
              <span><b>{st.luotSua}</b><small>lượt sửa tận nơi</small></span>
            </div>
          )}
          <div className="hero-card">
            <QuickBook
              services={services.map((s) => ({ slug: s.slug, ngan: s.data.tenNgan || s.data.ten, icon: s.data.icon }))}
              telHref={telHref()} hotline={site.hotline}
            />
          </div>
        </div>
      </section>

      <section className="strip" aria-label="Cam kết">
        <div className="wrap"><Commitments /></div>
      </section>

      <section className="block" id="dich-vu">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Dịch vụ tận nơi</p>
              <h2>Xe cần gì, thợ mang tới đó</h2>
            </div>
            <Link className="link-more" href="/dat-lich/">Đặt lịch <Icon name="arrow" size={18} /></Link>
          </div>
          <div className="svc-grid">
            {services.map((s) => {
              const price = approvedPrice(s.data, s.slug);
              return (
                <Link key={s.slug} className="svc" href={`/dich-vu/${s.slug}/`}>
                  <span className="svc-ic"><Icon name={s.data.icon} size={30} /></span>
                  <h3>{s.data.ten}</h3>
                  <p>{s.data.tomTat}</p>
                  <span className="svc-foot">
                    <span className="price">{price ? <>Từ <b>{price}</b></> : "Báo giá trước khi làm"}</span>
                    <span className="go" aria-hidden="true"><Icon name="arrow" size={18} /></span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="block block-soft">
        <div className="wrap">
          <div className="sec-head">
            <div>
              <p className="kicker">Tự kiểm tra nhanh</p>
              <h2>Xe bạn đang bị gì?</h2>
            </div>
          </div>
          <div className="sym-grid">
            {symptoms().map((s) => (
              <Link key={s.href} className="sym" href={s.href}>
                <span className="sym-ic"><Icon name={s.icon} size={24} /></span>
                <span><b>{s.ten}</b><small>{s.moTa}</small></span>
                <Icon name="arrow" size={18} className="sym-go" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap track-grid">
          <div>
            <p className="kicker">Gọi là có</p>
            <h2>Biết rõ ai đang tới, bao lâu nữa tới</h2>
            <p className="sub">Khác garage truyền thống: bạn không phải chờ mà không biết gì. Mỗi lệnh sửa chữa đều có người phụ trách và trạng thái rõ ràng.</p>
            <ul className="feat">
              <li><span className="feat-ic"><Icon name="user" /></span><span><b>Tên và ảnh kỹ thuật viên</b>Biết trước người sẽ làm việc với xe bạn.</span></li>
              <li><span className="feat-ic"><Icon name="car" /></span><span><b>Biển số xe thợ, xe cứu hộ</b>Nhận ra ngay khi thợ tới nơi.</span></li>
              <li><span className="feat-ic"><Icon name="clock" /></span><span><b>Thời gian dự kiến</b>Cập nhật từ lúc tiếp nhận tới khi thanh toán.</span></li>
            </ul>
            <Link className="btn btn-dark" href="/tra-cuu/"><Icon name="search" size={20} />Tra cứu lệnh sửa chữa</Link>
          </div>
          <div className="phone" aria-label="Minh hoạ màn hình theo dõi lệnh sửa chữa">
            <div className="phone-notch" />
            <OrderStatus order={DEMO_ORDER} demo />
          </div>
        </div>
      </section>

      {rv.length > 0 && (
        <section className="block block-soft">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="kicker">Khách nói gì</p><h2>Gọi một lần, quay lại nhiều lần</h2></div>
              {st && <p className="rv-sum"><b>{st.diem}</b>/5 <Stars n={5} /> <span>{st.soDanhGia} đánh giá</span></p>}
            </div>
            <Reviews items={rv.slice(0, 6)} serviceNames={names} />
          </div>
        </section>
      )}

      <section className="block">
        <div className="wrap">
          <div className="sec-head"><div><p className="kicker">Quy trình</p><h2>4 bước, không phải ra garage</h2></div></div>
          <ol className="steps">
            <li><span className="step-ic"><Icon name="phone" /></span><b>Gọi hoặc đặt lịch</b>Cho biết dòng xe, vị trí và tình trạng.</li>
            <li><span className="step-ic"><Icon name="receipt" /></span><b>Nhận báo giá</b>Thợ báo giá công và phụ tùng trước, bạn đồng ý mới làm.</li>
            <li><span className="step-ic"><Icon name="wrench" /></span><b>Thợ tới tận nơi</b>Xe van đủ đồ nghề, có lót ghế và thảm giữ sạch xe.</li>
            <li><span className="step-ic"><Icon name="check" /></span><b>Thanh toán, đánh giá</b>Chuyển khoản VietQR hoặc tiền mặt, có hoá đơn điện tử.</li>
          </ol>
        </div>
      </section>

      {team.length > 0 && (
        <section className="block block-soft">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="kicker">Đội ngũ</p><h2>Kỹ thuật viên của {site.name}</h2></div>
              <Link className="link-more" href="/doi-ngu/">Xem tất cả <Icon name="arrow" size={18} /></Link>
            </div>
            <TeamGrid team={team.slice(0, 4)} />
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="block">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="kicker">Cẩm nang xe</p><h2>Xe bị … thì phải làm gì?</h2></div>
              <Link className="link-more" href="/cam-nang/">Tất cả bài <Icon name="arrow" size={18} /></Link>
            </div>
            <div className="art-grid">
              {articles.map((a) => (
                <Link key={a.slug} className="art" href={`/cam-nang/${a.slug}/`}>
                  <span className="chip">{a.data.nhom}</span>
                  <h3>{a.data.title}</h3>
                  <p>{a.data.description}</p>
                  <span className="more">Đọc bài <Icon name="arrow" size={16} /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="final">
        <div className="wrap final-box">
          <div>
            <h2>Xe đang gặp sự cố?</h2>
            <p>Dừng xe ở nơi an toàn, bật đèn cảnh báo rồi gọi thợ. Tổng đài hỏi vị trí, tình trạng xe và báo giá trước khi thợ xuất phát.</p>
          </div>
          <div className="final-ctas">
            <CallButton className="btn btn-primary btn-lg" />
            <Link className="btn btn-outline-light btn-lg" href="/dat-lich/"><Icon name="calendar" size={20} />Đặt lịch</Link>
          </div>
        </div>
      </section>
    </>
  );
}
