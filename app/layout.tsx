import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { PresenceHint } from "@/components/presence/hint";
import { PresenceOverlay } from "@/components/presence/overlay";
import { PresenceProvider } from "@/components/presence/provider";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: "italic",
  variable: "--font-newsreader",
});

export const viewport: Viewport = {
  themeColor: "#fdfdfc",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.name,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: site.name,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable}`}
    >
      <body>
        <a className="skip-link" href="#main">
          skip to content
        </a>
        <PresenceProvider>
          <div className="container">{children}</div>
          <PresenceOverlay />
          <PresenceHint />
        </PresenceProvider>
      </body>
    </html>
  );
}
