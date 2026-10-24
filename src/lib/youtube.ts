export interface YouTubeVideo {
    videoId: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
}

interface YouTubeChannelResponse {
    items?: Array<{
        contentDetails?: {
            relatedPlaylists?: {
                uploads?: string;
            };
        };
    }>;
}

interface YouTubePlaylistResponse {
    items?: Array<{
        snippet?: {
            resourceId?: {
                videoId?: string;
            };
            title?: string;
            thumbnails?: {
                maxres?: { url: string };
                high?: { url: string };
                medium?: { url: string };
            };
            publishedAt?: string;
        };
    }>;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const CHANNEL_HANDLE = 'kampungsilatjampang';

export async function fetchLatestVideos(maxResults = 3, apiKeyOverride?: string): Promise<YouTubeVideo[]> {
    const apiKey = apiKeyOverride || import.meta.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        return [];
    }

    try {
        const channelRes = await fetch(
            `${YOUTUBE_API_BASE}/channels?forHandle=${CHANNEL_HANDLE}&part=contentDetails&key=${apiKey}`
        );

        if (!channelRes.ok) {
            return [];
        }

        const channelData: YouTubeChannelResponse = await channelRes.json();
        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
            return [];
        }

        const playlistRes = await fetch(
            `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&part=snippet&key=${apiKey}`
        );

        if (!playlistRes.ok) {
            return [];
        }

        const playlistData: YouTubePlaylistResponse = await playlistRes.json();

        if (!playlistData.items?.length) {
            return [];
        }

        return playlistData.items
            .map((item) => {
                const snippet = item.snippet!;
                const thumbnail =
                    snippet.thumbnails?.maxres?.url ||
                    snippet.thumbnails?.high?.url ||
                    snippet.thumbnails?.medium?.url ||
                    '';

                return {
                    videoId: snippet.resourceId?.videoId || '',
                    title: snippet.title || '',
                    thumbnail,
                    publishedAt: snippet.publishedAt || '',
                };
            })
            .filter((v) => v.videoId);
    } catch {
        return [];
    }
}
