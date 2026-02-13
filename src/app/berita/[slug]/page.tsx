
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';
import { NEWS_DETAIL_QUERY } from '@/sanity/lib/queries';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Calendar, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableText, type PortableTextBlock } from '@portabletext/react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const newsItem = await sanityFetch<{title: string; excerpt: string; image?: string}>({
        query: NEWS_DETAIL_QUERY,
        params: { slug }
    });

    return {
        title: newsItem?.title ? `${newsItem.title} | KSJ` : 'Berita | KSJ',
        description: newsItem?.excerpt || 'Berita dan kegiatan Kampung Silat Jampang',
        openGraph: {
            title: newsItem?.title,
            description: newsItem?.excerpt,
            images: newsItem?.image ? [newsItem.image] : [],
        },
    };
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const newsItem = await sanityFetch<{_id: string; title: string; slug: string; date: string; excerpt: string; image?: string; content?: PortableTextBlock[]}>({
        query: NEWS_DETAIL_QUERY,
        params: { slug }
    });

    if (!newsItem) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white pb-20">
            <Navbar />

            {/* Hero Header */}
            <div className="relative h-[60vh] w-full pt-20">
                <div className="absolute inset-0 bg-neutral-900">
                    {newsItem.image ? (
                        <Image
                            src={newsItem.image}
                            alt={newsItem.title}
                            fill
                            className="object-cover opacity-40"
                        />
                    ) : (
                        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <span className="text-neutral-600 text-6xl italic">KSJ News</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
                </div>

                <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-end pb-12">
                    <Link
                        href="/#berita-section"
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-8 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Berita
                    </Link>

                    <div className="flex items-center gap-3 text-gray-400 mb-4 uppercase tracking-widest text-sm font-bold">
                        <Calendar size={16} className="text-amber-500" />
                        {newsItem.date}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold font-display max-w-4xl tracking-tight leading-tight">
                        {newsItem.title}
                    </h1>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 mt-16">
                <article className="max-w-3xl mx-auto">
                    <div className="prose prose-invert prose-amber max-w-none text-gray-300 text-lg leading-relaxed">
                        {newsItem.excerpt && (
                            <p className="text-xl text-amber-500/80 font-medium mb-12 italic border-l-4 border-amber-500 pl-6 leading-relaxed">
                                {newsItem.excerpt}
                            </p>
                        )}

                        {newsItem.content ? (
                            <PortableText value={newsItem.content} />
                        ) : (
                            <p>Isi berita sedang dalam proses kurasi...</p>
                        )}
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/10 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                            Bagikan kabar ini:
                        </div>
                        <div className="flex gap-4">
                            {/* Social Share Buttons could go here */}
                            <button className="text-gray-400 hover:text-white transition-colors">WhatsApp</button>
                            <button className="text-gray-400 hover:text-white transition-colors">Facebook</button>
                        </div>
                    </div>
                </article>
            </div>

            <Footer />
        </main>
    );
}
