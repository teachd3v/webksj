
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';

export const metadata: Metadata = {
    title: 'Berita & Kegiatan | KSJ',
    description: 'Kumpulan informasi terbaru, agenda kegiatan, dan catatan perjalanan Kampung Silat Jampang.',
};
import { NEWS_QUERY } from '@/sanity/lib/queries';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BlogClient from '@/components/BlogClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function BeritaPage() {
    const news = await sanityFetch<Array<{_id: string; title: string; slug: string; date: string; excerpt: string; image?: string}>>({ query: NEWS_QUERY });

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <Link
                        href="/#blog"
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-12 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Beranda
                    </Link>

                    <div className="mb-20">
                        <span className="text-amber-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">Arsip Lengkap</span>
                        <h1 className="text-4xl md:text-7xl font-bold font-display tracking-tight mb-6">
                            Berita & <span className="text-amber-500">Kegiatan.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            Kumpulan informasi terbaru, agenda kegiatan, dan catatan perjalanan Kampung Silat Jampang dalam melestarikan budaya Nusantara.
                        </p>
                    </div>

                    <BlogClient news={news || []} />
                </div>
            </div>

            <Footer />
        </main>
    );
}
