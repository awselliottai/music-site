import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";

const sourceDirectory = process.env.ALBUM_SOURCE_DIR;
const requestedSlug = process.env.ALBUM_SLUG;
const requestedTitle = process.env.ALBUM_TITLE;
const requestedArtist = process.env.ALBUM_ARTIST;

if (!sourceDirectory) {
    throw new Error("ALBUM_SOURCE_DIR is required.");
}

const slugify = (value) =>
    value
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const formatTrackTitle = (file) =>
    path
        .basename(file, path.extname(file))
        .replace(/^\d{1,3}[-_. ]*/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

const albumSlug =
    requestedSlug || slugify(path.basename(path.resolve(sourceDirectory)));

const supportedExtensions = new Set([".mp3", ".flac", ".wav", ".m4a"]);

const directoryEntries = await readdir(sourceDirectory, {
    withFileTypes: true,
});

const audioFiles = directoryEntries
    .filter(
        (entry) =>
            entry.isFile() &&
            supportedExtensions.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name);

if (audioFiles.length === 0) {
    throw new Error(`No supported audio files found in ${sourceDirectory}`);
}

const tracks = await Promise.all(
    audioFiles.map(async (file) => {
        const fullPath = path.join(sourceDirectory, file);
        const metadata = await parseFile(fullPath);

        return {
            file,
            number: metadata.common.track.no ?? Number.MAX_SAFE_INTEGER,
            title: metadata.common.title?.trim() || formatTrackTitle(file),
            artist: metadata.common.artist ?? "",
            albumArtist: metadata.common.albumartist ?? "",
            album: metadata.common.album ?? "",
            year: metadata.common.year ?? null,
            duration: Math.round(metadata.format.duration ?? 0),
        };
    }),
);

tracks.sort((a, b) => {
    if (a.number !== b.number) {
        return a.number - b.number;
    }

    return a.file.localeCompare(b.file, undefined, {
        numeric: true,
        sensitivity: "base",
    });
});

const firstTrack = tracks[0];

const coverFile = directoryEntries.some(
    (entry) => entry.isFile() && entry.name === "cover.jpg",
)
    ? "cover.jpg"
    : directoryEntries.some(
        (entry) => entry.isFile() && entry.name === "cover.png",
    )
        ? "cover.png"
        : null;

const album = {
    slug: albumSlug,
    title:
        requestedTitle ||
        firstTrack.album?.trim() ||
        (albumSlug === "summers-never-over"
            ? "Summer's Never Over"
            : path.basename(sourceDirectory)),
    artist: requestedArtist || firstTrack.albumArtist || firstTrack.artist || "",
    year: firstTrack.year,
    notes: "",
    coverFile,
    albumDownloadFile: `${albumSlug}.zip`,
    tracks: tracks.map((track, index) => ({
        number:
            Number.isFinite(track.number) &&
                track.number !== Number.MAX_SAFE_INTEGER
                ? track.number
                : index + 1,
        title: track.title,
        file: track.file,
        duration: track.duration,
    })),
};

await mkdir("src/data", { recursive: true });

await writeFile(
    "src/data/album.json",
    `${JSON.stringify(album, null, 2)}\n`,
    "utf8",
);

console.log(
    `Created src/data/album.json with ${album.tracks.length} tracks.`,
);
