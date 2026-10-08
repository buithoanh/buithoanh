// GET /api/cms/callback – GitHub trả về đây; đổi mã lấy token rồi chuyển cho cửa sổ Decap CMS
// theo giao thức postMessage của Decap ("authorization:github:success:{...}").
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const state = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)cms_state=([^;]+)/)?.[1];
  const code = url.searchParams.get("code");
  if (!code || !state || state !== url.searchParams.get("state")) return page("error", { message: "Phiên đăng nhập hết hạn, thử lại." }, url.origin);

  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "vc-mobile-care-cms" },
    body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code }),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.access_token) return page("error", { message: data.error_description || "GitHub không cấp quyền." }, url.origin);
  return page("success", { token: data.access_token, provider: "github" }, url.origin);
}

function page(status, content, origin) {
  const msg = JSON.stringify(`authorization:github:${status}:${JSON.stringify(content)}`).replace(/</g, "\\u003c");
  const html = `<!doctype html><meta charset="utf-8"><title>Đăng nhập</title><p>${status === "success" ? "Đã đăng nhập, đang quay lại trang soạn bài…" : "Đăng nhập không thành công."}</p>
<script>
(function () {
  var origin = ${JSON.stringify(origin)};
  function receive(e) {
    if (e.origin !== origin) return;
    window.opener.postMessage(${msg}, origin);
    window.removeEventListener("message", receive);
  }
  window.addEventListener("message", receive);
  if (window.opener) window.opener.postMessage("authorizing:github", origin);
})();
</script>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Set-Cookie": "cms_state=; Path=/api/cms; HttpOnly; Secure; SameSite=Lax; Max-Age=0" },
  });
}
