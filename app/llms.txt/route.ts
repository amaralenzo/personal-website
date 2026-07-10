import { site } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# ${site.name}

> ${site.description}

- [Home](${site.url}/index.md): About, experience, and projects
- [Résumé](${site.url}/resume.md): Education and experience
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
