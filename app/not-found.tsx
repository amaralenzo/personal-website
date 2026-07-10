import { TextLink } from "@/components/text-link";

export default function NotFound() {
  return (
    <main id="main" className="stagger">
      <article className="article">
        <header>
          <h1>page not found</h1>
        </header>
        <p>
          i have no clue how (or why?) you got here. head back{" "}
          <TextLink href="/">home</TextLink>!
        </p>
      </article>
    </main>
  );
}
