"use client";

import album from "@/data/album.json";
import { getMediaBaseUrl } from "@/lib/media";
import { useEffect, useMemo, useRef, useState } from "react";

const mediaBase = getMediaBaseUrl();
const hasValidMediaBase = Boolean(mediaBase);

function encodePathSegment(value: string) {
    return encodeURIComponent(value);
}

function mediaUrl(file: string) {
    if (!hasValidMediaBase || !mediaBase) {
        return null;
    }

    return `${mediaBase}/${encodePathSegment(album.slug)}/${encodePathSegment(file)}`;
}

function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const wholeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(wholeSeconds / 60);
    const remainingSeconds = wholeSeconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function AlbumPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(
        album.tracks[0]?.duration ?? 0,
    );
    const [volume, setVolume] = useState(1);
    const [playbackError, setPlaybackError] = useState<string | null>(null);
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const autoplayNextSourceRef = useRef(false);
    const [downloading, setDownloading] = useState<string | null>(
        null,
    );

    const currentTrack = album.tracks[currentIndex];

    const streamUrl = useMemo(
        () => mediaUrl(currentTrack.file),
        [currentTrack.file],
    );

    const coverUrl = album.coverFile
        ? mediaUrl(album.coverFile)
        : null;

    const albumDownloadUrl = mediaUrl(album.albumDownloadFile);

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        audio.volume = volume;
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        setPlaybackError(null);
        audio.load();
        setCurrentTime(0);
        setDuration(currentTrack.duration || 0);

        if (autoplayNextSourceRef.current) {
            audio.play()
                .then(() => setPlaying(true))
                .catch(() => {
                    setPlaying(false);
                    setPlaybackError("This track could not be played.");
                });

            autoplayNextSourceRef.current = false;
        }
    }, [currentIndex, currentTrack.duration]);

    const togglePlayback = async () => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        if (audio.paused) {
            try {
                setPlaybackError(null);
                await audio.play();
                setPlaying(true);
            } catch {
                setPlaying(false);
                setPlaybackError("This track could not be played. Check the media URL and R2 object.");
            }
        } else {
            audio.pause();
            setPlaying(false);
        }
    };

    const selectTrack = async (index: number) => {
        if (index === currentIndex) {
            await togglePlayback();
            return;
        }

        autoplayNextSourceRef.current = true;
        setCurrentIndex(index);
    };

    const previousTrack = () => {
        const audio = audioRef.current;

        if (audio && audio.currentTime > 5) {
            audio.currentTime = 0;
            return;
        }

        autoplayNextSourceRef.current = playing;
        setCurrentIndex((index) =>
            index === 0 ? album.tracks.length - 1 : index - 1,
        );
    };

    const nextTrack = () => {
        autoplayNextSourceRef.current = true;
        setCurrentIndex((index) =>
            index === album.tracks.length - 1 ? 0 : index + 1,
        );
    };

    const seek = (value: number) => {
        const audio = audioRef.current;

        if (!audio) {
            return;
        }

        audio.currentTime = value;
        setCurrentTime(value);
    };

    const downloadTrack = async (file: string) => {
        try {
            setDownloading(file);
            setDownloadError(null);

            const url = mediaUrl(file);
            if (!url) {
                throw new Error("Media URL is not configured.");
            }

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Download failed with HTTP ${response.status}`,
                );
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const anchor = document.createElement("a");
            anchor.href = objectUrl;
            anchor.download = file;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            window.setTimeout(() => {
                URL.revokeObjectURL(objectUrl);
            }, 1000);
        } catch {
            setDownloadError("This download could not be started. Check the media URL and R2 object.");
        } finally {
            setDownloading(null);
        }
    };

    return (
        <main className="mx-auto min-h-screen max-w-5xl px-5 pb-40 pt-10 text-zinc-100">
            <section className="grid gap-8 md:grid-cols-[320px_1fr]">
                <div>
                    {coverUrl && (
                        <img
                            src={coverUrl}
                            alt={`${album.title} album cover`}
                            className="aspect-square w-full rounded-xl object-cover shadow-2xl"
                        />
                    )}
                </div>

                <div className="flex flex-col justify-end">
                    <p className="mb-2 text-sm uppercase tracking-[0.2em] text-zinc-400">
                        Album
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                        {album.title}
                    </h1>

                    <p className="mt-3 text-xl text-zinc-300">
                        {album.artist}
                        {album.year ? ` · ${album.year}` : ""}
                    </p>

                    {album.notes && (
                        <p className="mt-6 max-w-2xl whitespace-pre-line leading-7 text-zinc-400">
                            {album.notes}
                        </p>
                    )}

                    <a
                        href={albumDownloadUrl ?? undefined}
                        aria-disabled={!albumDownloadUrl}
                        className="mt-7 w-fit rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-medium transition hover:border-zinc-300 hover:bg-zinc-800"
                    >
                        Download Album
                    </a>
                </div>
            </section>

            {!hasValidMediaBase && (
                <p className="mt-6 rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                    Audio is unavailable until NEXT_PUBLIC_MEDIA_BASE_URL is set to your Cloudflare R2 custom domain.
                </p>
            )}

            {playbackError && (
                <p role="alert" className="mt-6 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                    {playbackError}
                </p>
            )}

            <section className="mt-12 overflow-hidden rounded-xl border border-zinc-800">
                {album.tracks.map((track, index) => {
                    const selected = index === currentIndex;

                    return (
                        <div
                            key={track.file}
                            className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 border-b border-zinc-800 px-4 py-3 last:border-b-0 ${selected ? "bg-zinc-900" : "bg-zinc-950"
                                }`}
                        >
                            <button
                                type="button"
                                onClick={() => selectTrack(index)}
                                className="h-9 w-9 rounded-full text-sm hover:bg-zinc-800"
                                aria-label={`Play ${track.title}`}
                            >
                                {selected && playing ? "❚❚" : "▶"}
                            </button>

                            <div className="min-w-0">
                                <p className="truncate font-medium">
                                    <span className="mr-3 text-zinc-500">
                                        {track.number}
                                    </span>
                                    {track.title}
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    {formatTime(track.duration)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => void downloadTrack(track.file)}
                                disabled={!hasValidMediaBase || downloading === track.file}
                                className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50"
                            >
                                {downloading === track.file
                                    ? "Downloading…"
                                    : "Download"}
                            </button>
                        </div>
                    );
                })}
            </section>

            {downloadError && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                    {downloadError}
                </p>
            )}

            {streamUrl && (
                <audio
                    ref={audioRef}
                    src={streamUrl}
                    preload="metadata"
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onError={() => {
                        setPlaying(false);
                        setPlaybackError("This track could not be loaded. Check its R2 object and Content-Type.");
                    }}
                    onEnded={nextTrack}
                    onTimeUpdate={(event) =>
                        setCurrentTime(event.currentTarget.currentTime)
                    }
                    onLoadedMetadata={(event) =>
                        setDuration(event.currentTarget.duration)
                    }
                />
            )}

            <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center gap-4">
                    <button
                        type="button"
                        onClick={previousTrack}
                        className="h-10 w-10 rounded-full hover:bg-zinc-800"
                        aria-label="Previous track"
                    >
                        ⏮
                    </button>

                    <button
                        type="button"
                        onClick={togglePlayback}
                        className="h-11 w-11 rounded-full bg-zinc-100 text-zinc-950"
                        aria-label={playing ? "Pause" : "Play"}
                    >
                        {playing ? "❚❚" : "▶"}
                    </button>

                    <button
                        type="button"
                        onClick={nextTrack}
                        className="h-10 w-10 rounded-full hover:bg-zinc-800"
                        aria-label="Next track"
                    >
                        ⏭
                    </button>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                            {currentTrack.title}
                        </p>

                        <div className="mt-2 flex items-center gap-2">
                            <span className="w-10 text-right text-xs text-zinc-500">
                                {formatTime(currentTime)}
                            </span>

                            <input
                                type="range"
                                min={0}
                                max={duration || 0}
                                step={0.1}
                                value={Math.min(currentTime, duration || 0)}
                                onChange={(event) =>
                                    seek(Number(event.target.value))
                                }
                                className="min-w-0 flex-1"
                                aria-label="Seek"
                            />

                            <span className="w-10 text-xs text-zinc-500">
                                {formatTime(duration)}
                            </span>
                        </div>
                    </div>

                    <div className="hidden w-32 items-center gap-2 sm:flex">
                        <span aria-hidden="true">🔊</span>

                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={(event) =>
                                setVolume(Number(event.target.value))
                            }
                            aria-label="Volume"
                            className="w-full"
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
