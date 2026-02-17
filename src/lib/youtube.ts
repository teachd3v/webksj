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

export async function fetchLatestVideos(maxResults = 3): Promise<YouTubeVideo[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        console.error('YOUTUBE_API_KEY is not set');
        return [];
    }

    try {
        // Step 1: Get the uploads playlist ID from channel handle
        const channelRes = await fetch(
            `${YOUTUBE_API_BASE}/channels?forHandle=${CHANNEL_HANDLE}&part=contentDetails&key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );

        if (!channelRes.ok) {
            console.error('Failed to fetch YouTube channel:', channelRes.statusText);
            return [];
        }

        const channelData: YouTubeChannelResponse = await channelRes.json();
        const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

        if (!uploadsPlaylistId) {
            console.error('Could not find uploads playlist for channel');
            return [];
        }

        // Step 2: Get latest videos from the uploads playlist
        const playlistRes = await fetch(
            `${YOUTUBE_API_BASE}/playlistItems?playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&part=snippet&key=${apiKey}`,
            { next: { revalidate: 3600 } }
        );

        if (!playlistRes.ok) {
            console.error('Failed to fetch YouTube playlist:', playlistRes.statusText);
            return [];
        }

        const playlistData: YouTubePlaylistResponse = await playlistRes.json();

        if (!playlistData.items?.length) {
            return [];
        }

        return playlistData.items.map((item) => {
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
        }).filter((v) => v.videoId);
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}
