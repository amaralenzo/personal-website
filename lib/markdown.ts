import { getExperiences } from "@/lib/experiences";
import { site } from "@/lib/site";

function cleanMdx(source: string): string {
  return source.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trim();
}

export function buildMarkdown(): string {
  const intro = [
    `# ${site.name}`,
    site.tagline,
    `hey, i'm enzo :)`,
    `i'm a CS student @ [Purdue University](https://purdue.edu) ('27), SWE intern @ [ServiceNow](https://servicenow.com), and [Zed](https://zed.dev) campus ambassador. i grew up in Brazil building Minecraft plugins and mods, and now i obsess over LLMs and creating good user experiences.`,
    `i love talking to people, making [lame ideas](https://paulgraham.com/early.html) come alive, and playing Dungeons & Dragons. feel free to [say hi](mailto:${site.email}) if you're building something cool or want to chat. if you're looking for an engineer, here's my [résumé](${site.url}${site.links.resume}).`,
  ];

  const sections = getExperiences().map((e) =>
    [
      `## ${e.title} — ${e.kind} (${e.period})`,
      e.url && `<${e.url}>`,
      cleanMdx(e.content),
    ]
      .filter(Boolean)
      .join("\n\n"),
  );

  const links = [
    `## Links`,
    `- GitHub: ${site.links.github}`,
    `- LinkedIn: ${site.links.linkedin}`,
    `- Email: ${site.email}`,
    `- Résumé: ${site.url}/resume.md`,
  ].join("\n");

  return [...intro, ...sections, links].join("\n\n") + "\n";
}
