
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Play } from 'lucide-react';
import Image from 'next/image';
import type { YouTubeVideo } from '@/lib/youtube';

interface YoutubeVideosClientProps {
    videos: YouTubeVideo[];
}

export default function YoutubeVideosClient({ videos }: YoutubeVideosClientProps) {
    const [playingId, setPlayingId] = useState<string | null>(null);

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    if (!videos.length) {
        return (
            <p className="text-center text-gray-500 italic">Belum ada video terbaru.</p>
        );
    }

    return (
        <div className="grid md:grid-cols-3 gap-8">
            {videos.map((video, index) => (
                <motion.div
                    key={video.videoId}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group flex flex-col h-full"
                >
                    <div className="aspect-video rounded-2xl overflow-hidden relative mb-6 bg-neutral-900">
                        {playingId === video.videoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                                title={video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute inset-0 w-full h-full"
                            />
                        ) : (
                            <button
                                onClick={() => setPlayingId(video.videoId)}
                                className="w-full h-full relative cursor-pointer"
                                aria-label={`Putar video: ${video.title}`}
                            >
                                <Image
                                    src={video.thumbnail}
                                    alt={video.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play size={28} className="text-white ml-1" fill="white" />
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-bold mb-2 text-white leading-tight group-hover:text-amber-500 transition-colors font-display line-clamp-2">
                            {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar size={14} />
                            <span>{formatDate(video.publishedAt)}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
