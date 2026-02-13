
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, Star } from 'lucide-react';
import type { Product } from '@/data/mockData';

interface UMKMClientProps {
    products: Product[];
}

export default function UMKMClient({ products }: UMKMClientProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.length > 0 ? products.map((product, index) => (
                <motion.div
                    key={product._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-neutral-800 rounded-2xl overflow-hidden group hover:shadow-2xl hover:shadow-amber-900/20 transition-all duration-500 border border-white/5"
                >
                    <div className="h-64 bg-neutral-700 relative overflow-hidden flex items-center justify-center">
                        {product.image ? (
                            <Image src={product.image} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                            <span className="text-neutral-500">No Image</span>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <a
                                href={product.whatsappLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-2 hover:bg-amber-400"
                            >
                                <ShoppingBag size={16} /> Beli
                            </a>
                        </div>

                        {product.isBestSeller && (
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white flex items-center gap-1">
                                <Star size={10} className="text-amber-400" fill="currentColor" /> Best Seller
                            </div>
                        )}
                    </div>

                    <div className="p-5">
                        <h3 className="font-bold text-lg text-white mb-1 font-display truncate">{product.name}</h3>
                        <div className="flex justify-between items-center">
                            <p className="text-amber-500 font-bold text-xl">{product.price}</p>
                        </div>
                    </div>
                </motion.div>
            )) : (
                <p className="col-span-full text-center text-gray-500 italic">Katalog produk sedang disiapkan.</p>
            )}
        </div>
    );
}
