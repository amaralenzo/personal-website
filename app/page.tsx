import { Annotated } from "@/components/annotated";
import { ExperienceList } from "@/components/experience-list";
import { SocialLinks } from "@/components/social-links";
import { TextLink } from "@/components/text-link";
import { site } from "@/lib/site";

export default function HomePage() {
  return (
    <main id="main" className="stagger">
      <article className="article">
        <header>
          <h1>{site.name}</h1>
          <SocialLinks />
          <p className="tagline">{site.tagline}</p>
        </header>
        <p>hey, i&rsquo;m enzo :)</p>
        <p>
          i&rsquo;m a CS student @{" "}
          <TextLink href="https://purdue.edu" newTab>Purdue</TextLink>&#32;(&rsquo;27), SWE
          intern @ <TextLink href="https://servicenow.com" newTab>ServiceNow</TextLink>
          , and <TextLink href="https://zed.dev" newTab>Zed</TextLink> campus
          ambassador. i grew up in Brazil building Minecraft plugins and mods,
          and now i obsess over LLMs and creating good user experiences.
        </p>
        <p>
          i love talking to people,{" "}
          <Annotated type="highlight" delay={900}>
            making{" "}
            <TextLink href="https://paulgraham.com/early.html" newTab>
              lame ideas
            </TextLink>{" "}
            come alive
          </Annotated>
          , and playing Dungeons &amp; Dragons. feel free to{" "}
          {/* &#32; because the compiler strips a literal space after
            the tag if there's an html entity onthe text after the tag, crazy bug ngl */}
          <TextLink href={`mailto:${site.email}`} newTab>say hi</TextLink>&#32;if
          you&rsquo;re building something cool or want to chat. if you&rsquo;re
          looking for an engineer, here&rsquo;s my{" "}
          <TextLink href={site.links.resume} newTab>
            r&eacute;sum&eacute;
          </TextLink>
          .
        </p>
      </article>
      <ExperienceList />
    </main>
  );
}
