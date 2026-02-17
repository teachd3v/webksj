
import { ArrowRight } from 'lucide-react';
import { fetchLatestVideos } from '@/lib/youtube';
import YoutubeVideosClient from './YoutubeVideosClient';

export default async function YoutubeVideos() {
    const videos = await fetchLatestVideos(3);

    return (
        <section id="video" className="py-24 bg-neutral-950">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div className="max-w-xl">
                        <span className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2 block">Channel YouTube</span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white font-display">Video <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-600">Terbaru</span></h2>
                    </div>
                    <a
                        href="https://www.youtube.com/@kampungsilatjampang"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2 text-white hover:text-amber-500 transition-colors mt-6 md:mt-0 font-medium"
                    >
                        Lihat Semua Video
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>

                <YoutubeVideosClient videos={videos} />
            </div>
        </section>
    );
}
