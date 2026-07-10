import fs from "node:fs";
import path from "node:path";

const resumePath = path.join(process.cwd(), "content", "resume.md");

export function getResumeMarkdown() {
  return fs.readFileSync(resumePath, "utf8");
}
