import AlbumPlayer from "@/components/AlbumPlayer";
import album from "@/data/album.json";
import { getMediaBaseUrl } from "@/lib/media";
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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const mediaBase = getMediaBaseUrl();
    const validSiteUrl = siteUrl && /^https?:\/\/[^/]+(?:\/.*)?$/i.test(siteUrl)
        ? siteUrl
        : undefined;

    const coverUrl = album.coverFile && mediaBase
        ? `${mediaBase}/${encodeURIComponent(album.slug)}/${encodeURIComponent(album.coverFile)}`
        : undefined;

    const title = album.artist ? `${album.title} — ${album.artist}` : album.title;
    const description = album.notes
        ? album.notes.slice(0, 200)
        : `Listen to ${album.title} by ${album.artist}.`;

    return {
        title,
        description,
        authors: [{ name: album.artist }],
        creator: album.artist,
        alternates: {
            ...(validSiteUrl
                ? { canonical: `${validSiteUrl}/${album.slug}` }
                : {}),
        },
        openGraph: {
            type: "music.album",
            musicians: [album.artist],
            ...(validSiteUrl ? { url: `${validSiteUrl}/${album.slug}` } : {}),
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
        other: {
            "music:musician": album.artist,
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
