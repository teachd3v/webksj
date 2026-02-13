
'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { NewsItem } from '@/data/mockData';

interface BlogClientProps {
    news: NewsItem[];
}

export default function BlogClient({ news }: BlogClientProps) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.length > 0 ? news.map((item, index) => (
                <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="group flex flex-col h-full"
                >
                    <div className="h-64 rounded-2xl overflow-hidden relative mb-6 bg-neutral-900 flex items-center justify-center">
                        {item.image ? (
                            <Image src={item.image} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                            <span className="text-neutral-700 font-bold">No Image</span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2 text-xs font-semibold text-white">
                            <Calendar size={12} /> {item.date}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <h3 className="text-2xl font-bold mb-3 text-white leading-tight group-hover:text-amber-500 transition-colors font-display">
                            {item.title}
                        </h3>
                        <p className="text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                            {item.excerpt}
                        </p>
                        <Link
                            href={item.slug ? `/berita/${item.slug}` : '#'}
                            className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/30 pb-1 self-start hover:border-amber-500 hover:text-amber-500 transition-all text-center"
                        >
                            Baca Selengkapnya
                        </Link>
                    </div>
                </motion.div>
            )) : (
                <p className="col-span-full text-center text-gray-500 italic">Belum ada berita terbaru.</p>
            )}
        </div>
    );
}
