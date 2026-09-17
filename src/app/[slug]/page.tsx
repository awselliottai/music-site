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

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const mediaBase = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;

    const validSiteUrl = siteUrl && /^https?:\/\/[^/]+(?:\/.*)?$/i.test(siteUrl)
        ? siteUrl
        : undefined;
    const validMediaBase = mediaBase && /^https?:\/\/[^/]+(?:\/.*)?$/i.test(mediaBase)
        ? mediaBase.replace(/\/$/, "")
        : undefined;

    const coverUrl = album.coverFile && validMediaBase
        ? `${validMediaBase}/${encodeURIComponent(album.slug)}/${encodeURIComponent(album.coverFile)}`
        : undefined;

    const title = album.artist ? `${album.title} — ${album.artist}` : album.title;
    const description = album.notes
        ? album.notes.slice(0, 200)
        : `Listen to ${album.title} by ${album.artist}.`;

    return {
        title,
        description,
        alternates: {
            ...(validSiteUrl
                ? { canonical: `${validSiteUrl}/${album.slug}` }
                : {}),
        },
        openGraph: {
            type: "music.album",
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
