export function getMediaBaseUrl(value = process.env.NEXT_PUBLIC_MEDIA_BASE_URL) {
    if (!value?.trim()) {
        return null;
    }

    try {
        const url = new URL(value.trim());

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return null;
        }

        url.pathname = url.pathname.replace(/\/+$/, "");

        if (!url.pathname.endsWith("/releases")) {
            url.pathname = `${url.pathname}/releases`;
        }

        return url.toString().replace(/\/$/, "");
    } catch {
        return null;
    }
}
