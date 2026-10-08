(function () {
  "use strict";
  const D = JSON.parse(document.getElementById("data").textContent);
  const S = D.site;
  const view = document.getElementById("view");
  const nav = document.getElementById("nav");

  // ---------- tiện ích ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFC").trim();
  const slugify = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
  const thisMonth = () => today().slice(0, 7);
  const fmtDate = (d) => (d ? d.split("-").reverse().join("/") : "");
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const SECTION = { "dich-vu": "Dịch vụ", "cam-nang": "Cẩm nang" };
  const TITLE_MAX = 60;
  const DESC_MAX = 155;

  const fails = (p, level) => p.checks.filter((c) => !c.ok && (!level || c.level === level));
  const statusTag = (p) => {
    const e = fails(p, "error").length;
    const w = fails(p, "warn").length;
    if (e) return `<span class="tag err">✕ ${e} lỗi</span>`;
    if (w) return `<span class="tag warn">! ${w} cảnh báo</span>`;
    return `<span class="tag ok">✓ Đạt</span>`;
  };
  const score = (p) => pct(p.checks.filter((c) => c.ok).length, p.checks.length);
  const renderedTitle = (t) => `${t} | ${S.name}`;
  const editUrl = (p) => `${S.gh}/edit/${S.branch}/${p.file}`;
  const liveUrl = (p) => `${S.url}${p.path}`;
  const pageByPath = (path) => D.pages.find((p) => p.path === path);
  const linkTo = (path) => {
    const p = pageByPath(path);
    return p ? `<a href="#trang/${p.section}/${p.slug}">${esc(p.ten || p.title)}</a>` : esc(path);
  };
  const services = D.pages.filter((p) => p.section === "dich-vu");
  const nhomOf = (p) => (p.section === "cam-nang" ? [p.nhom] : D.plan.nhomTuKhoa.filter((g) => g.dichVu === p.slug).map((g) => g.nhom));
  const tuLieuFor = (nhoms) => D.tuLieu.filter((t) => t.chuDe.some((c) => nhoms.map(norm).includes(norm(c))));

  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), 1800);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); } catch {
      const a = document.createElement("textarea");
      a.value = text; document.body.appendChild(a); a.select(); document.execCommand("copy"); a.remove();
    }
    toast("Đã chép");
  }
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-copy]");
    if (b) { ev.preventDefault(); copy(b.dataset.copy); }
  });

  const serp = (title, desc, url) => {
    const t = renderedTitle(title);
    const shownT = t.length > TITLE_MAX ? t.slice(0, TITLE_MAX - 1).trimEnd() + "…" : t;
    const shownD = desc.length > DESC_MAX ? desc.slice(0, DESC_MAX - 1).trimEnd() + "…" : desc;
    const u = url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("/");
    return `<div class="serp" aria-label="Xem trước kết quả Google">
      <div class="site"><div class="fav">VC</div><div><b>${esc(S.name)}</b><span>${esc(u[0])}${u.length > 1 ? " › " + esc(u.slice(1).join(" › ")) : ""}</span></div></div>
      <div class="gt">${esc(shownT)}</div>
      <div class="gd">${esc(shownD) || "<i>Chưa có mô tả</i>"}</div>
    </div>`;
  };
  const counters = (title, desc) => {
    const t = renderedTitle(title).length;
    return `<div class="counter ${title.length < 25 || title.length > 70 ? "bad" : ""}">Tiêu đề: ${title.length} ký tự (cần 25–70) · hiển thị kèm tên thương hiệu ${t} ký tự${t > TITLE_MAX ? ", Google sẽ cắt bớt" : ""}</div>
      <div class="counter ${desc.length < 100 || desc.length > 170 ? "bad" : ""}">Mô tả: ${desc.length} ký tự (cần 100–170)${desc.length > DESC_MAX ? ", Google có thể cắt bớt" : ""}</div>`;
  };

  // ---------- điều hướng ----------
  const ROUTES = [
    ["tong-quan", "Tổng quan", () => ""],
    ["trang", "Trang & bài", () => D.pages.length],
    ["tu-khoa", "Từ khoá", () => `${coverage().pct}%`],
    ["lich", "Lịch đăng", () => ""],
    ["tu-lieu", "Tư liệu transcript", () => D.tuLieu.length],
    ["viet-bai", "Viết bài mới", () => ""],
    ["huong-dan", "Hướng dẫn", () => ""],
  ];
  function renderNav(cur) {
    nav.innerHTML = ROUTES.map(([id, label, pill]) => {
      const p = pill();
      return `<a href="#${id}" ${cur === id ? 'aria-current="page"' : ""}><span>${label}</span>${p !== "" ? `<span class="pill">${p}</span>` : ""}</a>`;
    }).join("");
  }
  function route() {
    const raw = decodeURIComponent(location.hash.slice(1)) || "tong-quan";
    const [pathPart, query = ""] = raw.split("?");
    const parts = pathPart.split("/");
    const q = Object.fromEntries(new URLSearchParams(query));
    const id = parts[0];
    renderNav(id);
    if (id === "trang" && parts[2]) view.innerHTML = pageDetail(parts[1], parts[2]);
    else view.innerHTML = ({ "tong-quan": overview, trang: pageList, "tu-khoa": keywords, lich: calendar, "tu-lieu": tuLieuView, "viet-bai": () => writer(q), "huong-dan": guide }[id] || overview)();
    bind(id, parts);
    view.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  const top = (title, sub, actions = "", crumb = "") =>
    `<div class="top"><div>${crumb ? `<div class="crumb">${crumb}</div>` : ""}<h1>${title}</h1>${sub ? `<p>${sub}</p>` : ""}</div>${actions ? `<div class="actions">${actions}</div>` : ""}</div>`;

  // ---------- số liệu chung ----------
  function coverage() {
    const all = D.plan.nhomTuKhoa.filter((g) => !g.tuKhoa.some((k) => k.includes("["))).flatMap((g) => g.tuKhoa);
    const done = all.filter((k) => D.kwIndex[k] && D.kwIndex[k].chinh.length);
    return { all, done, pct: pct(done.length, all.length) };
  }
  const articlesInMonth = (m) => D.pages.filter((p) => p.section === "cam-nang" && p.ngay.startsWith(m));

  // ---------- Tổng quan ----------
  function overview() {
    const cv = coverage();
    const errPages = D.pages.filter((p) => fails(p, "error").length);
    const warnPages = D.pages.filter((p) => !fails(p, "error").length && fails(p, "warn").length);
    const m = thisMonth();
    const plan = D.plan.lichDang.find((x) => x.thang === m) || D.plan.lichDang.find((x) => x.thang > m);
    const planDone = plan ? articlesInMonth(plan.thang).length : 0;
    const unusedTL = D.tuLieu.filter((t) => !t.dungBoi.length);
    const todo = D.pages.flatMap((p) => fails(p).map((c) => ({ p, c }))).sort((a, b) => (a.c.level === "error" ? -1 : 1) - (b.c.level === "error" ? -1 : 1));
    const nextKw = cv.all.filter((k) => !cv.done.includes(k)).slice(0, 6);
    const groupOf = (k) => D.plan.nhomTuKhoa.find((g) => g.tuKhoa.includes(k));

    return top("Tổng quan nội dung", `Dữ liệu lúc build ${new Date(D.builtAt).toLocaleString("vi-VN")}. Chỉ đọc, sửa bài qua GitHub để có người duyệt.`,
      `<a class="btn primary" href="#viet-bai">＋ Viết bài mới</a><a class="btn" href="${esc(S.url)}/" target="_blank" rel="noopener">Mở website ↗</a>`) +
      (!S.allowIndex ? `<div class="callout"><b>Đang chạy thử:</b> Google bị chặn lập chỉ mục cho tới khi gắn tên miền thật và bật <code>ALLOW_INDEX=1</code>. Thứ hạng chưa được tính.</div>` : "") +
      `<div class="grid g4" style="margin-bottom:14px">
        <div class="card kpi"><div class="n">${services.length}</div><div class="l">Trang dịch vụ</div></div>
        <div class="card kpi"><div class="n">${D.pages.length - services.length}</div><div class="l">Bài cẩm nang</div></div>
        <div class="card kpi"><div class="n" style="color:${errPages.length ? "var(--err)" : "var(--ok)"}">${errPages.length}</div><div class="l">Trang có lỗi</div><div class="s">${warnPages.length} trang có cảnh báo</div></div>
        <div class="card kpi"><div class="n">${cv.pct}%</div><div class="l">Từ khoá đã có trang</div><div class="bar" style="margin-top:8px"><i style="width:${cv.pct}%"></i></div><div class="s">${cv.done.length}/${cv.all.length} từ khoá trong kế hoạch</div></div>
        <div class="card kpi"><div class="n">${plan ? `${planDone}/${plan.baiCamNang}` : "–"}</div><div class="l">Bài cẩm nang tháng ${plan ? plan.thang.split("-").reverse().join("/") : ""}</div>${plan ? `<div class="bar ${planDone >= plan.baiCamNang ? "ok" : ""}" style="margin-top:8px"><i style="width:${Math.min(100, pct(planDone, plan.baiCamNang))}%"></i></div>` : ""}</div>
        <div class="card kpi"><div class="n">${D.tuLieu.length}</div><div class="l">Tư liệu transcript</div><div class="s">${unusedTL.length} chưa dùng</div></div>
      </div>
      <div class="grid g2">
        <div class="card"><h2>Cần xử lý <small>${todo.length} mục</small></h2>
          ${todo.length ? `<ul class="plain">${todo.slice(0, 10).map(({ p, c }) => `<li><span class="tag ${c.level === "error" ? "err" : "warn"}">${c.level === "error" ? "Lỗi" : "Cảnh báo"}</span> <a href="#trang/${p.section}/${p.slug}">${esc(p.ten || p.title)}</a><br><span class="note">${esc(c.detail)}</span></li>`).join("")}</ul>` : `<div class="empty">Mọi trang đều đạt kiểm tra. 🎉</div>`}
        </div>
        <div class="card"><h2>Từ khoá nên viết tiếp <small><a href="#tu-khoa">Xem tất cả</a></small></h2>
          ${nextKw.length ? `<ul class="plain">${nextKw.map((k) => { const g = groupOf(k); return `<li class="kw-row" style="border:0;padding:4px 0"><span><span class="k">${esc(k)}</span> <span class="tag muted">${esc(g.nhom)}</span> <span class="note">${esc(g.luotTimThang)} lượt/tháng</span></span><a class="btn sm" href="#viet-bai?kw=${encodeURIComponent(k)}&nhom=${encodeURIComponent(g.nhom)}">Viết bài</a></li>`; }).join("")}</ul>` : `<div class="empty">Mọi từ khoá đã có trang.</div>`}
        </div>
        <div class="card"><h2>Tư liệu transcript chưa dùng <small><a href="#tu-lieu">Xem tất cả</a></small></h2>
          ${unusedTL.length ? `<ul class="plain">${unusedTL.slice(0, 6).map((t) => `<li><b>${esc(t.tieuDe)}</b><br><span class="note">${esc(t.kenh)} · ${t.chuDe.map(esc).join(", ")}</span></li>`).join("")}</ul>`
            : `<div class="empty">${D.tuLieu.length ? "Mọi tư liệu đã được dùng." : "Chưa có tư liệu. Xuất transcript từ TIKTIKTOTEXT vào <code>tu-lieu/transcript/</code> (xem mục Hướng dẫn)."}</div>`}
        </div>
        <div class="card"><h2>Trang dịch vụ</h2>
          <ul class="plain">${services.map((p) => `<li class="kw-row" style="border:0;padding:4px 0"><a href="#trang/${p.section}/${p.slug}">${esc(p.ten)}</a><span>${statusTag(p)} <span class="note">${score(p)}%</span></span></li>`).join("")}</ul>
        </div>
      </div>`;
  }

  // ---------- Danh sách trang ----------
  function pageList() {
    return top("Trang & bài", "Bấm vào tên để xem chi tiết SEO của từng trang.", `<a class="btn primary" href="#viet-bai">＋ Viết bài mới</a>`) +
      `<div class="card">
        <div class="toolbar">
          <input id="f-q" type="search" placeholder="Tìm theo tiêu đề, từ khoá…" aria-label="Tìm">
          <select id="f-s" aria-label="Loại trang"><option value="">Mọi loại</option><option value="dich-vu">Dịch vụ</option><option value="cam-nang">Cẩm nang</option></select>
          <select id="f-st" aria-label="Trạng thái"><option value="">Mọi trạng thái</option><option value="err">Có lỗi</option><option value="warn">Có cảnh báo</option><option value="ok">Đạt</option></select>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Trang</th><th>Từ khoá chính</th><th class="num">Chữ</th><th class="num">Tiêu đề</th><th class="num">Mô tả</th><th>Tư liệu</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody id="rows"></tbody>
        </table></div>
      </div>`;
  }
  function rows() {
    const q = norm(document.getElementById("f-q").value);
    const s = document.getElementById("f-s").value;
    const st = document.getElementById("f-st").value;
    const list = D.pages.filter((p) => {
      if (s && p.section !== s) return false;
      if (q && !norm(p.title + " " + p.keyword + " " + p.slug).includes(q)) return false;
      const e = fails(p, "error").length, w = fails(p, "warn").length;
      if (st === "err" && !e) return false;
      if (st === "warn" && (e || !w)) return false;
      if (st === "ok" && (e || w)) return false;
      return true;
    });
    document.getElementById("rows").innerHTML = list.map((p) => `<tr>
      <td><div class="t"><a href="#trang/${p.section}/${p.slug}">${esc(p.title)}</a></div><div class="u"><span class="tag type">${SECTION[p.section]}</span> ${esc(p.path)}${p.ngay ? " · " + fmtDate(p.ngay) : ""}</div></td>
      <td>${esc(p.keyword)}</td>
      <td class="num">${p.words.toLocaleString("vi-VN")}</td>
      <td class="num ${p.title.length < 25 || p.title.length > 70 ? "len-bad" : ""}">${p.title.length}</td>
      <td class="num ${p.description.length < 100 || p.description.length > 170 ? "len-bad" : ""}">${p.description.length}</td>
      <td>${p.tuLieu.length ? `<span class="tag ok">${p.tuLieu.length}</span>` : `<span class="tag muted">0</span>`}</td>
      <td>${statusTag(p)}</td>
      <td><div class="actions"><a class="btn sm" href="${esc(liveUrl(p))}" target="_blank" rel="noopener">Xem</a><a class="btn sm" href="${esc(editUrl(p))}" target="_blank" rel="noopener">Sửa</a></div></td>
    </tr>`).join("") || `<tr><td colspan="8"><div class="empty">Không có trang nào khớp.</div></td></tr>`;
  }

  // ---------- Chi tiết một trang ----------
  function pageDetail(section, slug) {
    const p = D.pages.find((x) => x.section === section && x.slug === slug);
    if (!p) return top("Không tìm thấy trang", "", "", `<a href="#trang">Trang & bài</a>`);
    const sc = score(p);
    const errs = fails(p, "error").length;
    const nhoms = nhomOf(p).filter(Boolean);
    const used = D.tuLieu.filter((t) => p.tuLieu.includes(t.slug));
    const suggest = tuLieuFor(nhoms).filter((t) => !p.tuLieu.includes(t.slug));
    const faqN = p.faq.map(norm);
    const newQs = [...new Set(tuLieuFor(nhoms).flatMap((t) => t.cauHoiKhach))].filter((q) => !faqN.some((f) => f === norm(q) || f.includes(norm(q)) || norm(q).includes(f)));
    const related = p.section === "dich-vu" ? D.pages.filter((o) => o.dichVuLienQuan.includes(p.slug)) : p.dichVuLienQuan.map((s) => pageByPath(`/dich-vu/${s}/`)).filter(Boolean);
    const density = p.words ? ((p.kwCount * p.keyword.split(/\s+/).length) / p.words * 100).toFixed(1) : 0;
    const prompt = `Dùng SEO Editor cải thiện trang ${p.path} (file ${p.file}). ` +
      (errs || fails(p, "warn").length ? `Sửa các mục chưa đạt: ${fails(p).map((c) => c.detail).join("; ")}. ` : "") +
      (newQs.length ? `Cân nhắc thêm vào FAQ các câu khách hỏi trong tư liệu: ${newQs.slice(0, 5).map((q) => `"${q}"`).join(", ")}. ` : "") +
      `Mở pull request để duyệt, không tự merge.`;

    return top(esc(p.ten || p.title), `<span class="tag type">${SECTION[p.section]}</span> <a href="${esc(liveUrl(p))}" target="_blank" rel="noopener">${esc(p.path)} ↗</a>`,
      `<a class="btn" href="${esc(liveUrl(p))}" target="_blank" rel="noopener">Xem trang</a>
       <a class="btn" href="${esc(editUrl(p))}" target="_blank" rel="noopener">Sửa trên GitHub</a>
       <button class="btn primary" data-copy="${esc(prompt)}">Chép lệnh cho SEO Editor</button>`,
      `<a href="#trang">Trang & bài</a> › ${SECTION[p.section]}`) +
      `<div class="grid g2">
        <div class="grid">
          <div class="card"><h2>Kết quả trên Google <small>xem trước</small></h2>
            <div id="serp">${serp(p.title, p.description, liveUrl(p))}</div>
            <div id="cnt" style="margin-top:10px">${counters(p.title, p.description)}</div>
            <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:600;font-size:14px">Thử tiêu đề, mô tả khác</summary>
              <div class="form" style="margin-top:10px">
                <div class="field"><label for="t-title">Tiêu đề</label><input id="t-title" value="${esc(p.title)}"></div>
                <div class="field"><label for="t-desc">Mô tả</label><textarea id="t-desc">${esc(p.description)}</textarea></div>
                <div class="actions"><button class="btn sm" id="t-copy">Chép 2 dòng phần đầu bài</button><a class="btn sm" href="${esc(editUrl(p))}" target="_blank" rel="noopener">Mở trình sửa GitHub</a></div>
              </div>
            </details>
          </div>
          <div class="card"><h2>Số liệu</h2>
            <dl class="stats">
              <div><dt>Số chữ</dt><dd>${p.words.toLocaleString("vi-VN")}</dd></div>
              <div><dt>Từ khoá xuất hiện</dt><dd>${p.kwCount} lần</dd></div>
              <div><dt>Mật độ từ khoá</dt><dd>${density}%</dd></div>
              <div><dt>Mục H2/H3</dt><dd>${p.headings.length}</dd></div>
              <div><dt>Câu hỏi FAQ</dt><dd>${p.faq.length}</dd></div>
              <div><dt>Liên kết ra / vào</dt><dd>${p.linksOut.length} / ${p.linksIn.length}</dd></div>
              <div><dt>Ảnh trong bài</dt><dd>${p.images}</dd></div>
              <div><dt>Tư liệu đã dùng</dt><dd>${p.tuLieu.length}</dd></div>
            </dl>
            <p class="note" style="margin-bottom:0">Từ khoá chính: <b>${esc(p.keyword)}</b>${nhoms.length ? ` · nhóm ${nhoms.map(esc).join(", ")}` : ""}${p.ngay ? ` · đăng ${fmtDate(p.ngay)}` : ""}</p>
          </div>
          <div class="card"><h2>Dàn ý bài</h2>
            ${p.headings.length ? `<ul class="outline">${p.headings.map((h) => `<li class="h${h.level}">${esc(h.text)}</li>`).join("")}</ul>` : `<div class="empty">Bài chưa có mục H2/H3.</div>`}
          </div>
        </div>
        <div class="grid">
          <div class="card"><h2>Điểm kiểm tra</h2>
            <div class="score" style="margin-bottom:10px"><div class="ring" style="--p:${sc};--c:${errs ? "var(--err)" : sc < 100 ? "var(--warn)" : "var(--ok)"}">${sc}</div>
              <div>${statusTag(p)}<div class="note" style="margin-top:4px">${errs ? "Bài có lỗi sẽ chặn build, chưa lên web được." : "Cùng bộ quy tắc với lệnh <code>npm run kiem-tra</code>."}</div></div></div>
            <ul class="checks">${[...p.checks].sort((a, b) => a.ok - b.ok).map((c) => `<li class="${c.ok ? "ok" : c.level}"><span class="ic">${c.ok ? "✓" : c.level === "error" ? "✕" : "!"}</span><span>${esc(c.label)}${c.detail ? `<small>${esc(c.detail)}</small>` : ""}</span></li>`).join("")}</ul>
          </div>
          <div class="card"><h2>Tư liệu transcript <small>${used.length} đã dùng</small></h2>
            ${used.length ? `<ul class="plain">${used.map((t) => `<li><span class="tag ok">Đã dùng</span> <b>${esc(t.tieuDe)}</b> <span class="note">${esc(t.kenh)}</span></li>`).join("")}</ul>` : ""}
            ${suggest.length ? `<p class="note">Cùng chủ đề, chưa dùng:</p><ul class="plain">${suggest.slice(0, 5).map((t) => `<li><b>${esc(t.tieuDe)}</b> <span class="note">${esc(t.kenh)}${t.luotXem ? " · " + Number(t.luotXem).toLocaleString("vi-VN") + " lượt xem" : ""}</span> <button class="btn sm" data-copy="${esc(`tuLieu: [${[...p.tuLieu, t.slug].join(", ")}]`)}">Chép dòng tuLieu</button></li>`).join("")}</ul>` : ""}
            ${!used.length && !suggest.length ? `<div class="empty">Chưa có tư liệu cho chủ đề ${nhoms.map(esc).join(", ") || "này"}.</div>` : ""}
          </div>
          <div class="card"><h2>Câu khách hỏi chưa có trong FAQ <small>từ tư liệu</small></h2>
            ${newQs.length ? `<ul class="plain">${newQs.slice(0, 8).map((q) => `<li>${esc(q)}</li>`).join("")}</ul><p class="note" style="margin-bottom:0">Thêm câu trả lời vào trường <code>faq</code> giúp trang hiện thêm trên Google (dữ liệu FAQPage).</p>` : `<div class="empty">Không có câu hỏi mới từ tư liệu.</div>`}
          </div>
          <div class="card"><h2>Liên kết nội bộ</h2>
            <p class="note" style="margin:0 0 4px">Trang khác dẫn tới đây (${p.linksIn.length}):</p>
            ${p.linksIn.length ? `<ul class="plain">${p.linksIn.map((x) => `<li>${linkTo(x)}</li>`).join("")}</ul>` : `<div class="empty">Chưa có trang nào dẫn tới. Viết bài cẩm nang liên quan và thêm liên kết <code>${esc(p.path)}</code>.</div>`}
            <p class="note" style="margin:12px 0 4px">Trang này dẫn ra (${p.linksOut.length}):</p>
            ${p.linksOut.length ? `<ul class="plain">${p.linksOut.map((x) => `<li>${linkTo(x)}</li>`).join("")}</ul>` : `<div class="empty">Chưa có liên kết ra trang khác.</div>`}
            ${related.length ? `<p class="note" style="margin:12px 0 4px">${p.section === "dich-vu" ? "Bài cẩm nang gắn với dịch vụ này" : "Dịch vụ liên quan"}:</p><ul class="plain">${related.map((o) => `<li>${linkTo(o.path)}</li>`).join("")}</ul>` : ""}
          </div>
        </div>
      </div>`;
  }

  // ---------- Từ khoá ----------
  function keywords() {
    const cv = coverage();
    return top("Từ khoá theo kế hoạch", `${cv.done.length}/${cv.all.length} từ khoá đã có trang nhắm làm từ khoá chính. Nguồn: <code>content/ke-hoach-seo.json</code>.`) +
      `<div class="callout">${esc(D.plan.nguon || "")}</div>
      <div class="grid g2">${D.plan.nhomTuKhoa.map((g) => `<div class="card kw-group">
        <h2>${esc(g.nhom)} <small>${esc(g.yDinh)} · ${esc(g.luotTimThang)} lượt/tháng</small></h2>
        ${g.dichVu ? `<p class="note" style="margin-top:-6px">Trang dịch vụ: ${linkTo(`/dich-vu/${g.dichVu}/`)}</p>` : ""}
        ${g.tuKhoa.map((k) => {
          const ix = D.kwIndex[k] || { chinh: [], nhac: [] };
          const st = k.includes("[") ? `<span class="tag muted">Mẫu, làm theo quận</span>`
            : ix.chinh.length ? `<span class="tag ok">✓ ${ix.chinh.map(linkTo).join(", ")}</span>`
            : ix.nhac.length ? `<span class="tag warn">Mới được nhắc trong ${ix.nhac.length} trang</span>`
            : `<span class="tag err">Chưa có</span>`;
          return `<div class="kw-row"><span class="k">${esc(k)}</span><span class="actions">${st}${!ix.chinh.length && !k.includes("[") ? `<a class="btn sm" href="#viet-bai?kw=${encodeURIComponent(k)}&nhom=${encodeURIComponent(g.nhom)}">Viết bài</a>` : ""}</span></div>`;
        }).join("")}
        ${g.ghiChu ? `<p class="note" style="margin-bottom:0">${esc(g.ghiChu)}</p>` : ""}
      </div>`).join("")}</div>
      <div class="card" style="margin-top:14px"><h2>Quy tắc</h2><ul>${D.plan.quyTac.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>`;
  }

  // ---------- Lịch đăng ----------
  function calendar() {
    const m = thisMonth();
    const early = D.pages.filter((p) => p.section === "cam-nang" && p.ngay && p.ngay.slice(0, 7) < D.plan.lichDang[0].thang);
    return top("Lịch đăng bài", "Số bài cẩm nang theo kế hoạch so với số bài đã có trên web, tính theo trường <code>ngay</code>.") +
      (early.length ? `<div class="callout">${early.length} bài đăng trước kỳ kế hoạch đầu tiên (${D.plan.lichDang[0].thang.split("-").reverse().join("/")}): ${early.map((p) => linkTo(p.path)).join(", ")}.</div>` : "") +
      `<div class="card">${D.plan.lichDang.map((x) => {
        const done = articlesInMonth(x.thang).length;
        return `<div class="month ${x.thang === m ? "now" : ""}">
          <div><div class="m">${x.thang.split("-").reverse().join("/")}</div>${x.thang === m ? `<div class="x">Tháng này</div>` : ""}</div>
          <div><div class="bar ${done >= x.baiCamNang ? "ok" : ""}"><i style="width:${Math.min(100, pct(done, x.baiCamNang))}%"></i></div>
            <div class="x">${[x.trangKhac, x.chuDe && "Chủ đề: " + x.chuDe].filter(Boolean).map(esc).join(" · ")}</div></div>
          <div class="num"><b>${done}</b>/${x.baiCamNang}</div>
        </div>`;
      }).join("")}</div>`;
  }

  // ---------- Tư liệu ----------
  function tuLieuView() {
    const topics = [...new Set(D.tuLieu.flatMap((t) => t.chuDe))];
    return top("Tư liệu transcript", "Chữ lấy từ video TikTok bằng TIKTIKTOTEXT. Dùng để học câu hỏi và cách nói của khách, <b>không chép nguyên văn</b>. Nội dung đầy đủ không hiển thị ở đây.") +
      (D.tuLieu.length ? `<div class="card">
        <div class="toolbar">
          <select id="tl-c" aria-label="Chủ đề"><option value="">Mọi chủ đề</option>${topics.map((c) => `<option>${esc(c)}</option>`).join("")}</select>
          <select id="tl-u" aria-label="Đã dùng"><option value="">Tất cả</option><option value="no">Chưa dùng</option><option value="yes">Đã dùng</option></select>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Video</th><th>Chủ đề</th><th class="num">Lượt xem</th><th>Câu khách hỏi</th><th>Dùng ở</th></tr></thead>
          <tbody id="tl-rows"></tbody>
        </table></div></div>`
        : `<div class="card"><div class="empty">
          <p style="margin-top:0"><b>Chưa có tư liệu nào.</b> Mỗi video là một file <code>tu-lieu/transcript/&lt;slug&gt;.md</code>, theo mẫu <code>tu-lieu/transcript/_mau.md</code>.</p>
          <p style="margin-bottom:0">Repo đang công khai: chỉ đưa transcript video của VCPV, hoặc bản tóm tắt ý của video người khác. Chi tiết ở <code>tu-lieu/README.md</code>.</p>
        </div></div>`);
  }
  function tlRows() {
    const c = document.getElementById("tl-c").value;
    const u = document.getElementById("tl-u").value;
    const list = D.tuLieu.filter((t) => (!c || t.chuDe.includes(c)) && (!u || (u === "yes") === t.dungBoi.length > 0));
    document.getElementById("tl-rows").innerHTML = list.map((t) => `<tr>
      <td><div class="t">${t.link ? `<a href="${esc(t.link)}" target="_blank" rel="noopener noreferrer">${esc(t.tieuDe)} ↗</a>` : esc(t.tieuDe)}</div>
        <div class="u">${esc(t.kenh)} · ${t.loai === "cua-minh" ? "Video VCPV" : "Tóm tắt ý"} · lấy ${fmtDate(t.ngayLay)} · ${t.words} chữ · <code>${esc(t.slug)}</code></div></td>
      <td>${t.chuDe.map((x) => `<span class="tag muted">${esc(x)}</span>`).join(" ")}</td>
      <td class="num">${t.luotXem != null ? Number(t.luotXem).toLocaleString("vi-VN") : "–"}</td>
      <td>${t.cauHoiKhach.length ? `<ul style="margin:0;padding-left:18px">${t.cauHoiKhach.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : `<span class="note">–</span>`}</td>
      <td>${t.dungBoi.length ? t.dungBoi.map(linkTo).join("<br>") : `<a class="btn sm" href="#viet-bai?nhom=${encodeURIComponent(t.chuDe[0] || "")}&tl=${encodeURIComponent(t.slug)}">Viết bài từ tư liệu</a>`}</td>
    </tr>`).join("") || `<tr><td colspan="5"><div class="empty">Không có tư liệu khớp.</div></td></tr>`;
  }

  // ---------- Viết bài mới ----------
  function writer(q) {
    const cv = coverage();
    const free = cv.all.filter((k) => !cv.done.includes(k));
    const groups = D.plan.nhomTuKhoa.map((g) => g.nhom);
    const nhom = q.nhom || (q.kw && (D.plan.nhomTuKhoa.find((g) => g.tuKhoa.includes(q.kw)) || {}).nhom) || "";
    return top("Viết bài cẩm nang mới", "Cách nên dùng: chép lệnh cho agent SEO Editor. Agent viết, tự kiểm tra rồi mở pull request để duyệt.", "", `<a href="#tu-khoa">Từ khoá</a> › Viết bài`) +
      `<div class="grid g2">
        <div class="card"><div class="form">
          <div class="field"><label for="w-kw">Từ khoá chính</label><input id="w-kw" list="w-kws" value="${esc(q.kw || "")}" placeholder="ví dụ: thay dầu ô tô tại nhà"><datalist id="w-kws">${free.map((k) => `<option value="${esc(k)}">`).join("")}</datalist></div>
          <div class="field"><label for="w-nhom">Nhóm</label><select id="w-nhom">${groups.map((g) => `<option ${g === nhom ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></div>
          <div class="field"><label for="w-title">Tiêu đề <span class="counter" id="w-tc"></span></label><input id="w-title" placeholder="25–70 ký tự, có từ khoá chính"></div>
          <div class="field"><label for="w-slug">Tên file</label><input id="w-slug" placeholder="tu-dong-theo-tieu-de"></div>
          <div class="field"><label for="w-desc">Mô tả <span class="counter" id="w-dc"></span></label><textarea id="w-desc" placeholder="100–170 ký tự, trả lời ngay điều người tìm cần"></textarea></div>
          <div class="field"><label>Dịch vụ liên quan</label><div class="checklist">${services.map((s) => `<label><input type="checkbox" name="w-dv" value="${esc(s.slug)}"> ${esc(s.ten)}</label>`).join("")}</div></div>
          <div class="field"><label>Tư liệu transcript</label>${D.tuLieu.length ? `<div class="checklist" id="w-tl">${D.tuLieu.map((t) => `<label><input type="checkbox" name="w-tl" value="${esc(t.slug)}" ${q.tl === t.slug ? "checked" : ""}> ${esc(t.tieuDe)} <span class="note">(${t.chuDe.map(esc).join(", ")})</span></label>`).join("")}</div>` : `<div class="empty">Chưa có tư liệu trong <code>tu-lieu/transcript/</code>.</div>`}</div>
        </div></div>
        <div class="grid">
          <div class="card"><h2>Xem trước trên Google</h2><div id="w-serp"></div></div>
          <div class="card"><h2>1. Giao cho SEO Editor <small>khuyên dùng</small></h2>
            <pre class="code" id="w-prompt"></pre>
            <div class="actions" style="margin-top:10px"><button class="btn primary" id="w-copy-prompt">Chép lệnh</button></div>
            <p class="note" style="margin-bottom:0">Dán vào Claude Code, mở tại thư mục repo.</p>
          </div>
          <div class="card"><h2>2. Hoặc tự viết trên GitHub</h2>
            <pre class="code" id="w-fm"></pre>
            <div class="actions" style="margin-top:10px"><a class="btn" id="w-gh" target="_blank" rel="noopener">Tạo bản nháp trên GitHub ↗</a><button class="btn" id="w-copy-fm">Chép phần đầu bài</button></div>
            <p class="note" style="margin-bottom:0">Trên GitHub chọn <b>"Create a new branch and start a pull request"</b>, không commit thẳng vào ${esc(S.branch)}. Bản nháp còn chữ TODO nên chưa build được cho tới khi viết xong.</p>
          </div>
        </div>
      </div>`;
  }
  function writerUpdate() {
    const $ = (id) => document.getElementById(id);
    const kw = $("w-kw").value.trim();
    const title = $("w-title").value.trim();
    const desc = $("w-desc").value.trim();
    if (!$("w-slug").dataset.touched) $("w-slug").value = slugify(title || kw);
    const slug = $("w-slug").value.trim() || "bai-moi";
    const nhom = $("w-nhom").value;
    const dv = [...document.querySelectorAll('input[name="w-dv"]:checked')].map((x) => x.value);
    const tl = [...document.querySelectorAll('input[name="w-tl"]:checked')].map((x) => x.value);
    const qs = [...new Set(D.tuLieu.filter((t) => tl.includes(t.slug)).flatMap((t) => t.cauHoiKhach))];
    $("w-tc").textContent = `${title.length} ký tự`;
    $("w-tc").className = "counter" + (title && (title.length < 25 || title.length > 70) ? " bad" : "");
    $("w-dc").textContent = `${desc.length} ký tự`;
    $("w-dc").className = "counter" + (desc && (desc.length < 100 || desc.length > 170) ? " bad" : "");
    $("w-serp").innerHTML = serp(title || "Tiêu đề bài viết", desc, `${S.url}/cam-nang/${slug}/`) + `<div style="margin-top:8px">${counters(title, desc)}</div>`;
    const yq = (s) => JSON.stringify(s);
    const fm = `---\ntitle: ${yq(title)}\ndescription: ${yq(desc)}\nkeyword: ${yq(kw)}\nnhom: ${yq(nhom)}\nngay: ${today()}\n` +
      (dv.length ? `dichVuLienQuan: [${dv.join(", ")}]\n` : "") + (tl.length ? `tuLieu: [${tl.join(", ")}]\n` : "") +
      `faq:\n${(qs.length ? qs.slice(0, 3) : ["Câu hỏi khách hay hỏi?"]).map((q) => `  - q: ${yq(q)}\n    a: "TODO: trả lời ngắn gọn"`).join("\n")}\n---\n`;
    const body = `\nTODO: mở bài trả lời ngay câu hỏi "${kw}" trong 2–3 câu.\n\n## TODO: mục chính 1\n\n## TODO: mục chính 2\n\n## Khi nào nên gọi thợ\n\nTODO: liên kết tới ${dv.length ? `[trang dịch vụ](/dich-vu/${dv[0]}/)` : "/dich-vu/<slug>/"}.\n`;
    $("w-fm").textContent = fm;
    $("w-gh").href = `${S.gh}/new/${S.branch}/website/content/cam-nang?filename=${encodeURIComponent(slug + ".md")}&value=${encodeURIComponent(fm + body)}`;
    const prompt = `Dùng SEO Editor viết bài cẩm nang cho từ khoá "${kw || "<từ khoá>"}" (nhóm ${nhom})` +
      (title ? `, tiêu đề gợi ý "${title}"` : "") + (slug !== "bai-moi" ? `, tên file ${slug}.md` : "") +
      (dv.length ? `, liên kết tới dịch vụ ${dv.map((s) => `/dich-vu/${s}/`).join(", ")}` : "") +
      (tl.length ? `. Dùng tư liệu transcript ${tl.join(", ")} trong tu-lieu/transcript làm tư liệu (không chép nguyên văn, thêm tuLieu vào phần đầu bài)` : "") +
      (qs.length ? `. Câu khách hỏi nên trả lời trong FAQ: ${qs.slice(0, 5).map((x) => `"${x}"`).join(", ")}` : "") +
      `. Mở pull request để duyệt, không tự merge.`;
    $("w-prompt").textContent = prompt;
    $("w-copy-prompt").onclick = () => copy(prompt);
    $("w-copy-fm").onclick = () => copy(fm);
  }

  // ---------- Hướng dẫn ----------
  function guide() {
    return top("Hướng dẫn") + `<div class="grid g2">
      <div class="card"><h2>Trang này là gì</h2>
        <p>Bảng điều khiển chỉ đọc, được tạo lại mỗi lần website build (lệnh <code>npm run build</code>). Số liệu kiểm tra dùng chung bộ quy tắc với bước kiểm tra trước khi build, nên trang báo lỗi thì build cũng dừng.</p>
        <p>Mọi thay đổi đi qua GitHub: mở pull request, người phụ trách xem link xem trước của Cloudflare Pages, rồi duyệt và merge. Trang quản trị không tự sửa được website, nên không ai đăng bài khi chưa được duyệt.</p>
      </div>
      <div class="card"><h2>Quy trình một bài</h2>
        <ol style="padding-left:18px;margin:0">
          <li>Chọn từ khoá ở mục <a href="#tu-khoa">Từ khoá</a> (đỏ là chưa có).</li>
          <li>Bấm <b>Viết bài</b>, chọn tư liệu transcript cùng chủ đề, rồi chép lệnh cho SEO Editor.</li>
          <li>SEO Editor viết, chạy kiểm tra, mở pull request "Bài mới: …".</li>
          <li>Đọc bản xem trước, kiểm tra số liệu kỹ thuật và giá (nếu có), rồi Approve và Merge.</li>
          <li>Khoảng 1–2 phút sau, bài lên web và hiện ở đây.</li>
        </ol>
      </div>
      <div class="card"><h2>Tư liệu transcript từ TIKTIKTOTEXT</h2>
        <p>Mỗi video là một file <code>tu-lieu/transcript/&lt;slug&gt;.md</code>, có phần đầu gồm <code>link, kenh, tieuDe, ngayLay, chuDe, loai, cauHoiKhach</code>. Trường <code>chuDe</code> dùng tên nhóm trong kế hoạch SEO (Ắc quy, Lốp…) để trang quản trị gợi ý đúng bài.</p>
        <p>Bài dùng tư liệu ghi <code>tuLieu: [slug]</code>. Bước kiểm tra báo lỗi nếu bài chép nguyên văn từ 12 chữ liên tiếp trở lên.</p>
        <p class="note" style="margin-bottom:0">Repo đang công khai: không đưa transcript đầy đủ video của kênh khác vào repo. Để bản đó ngoài repo và chạy với <code>TU_LIEU_DIR=…</code>.</p>
      </div>
      <div class="card"><h2>Bảo vệ trang quản trị</h2>
        <p>Trang luôn gắn <code>noindex</code>, không nằm trong sitemap, và <code>robots.txt</code> chặn đường dẫn <code>/quan-tri/</code>. Trang không chứa dữ liệu riêng tư (mọi thứ đều có sẵn trong repo công khai), nhưng nên khoá lại:</p>
        <p style="margin-bottom:0">Cloudflare → <b>Zero Trust → Access → Applications</b> → thêm ứng dụng cho <code>${esc(S.url.replace(/^https?:\/\//, ""))}/quan-tri/*</code>, chỉ cho email @vcprosperous.com đăng nhập (miễn phí tới 50 người).</p>
      </div>
    </div>`;
  }

  // ---------- gắn sự kiện ----------
  function bind(id, parts) {
    if (id === "trang" && !parts[2]) {
      ["f-q", "f-s", "f-st"].forEach((x) => document.getElementById(x).addEventListener("input", rows));
      rows();
    }
    if (id === "trang" && parts[2]) {
      const t = document.getElementById("t-title");
      const d = document.getElementById("t-desc");
      if (!t) return;
      const p = D.pages.find((x) => x.section === parts[1] && x.slug === parts[2]);
      const upd = () => {
        document.getElementById("serp").innerHTML = serp(t.value, d.value, liveUrl(p));
        document.getElementById("cnt").innerHTML = counters(t.value, d.value);
      };
      t.addEventListener("input", upd);
      d.addEventListener("input", upd);
      document.getElementById("t-copy").addEventListener("click", () => copy(`title: ${JSON.stringify(t.value)}\ndescription: ${JSON.stringify(d.value)}`));
    }
    if (id === "tu-lieu" && D.tuLieu.length) {
      ["tl-c", "tl-u"].forEach((x) => document.getElementById(x).addEventListener("input", tlRows));
      tlRows();
    }
    if (id === "viet-bai") {
      const slug = document.getElementById("w-slug");
      slug.addEventListener("input", () => { slug.dataset.touched = slug.value ? "1" : ""; });
      document.querySelector(".form").addEventListener("input", writerUpdate);
      writerUpdate();
    }
  }

  route();
})();
