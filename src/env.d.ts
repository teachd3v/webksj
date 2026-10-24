/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
    DB: D1Database;
    MEDIA_BUCKET: R2Bucket;
    YOUTUBE_API_KEY?: string;
}

declare module 'cloudflare:workers' {
    export const env: CloudflareEnv;
}
