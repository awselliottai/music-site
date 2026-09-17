import type { Metadata } from "next";
import album from "@/data/album.json";
import "./globals.css";

export const metadata: Metadata = {
  title: `${album.title} — ${album.artist}`,
  description: `Listen to ${album.title} by ${album.artist}.`,
  authors: [{ name: album.artist }],
  creator: album.artist,
  other: {
    "music:musician": album.artist,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
