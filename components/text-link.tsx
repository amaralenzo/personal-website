import Link from "next/link";

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  newTab?: boolean;
}

export function TextLink({ href, children, newTab = false }: TextLinkProps) {
  if (href.startsWith("/")) {
    return (
      <Link
        className="link"
        href={href}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {children}
      </Link>
    );
  }

  return (
    <a
      className="link"
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
