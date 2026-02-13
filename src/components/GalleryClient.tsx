
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { GalleryItem } from '@/data/mockData';

interface GalleryClientProps {
    items: GalleryItem[];
}

export default function GalleryClient({ items }: GalleryClientProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {items.length > 0 ? items.map((item, index) => (
                <motion.div
                    key={item._id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`rounded-xl overflow-hidden relative cursor-pointer group ${index % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
                        }`}
                >
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center relative">
                        <Image src={item.image} alt={item.caption} fill className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                            <p className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{item.caption}</p>
                        </div>
                    </div>
                </motion.div>
            )) : (
                <p className="col-span-full text-center text-gray-500 italic">Galeri foto sedang diperbarui.</p>
            )}
        </div>
    );
}
