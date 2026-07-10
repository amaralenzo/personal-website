import fs from "node:fs";
import path from "node:path";
import { getFrontmatter } from "next-mdx-remote-client/utils";

export interface Experience {
  slug: string;
  title: string;
  kind: string;
  period: string;
  date: string;
  summary?: string;
  url?: string;
  logo?: string;
  content: string;
}

type Frontmatter = Record<string, unknown> & {
  title: string;
  kind: string;
  period: string;
  date: string;
  summary?: string;
  url?: string;
  logo?: string;
};

const experiencesDirectory = path.join(process.cwd(), "content", "experiences");

export function getExperiences(): Experience[] {
  return fs
    .readdirSync(experiencesDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => readExperience(file))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function readExperience(file: string): Experience {
  const source = fs.readFileSync(
    path.join(experiencesDirectory, file),
    "utf8",
  );
  const { frontmatter, strippedSource } = getFrontmatter<Frontmatter>(source);

  return {
    slug: file.replace(/\.mdx$/, ""),
    title: frontmatter.title,
    kind: frontmatter.kind,
    period: frontmatter.period,
    date: frontmatter.date,
    summary: frontmatter.summary,
    url: frontmatter.url,
    logo: frontmatter.logo,
    content: strippedSource,
  };
}
