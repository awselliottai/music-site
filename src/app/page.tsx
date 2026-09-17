import AlbumPlayer from "@/components/AlbumPlayer";
import album from "@/data/album.json";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type AlbumPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return [
    {
      slug: album.slug,
    },
  ];
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug !== album.slug) {
    return {};
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

  if (!siteUrl || !mediaBase) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_MEDIA_BASE_URL are required.",
    );
  }

  const coverUrl = album.coverFile
    ? `${mediaBase}/${encodeURIComponent(album.slug)}/${encodeURIComponent(album.coverFile)}`
    : undefined;

  const title = `${album.title} — ${album.artist}`;
  const description = album.notes
    ? album.notes.slice(0, 200)
    : `Listen to ${album.title} by ${album.artist}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${album.slug}`,
    },
    openGraph: {
      type: "music.album",
      url: `${siteUrl}/${album.slug}`,
      title,
      description,
      images: coverUrl
        ? [
          {
            url: coverUrl,
            width: 1200,
            height: 1200,
            alt: `${album.title} album cover`,
          },
        ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: coverUrl ? [coverUrl] : [],
    },
  };
}

export default async function AlbumPage({
  params,
}: AlbumPageProps) {
  const { slug } = await params;

  if (slug !== album.slug) {
    notFound();
  }

  return <AlbumPlayer />;
}