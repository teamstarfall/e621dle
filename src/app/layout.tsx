import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "e621dle",
    description: "A game where you guess which furry tag has the most posts!",
    applicationName: "e621dle",
    keywords: "e621dle, e621, furry, wordle, rule34dle, -dle games, game",
    openGraph: {
        type: "website",
        url: "https://e621dle.starfall.team",
        title: "e621dle",
        description: "A game where you guess which furry tag has the most posts!",
        images: [{ url: "https://e621dle.starfall.team/preview.png" }],
    },
    twitter: {
        card: "summary_large_image",
        site: "@angelolz1",
        creator: "@angelolz1",
        title: "e621dle",
        description: "A game where you guess which furry tag has the most posts!",
        images: [{ url: "https://e621dle.starfall.team/preview.png" }],
    },
    verification: {
        google: "_CD5zYRKx9u1EoSliNztITWoV_T6FjVH1ynbN6q1l-M",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} antialiased`}>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
