import type { Metadata } from "next";
import { Caveat, EB_Garamond, Playfair_Display } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-garamond",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Pub Golf — Live scorecard",
  description: "Barcelona Pub Golf live leaderboard and scorecards",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${garamond.variable} ${caveat.variable} font-[family-name:var(--font-garamond)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
