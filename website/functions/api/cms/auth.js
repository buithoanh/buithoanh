// GET /api/cms/auth – trang soạn bài (Decap CMS) mở cửa sổ này để đăng nhập GitHub.
// Cần GITHUB_CLIENT_ID và GITHUB_CLIENT_SECRET của một GitHub OAuth App (xem README).
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_CLIENT_ID) return new Response("Chưa cấu hình GITHUB_CLIENT_ID trong Cloudflare Pages.", { status: 503 });
  const url = new URL(request.url);
  const state = crypto.randomUUID();
  const gh = new URL("https://github.com/login/oauth/authorize");
  gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  gh.searchParams.set("redirect_uri", `${url.origin}/api/cms/callback`);
  gh.searchParams.set("scope", "repo,user");
  gh.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: { Location: gh.toString(), "Set-Cookie": `cms_state=${state}; Path=/api/cms; HttpOnly; Secure; SameSite=Lax; Max-Age=600` },
  });
}
