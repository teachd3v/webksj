
import { ArrowRight } from 'lucide-react';
import { sanityFetch } from '@/sanity/lib/fetch';
import { NEWS_QUERY } from '@/sanity/lib/queries';
import type { NewsItem } from '@/data/mockData';
import BlogClient from './BlogClient';
import Link from 'next/link';

export default async function Blog() {
    const news = await sanityFetch<NewsItem[]>({ query: NEWS_QUERY });
    const latestNews = news?.slice(0, 3) || [];

    return (
        <section id="berita-section" className="py-24 bg-neutral-950">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8">
                    <div className="max-w-xl">
                        <span className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-2 block">Kabar Padepokan</span>
                        <h2 className="text-3xl md:text-5xl font-bold text-white font-display">Berita & Kegiatan</h2>
                    </div>
                    <Link href="/berita" className="group flex items-center gap-2 text-white hover:text-amber-500 transition-colors mt-6 md:mt-0 font-medium">
                        Lihat Semua Berita
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <BlogClient news={latestNews} />
            </div>
        </section>
    );
}
