## Configuration

The album metadata lives in [`src/data/album.json`](src/data/album.json). The `slug` is the R2 release folder name (`summers-never-over`), while `title` and track `title` values are the human-facing names.

Set the public URLs in `.env.local` and in the Vercel project settings:

```text
NEXT_PUBLIC_SITE_URL=https://music.your-domain.com
NEXT_PUBLIC_MEDIA_BASE_URL=https://media.your-domain.com/releases
```

`NEXT_PUBLIC_MEDIA_BASE_URL` must be the Cloudflare R2 custom domain, including the `releases` prefix. The expected object paths are:

```text
releases/summers-never-over/01-dip.wav
releases/summers-never-over/cover.jpg
releases/summers-never-over/summers-never-over.zip
```

The R2 bucket must allow `GET` and `HEAD` from the site origin and localhost through its CORS policy. Audio objects should have an audio `Content-Type` such as `audio/wav`; the archive should use `application/zip` and `Content-Disposition: attachment`.

To regenerate the manifest from source audio, provide the source directory and optional explicit metadata:

```bash
ALBUM_SOURCE_DIR="$HOME/Music/publish-album" \\
ALBUM_SLUG=summers-never-over \\
ALBUM_TITLE="Summer's Never Over" \\
ALBUM_ARTIST="Young Lung" \\
node scripts/build-album-manifest.mjs
```

## Getting Started

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
