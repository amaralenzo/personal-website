import { NextRequest, NextResponse } from "next/server";

const markdownRoutes: Record<string, string> = {
  "/": "/index.md",
  "/resume": "/resume.md",
};

export function proxy(req: NextRequest) {
  const target = markdownRoutes[req.nextUrl.pathname];
  const response =
    target && req.headers.get("accept")?.includes("text/markdown")
      ? NextResponse.rewrite(new URL(target, req.url))
      : NextResponse.next();
  response.headers.append("Vary", "Accept");
  return response;
}

export const config = { matcher: ["/", "/resume"] };
