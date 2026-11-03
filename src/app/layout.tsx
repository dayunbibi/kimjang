import type { Metadata, Viewport } from "next";
import "./globals.css";

// OG image lives in app/opengraph-image.png (Next adds the meta tags automatically).
// metadataBase turns it into an absolute URL, which Threads/Kakao need for the preview.
// Vercel sets VERCEL_PROJECT_PRODUCTION_URL at build time, so the domain is never hardcoded.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "온라인 김장하기",
  description: "비법 재료 넣고, 배추에 양념 골고루 바르기. 올해 김장은 여기서.",
  openGraph: {
    title: "온라인 김장하기",
    description: "12초 안에 배추에 양념 바르기. 할머니 손맛 도전!",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#e7ece3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* Korean display fonts. Loaded with a link tag because next/font only preloads latin subsets */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* root layout = every page, so this rule doesn't apply in the app router */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Dodum&family=Jua&display=swap"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
