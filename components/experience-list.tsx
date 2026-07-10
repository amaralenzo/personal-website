import type { ComponentProps } from "react";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getExperiences } from "@/lib/experiences";
import { ExperienceItem } from "./experience-item";
import { TextLink } from "./text-link";
import styles from "./experiences.module.css";

const components = {
  a: ({ href = "", children }: ComponentProps<"a">) => (
    <TextLink href={href} newTab>{children}</TextLink>
  ),
};

export function ExperienceList() {
  const experiences = getExperiences();

  if (experiences.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Experience</h2>
      <ul className={styles.list}>
        {experiences.map((experience) => (
          <ExperienceItem
            key={experience.slug}
            slug={experience.slug}
            title={experience.title}
            kind={experience.kind}
            period={experience.period}
            summary={experience.summary}
            url={experience.url}
            logo={experience.logo}
          >
            <MDXRemote source={experience.content} components={components} />
          </ExperienceItem>
        ))}
      </ul>
    </section>
  );
}
