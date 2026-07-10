import { getResumeMarkdown } from "@/lib/resume";

export const dynamic = "force-static";

export function GET() {
  return new Response(getResumeMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    },
  });
}
