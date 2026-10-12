// Trang công khai luôn có dấu / ở cuối (/cam-nang/ten-bai/) để mỗi bài chỉ có một địa chỉ trên Google.
// Không áp cho /api và /admin: trang admin của Payload gọi API không có dấu /.
import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname.endsWith("/") || /\.[a-z0-9]+$/i.test(pathname)) return NextResponse.next();
  // Ghép địa chỉ bằng tay: NextURL tự cắt dấu / ở cuối.
  return NextResponse.redirect(new URL(`${pathname}/${request.nextUrl.search}`, request.url), 308);
}

export const config = {
  matcher: ["/((?!api|admin|_next).*)"],
};
