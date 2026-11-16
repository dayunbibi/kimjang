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
  title: "포잎이의 김장 가게",
  description: "포잎이 사장님이 되어 순한 김치와 매콤 김치를 만들고 손님께 판매해요.",
  openGraph: {
    title: "포잎이의 김장 가게",
    description: "주문대로 양념하고 포장하는 포잎이의 작은 김장 가게",
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
