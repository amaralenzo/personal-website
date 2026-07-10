import { buildMarkdown } from "@/lib/markdown";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
