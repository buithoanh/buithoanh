// Màn QtSoLieu (server component, không cần JS phía trình duyệt): đổi kỳ bằng link ?ky=, biểu đồ SVG tự vẽ.
import IconQt from "../IconQt";
import q from "../qt.module.css";
import s from "./SoLieu.module.css";

const KY = [["ngay", "Ngày"], ["tuan", "Tuần"], ["thang", "Tháng"]];
const so = (v) => Number(v || 0).toLocaleString("vi-VN");
const pt1 = (v) => `${Number(v || 0).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const gio = (iso) => new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
const MAU = Array.from({ length: 11 }, (_, i) => `var(--qt-bd-${i + 1})`);

function tenKy(ky, nhan) {
  if (!nhan) return "";
  if (ky === "thang") { const [m, y] = nhan.slice(1).split("/"); return `tháng ${m}/20${y}`; }
  return ky === "tuan" ? `tuần bắt đầu ${nhan}` : `ngày ${nhan}`;
}

/** Bước chia trục dọc "đẹp" để có tối đa 5 vạch. */
function trucDoc(max) {
  const buoc = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find((b) => (max * 1.12) / b <= 5) || 10000;
  const tran = Math.max(buoc, Math.ceil((max * 1.12) / buoc) * buoc);
  const vach = [];
  for (let v = 0; v <= tran; v += buoc) vach.push(v);
  return { tran, vach };
}

function SoSanh({ k, donViKy, laTyLe }) {
  if (!k) return null;
  const d = k.thayDoi || 0;
  if (Math.abs(d) < (laTyLe ? 0.05 : 0.5)) return <span className={s.ngang}>■ không đổi so với {donViKy} trước</span>;
  const len = d > 0;
  const chu = laTyLe ? `${len ? "+" : "−"}${Math.abs(d).toLocaleString("vi-VN", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} điểm` : `${len ? "+" : "−"}${Math.abs(d)}%`;
  return <span className={len ? s.tang : s.giam}>{len ? "▲" : "▼"} {chu} so với {donViKy} trước</span>;
}

function BieuDoCot({ nhan, nguon, mauCua, donVi }) {
  const W = 1000, H = 300, T = 18, L = 40, B = 26, R = 8;
  const n = nhan.length;
  const tong = nhan.map((_, i) => Object.values(nguon).reduce((a, arr) => a + (arr[i] || 0), 0));
  const { tran, vach } = trucDoc(Math.max(1, ...tong));
  const cao = H - T - B, o = (W - L - R) / n, rong = Math.min(48, o * 0.64);
  const y = (v) => T + cao - (v / tran) * cao;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`Số đơn theo nguồn khách, ${n} ${donVi} gần nhất. Bảng số liệu bên dưới.`}>
      {vach.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={s.luoi} />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" className={s.chuTruc}>{so(v)}</text>
        </g>
      ))}
      {nhan.map((nh, i) => {
        let tich = 0;
        const x = L + i * o + (o - rong) / 2;
        return (
          <g key={nh}>
            {Object.entries(nguon).map(([kenh, arr]) => {
              const v = arr[i] || 0;
              if (!v) return null;
              const y0 = y(tich + v), h = y(tich) - y(tich + v);
              tich += v;
              return <rect key={kenh} x={x} y={y0} width={rong} height={Math.max(h, 0.5)} style={{ fill: mauCua(kenh) }}><title>{`${nh} · ${kenh}: ${v} đơn`}</title></rect>;
            })}
            {tong[i] ? <text x={x + rong / 2} y={y(tong[i]) - 5} textAnchor="middle" className={s.chuTong}>{so(tong[i])}</text> : null}
            <text x={L + i * o + o / 2} y={H - 8} textAnchor="middle" className={s.chuTruc}>{nh}</text>
          </g>
        );
      })}
      <line x1={L} x2={W - R} y1={T + cao} y2={T + cao} className={s.day} />
    </svg>
  );
}

function BieuDoDuong({ nhan, tyLe, mucTieu }) {
  const W = 520, H = 220, T = 16, L = 40, B = 26, R = 46;
  const n = nhan.length;
  const max = Math.max(mucTieu * 1.5, ...tyLe, 1);
  const buoc = max > 20 ? 10 : max > 8 ? 4 : 2;
  const tran = Math.ceil(max / buoc) * buoc;
  const cao = H - T - B, o = n > 1 ? (W - L - R) / (n - 1) : 0;
  const x = (i) => L + i * o, y = (v) => T + cao - (v / tran) * cao;
  const vach = [];
  for (let v = 0; v <= tran; v += buoc) vach.push(v);
  const d = tyLe.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={`Tỷ lệ đặt lịch, gọi, nhắn Zalo trên lượt vào web, mục tiêu ${mucTieu}%. Kỳ gần nhất ${pt1(tyLe[n - 1])}.`}>
      {vach.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} className={s.luoi} />
          <text x={L - 6} y={y(v) + 4} textAnchor="end" className={s.chuTruc}>{v}%</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(mucTieu)} y2={y(mucTieu)} className={s.mucTieu} />
      <path d={d} className={s.duong} />
      {tyLe.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 5 : 3.5} className={s.cham}><title>{`${nhan[i]}: ${pt1(v)}`}</title></circle>)}
      <text x={x(n - 1) + 8} y={y(tyLe[n - 1]) + 4} className={s.chuTong}>{pt1(tyLe[n - 1])}</text>
      {nhan.map((nh, i) => <text key={nh} x={x(i)} y={H - 8} textAnchor="middle" className={s.chuTruc}>{nh}</text>)}
      <line x1={L} x2={W - R} y1={T + cao} y2={T + cao} className={s.day} />
    </svg>
  );
}

export default function SoLieu({ bc, ky }) {
  const L = bc.nhan.length - 1;
  const kyNay = tenKy(ky, bc.nhan[L]);
  const kyTruoc = tenKy(ky, bc.nhan[L - 1]);
  const kenh = Object.keys(bc.donTheoNguon);
  const mauCua = (k) => MAU[Math.max(0, kenh.indexOf(k)) % MAU.length];
  const tongNguon = kenh.reduce((a, k) => a + (bc.donTheoNguon[k][L] || 0), 0);
  const tongKy = bc.nhan.map((_, i) => kenh.reduce((a, k) => a + (bc.donTheoNguon[k][i] || 0), 0));
  const ds = bc.doiSoat;
  const tlTb = bc.kpi.luotVao.giaTri ? (bc.kpi.soDon.giaTri / bc.kpi.luotVao.giaTri) * 100 : 0;
  const maxVao = Math.max(1, ...bc.topTrang.map((t) => t.luotVao));
  const mt = bc.mucTieuTyLe;
  const tl = bc.kpi.tyLe.giaTri;
  const kpi = [
    ["Lượt vào web", so(bc.kpi.luotVao.giaTri), bc.kpi.luotVao],
    ["Số đơn", so(bc.kpi.soDon.giaTri), bc.kpi.soDon],
    ["Tỷ lệ đặt lịch", pt1(tl), bc.kpi.tyLe, true],
    ["Cuộc gọi từ web", so(bc.kpi.cuocGoi.giaTri), bc.kpi.cuocGoi],
    ["Lượt nhắn Zalo", so(bc.kpi.zalo.giaTri), bc.kpi.zalo],
  ];
  const tongNguonBang = bc.nguonKyNay.reduce((a, r) => ({ soDon: a.soDon + r.soDon, cuocGoi: a.cuocGoi + r.cuocGoi, zalo: a.zalo + r.zalo }), { soDon: 0, cuocGoi: 0, zalo: 0 });

  return (
    <>
      <div className={q.dauTrang}>
        <div>
          <h1>Số liệu website</h1>
          <p>Đang xem: <b className={s.dam}>{kyNay}</b>, so với {kyTruoc}.</p>
        </div>
        <div className={q.hangNut}>
          <nav aria-label="Xem theo" className={s.chonKy}>
            {KY.map(([k, nhan]) => (
              <a key={k} href={`/quan-tri/so-lieu/?ky=${k}`} aria-current={k === ky ? "page" : undefined}>{nhan}</a>
            ))}
          </nav>
          <a className={q.nut} href={`/api/su-kien/bao-cao?ky=${ky}&dinhDang=xlsx`} download><IconQt name="tai-ve" />Xuất Excel</a>
        </div>
      </div>

      {ds.khop === true ? (
        <div role="status" className={`${q.thongBao} ${q.tbOk}`}><IconQt name="dung" size={20} /><span>Số đơn khớp với phần mềm điều phối: {so(ds.web)} đơn {kyNay} · lệch 0 đơn</span></div>
      ) : ds.khop === false ? (
        <div role="status" className={`${q.thongBao} ${q.tbLoi}`}><IconQt name="canh-bao" size={20} /><span>Số đơn chưa khớp: web ghi {so(ds.web)} đơn, phần mềm điều phối ghi {so(ds.dieuPhoi)} đơn ({kyNay}). Lệch {so(Math.abs(ds.web - ds.dieuPhoi))} đơn, kiểm tra trong /admin.</span></div>
      ) : (
        <div role="status" className={`${q.thongBao} ${q.tbTin}`}><IconQt name="thong-tin" size={20} /><span>Chưa đối soát được với phần mềm điều phối (chưa kết nối). Web ghi nhận {so(ds.web)} đơn {kyNay}.</span></div>
      )}

      <div className={s.kpi}>
        {kpi.map(([nhan, giaTri, k, laTyLe]) => (
          <div key={nhan} className={`${s.oKpi} ${laTyLe ? s.oKpiNhan : ""}`}>
            <span className={s.nhanKpi}>{nhan}</span>
            <b>{giaTri}</b>
            <SoSanh k={k} donViKy={bc.donVi} laTyLe={laTyLe} />
            {laTyLe ? (
              <div className={s.mucTieuKpi}>
                <div className={s.thuoc} role="meter" aria-valuemin={0} aria-valuemax={mt * 1.5} aria-valuenow={tl} aria-label={`Tỷ lệ ${pt1(tl)}, mục tiêu ${mt}%`}>
                  <i className={tl >= mt ? s.dat : s.chuaDat} style={{ width: `${Math.min((tl / (mt * 1.5)) * 100, 100)}%` }} />
                  <span className={s.vach} style={{ left: `${(1 / 1.5) * 100}%` }} />
                </div>
                <span className={s.ghiChuKpi}>{tl >= mt ? `Đạt mục tiêu ≥ ${mt}% (vạch đen)` : `Chưa đạt mục tiêu ≥ ${mt}% (vạch đen)`}</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <section aria-labelledby="bd-nguon" className={`${q.the} ${s.khoi}`}>
        <div>
          <span className={s.truocTieuDe}>Số đơn theo nguồn khách, {bc.nhan.length} {bc.donVi} gần nhất</span>
          <h2 id="bd-nguon">{kenh.length ? `${kyNay[0].toUpperCase()}${kyNay.slice(1)}: ${so(tongNguon)} đơn từ ${kenh.filter((k) => bc.donTheoNguon[k][L]).length} nguồn` : "Chưa có đơn trong các kỳ này"}</h2>
        </div>
        <ul aria-label="Chú giải" className={s.chuGiai}>
          {kenh.map((k) => (
            <li key={k}>
              <span className={s.mau} style={{ background: mauCua(k) }} />
              <span>{k}</span>
              <b>{so(bc.donTheoNguon[k][L])}</b>
              <span className={s.nhat}>{tongNguon ? `${Math.round((bc.donTheoNguon[k][L] / tongNguon) * 100)}%` : ""}</span>
            </li>
          ))}
        </ul>
        <BieuDoCot nhan={bc.nhan} nguon={bc.donTheoNguon} mauCua={mauCua} donVi={bc.donVi} />
        <div className="sr-only"><table>
          <caption>Số đơn theo nguồn và {bc.donVi}</caption>
          <thead><tr><th scope="col">Kỳ</th>{kenh.map((k) => <th key={k} scope="col">{k}</th>)}<th scope="col">Tổng</th></tr></thead>
          <tbody>{bc.nhan.map((nh, i) => <tr key={nh}><th scope="row">{nh}</th>{kenh.map((k) => <td key={k}>{bc.donTheoNguon[k][i]}</td>)}<td>{tongKy[i]}</td></tr>)}</tbody>
        </table></div>
        <span className={q.phu}>Trục dọc: số đơn. Số trên mỗi cột là tổng đơn của {bc.donVi} đó. Nguồn lấy từ link, mã QR hoặc mã đối tác khách dùng khi gọi, nhắn Zalo hay gửi form.</span>
      </section>

      <div className={s.hai}>
        <section aria-labelledby="bd-tyle" className={`${q.the} ${s.khoi} ${s.cotTyLe}`}>
          <div>
            <span className={s.truocTieuDe}>Tỷ lệ người vào web rồi đặt lịch, gọi hoặc nhắn Zalo</span>
            <h2 id="bd-tyle">{tl >= mt ? `${pt1(tl)}, đạt mục tiêu ${mt}%` : `${pt1(tl)}, chưa đạt mục tiêu ${mt}%`}</h2>
          </div>
          <div className={s.chuGiaiDuong}>
            <span><span className={s.netLien} />Tỷ lệ thực tế</span>
            <span><span className={s.netDut} />Mục tiêu {mt}%</span>
          </div>
          <BieuDoDuong nhan={bc.nhan} tyLe={bc.tyLe} mucTieu={mt} />
          <div className="sr-only"><table>
            <caption>Tỷ lệ theo {bc.donVi}</caption>
            <tbody>{bc.nhan.map((nh, i) => <tr key={nh}><th scope="row">{nh}</th><td>{pt1(bc.tyLe[i])}</td></tr>)}</tbody>
          </table></div>
        </section>

        <section aria-labelledby="bd-hanh-dong" className={`${q.the} ${s.cotNguon}`}>
          <div className={s.dauBang}>
            <h2 id="bd-hanh-dong">Khách làm gì, đến từ đâu</h2>
            <p className={q.phu}>Mỗi lượt bấm gọi, bấm Zalo, gửi form đều lưu nguồn. {kyNay[0]?.toUpperCase()}{kyNay.slice(1)}.</p>
          </div>
          <div className={q.cuonNgang}>
            <table className={`${q.bang} ${s.bangNguon}`}>
              <thead>
                <tr><th scope="col">Nguồn</th><th scope="col" className={q.so}>Đơn</th><th scope="col" className={q.so}>Bấm gọi</th><th scope="col" className={q.so}>Nhắn Zalo</th><th scope="col" className={q.so}>Tỷ trọng đơn</th></tr>
              </thead>
              <tbody>
                {bc.nguonKyNay.map((r) => (
                  <tr key={r.kenh}>
                    <td><span className={s.tenNguon}><span className={s.mau} style={{ background: mauCua(r.kenh) }} />{r.kenh}</span></td>
                    <td className={`${q.so} ${s.dam}`}>{so(r.soDon)}</td>
                    <td className={q.so}>{so(r.cuocGoi)}</td>
                    <td className={q.so}>{so(r.zalo)}</td>
                    <td className={q.so}>{pt1(r.tyTrong)}</td>
                  </tr>
                ))}
                {!bc.nguonKyNay.length ? <tr><td colSpan={5}><p className={q.rong}>Chưa có đơn trong kỳ này.</p></td></tr> : null}
                <tr className={s.dongTong}>
                  <td>Tổng</td>
                  <td className={q.so}>{so(tongNguonBang.soDon)}</td>
                  <td className={q.so}>{so(tongNguonBang.cuocGoi)}</td>
                  <td className={q.so}>{so(tongNguonBang.zalo)}</td>
                  <td className={q.so}>{tongNguonBang.soDon ? "100%" : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className={s.hai}>
        <section aria-labelledby="bd-top" className={`${q.the} ${s.cotTop}`}>
          <div className={s.dauBang}>
            <h2 id="bd-top">Top trang: trang nào mang về đơn</h2>
            <p className={q.phu}>10 trang nhiều lượt vào nhất, {kyNay}. Tỷ lệ = đơn / lượt vào trang. Xanh: cao hơn trung bình toàn web ({pt1(tlTb)}), cam: thấp hơn.</p>
          </div>
          <div className={q.cuonNgang}>
            <table className={`${q.bang} ${s.bangTop}`}>
              <thead><tr><th scope="col">Trang</th><th scope="col" className={q.so}>Lượt vào</th><th scope="col" className={q.so}>Đơn</th><th scope="col" className={q.so}>Tỷ lệ</th></tr></thead>
              <tbody>
                {bc.topTrang.map((t) => (
                  <tr key={t.duongDan}>
                    <td><a href={t.duongDan} target="_blank" rel="noopener" className={s.duongDan}>{t.duongDan}</a></td>
                    <td>
                      <div className={s.oVao}>
                        <div className={s.thanh}><i style={{ width: `${(t.luotVao / maxVao) * 100}%` }} /></div>
                        <span>{so(t.luotVao)}</span>
                      </div>
                    </td>
                    <td className={`${q.so} ${s.dam}`}>{so(t.soDon)}</td>
                    <td className={q.so}><span className={`${q.nhanTT} ${t.tyLe >= tlTb ? q.ttXanh : q.ttCam}`}>{pt1(t.tyLe)}</span></td>
                  </tr>
                ))}
                {!bc.topTrang.length ? <tr><td colSpan={4}><p className={q.rong}>Chưa có lượt vào trong kỳ này.</p></td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="bd-don-moi" className={`${q.the} ${s.cotDon}`}>
          <div className={s.dauBang}>
            <h2 id="bd-don-moi">Đơn mới nhất kèm nguồn</h2>
            <p className={q.phu}>Mã đối tác khách dùng được lưu luôn vào đơn.</p>
          </div>
          <ul className={s.donMoi}>
            {bc.donMoiNhat.map((d) => (
              <li key={d.ma}>
                <span className={s.mau} style={{ background: mauCua(d.kenh) }} />
                <div>
                  <span className={s.dongDon}><b>{d.ma}</b><span>{gio(d.luc)}</span></span>
                  <span>{d.kenh} · {d.hanhDong}</span>
                  {d.chiTiet ? <span className={q.phu}>{d.chiTiet}</span> : null}
                </div>
              </li>
            ))}
            {!bc.donMoiNhat.length ? <li><span className={q.phu}>Chưa có đơn.</span></li> : null}
          </ul>
          <a href="/admin/collections/don-hang" className={s.xemTatCa}>Xem tất cả đơn →</a>
        </section>
      </div>
    </>
  );
}
