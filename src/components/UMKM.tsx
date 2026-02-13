
import { sanityFetch } from '@/sanity/lib/fetch';
import { BEST_SELLER_PRODUCTS_QUERY } from '@/sanity/lib/queries';
import type { Product } from '@/data/mockData';
import UMKMClient from './UMKMClient';
import Link from 'next/link';

export default async function UMKM() {
    const products = await sanityFetch<Product[]>({ query: BEST_SELLER_PRODUCTS_QUERY });

    return (
        <section id="umkm" className="py-24 bg-neutral-900 border-t border-white/5 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">Karya <span className="text-amber-500">Komunitas</span></h2>
                    <p className="mt-4 text-gray-400">Produk lokal berkualitas dari tangan-tangan terampil warga KSJ.</p>
                </div>

                <UMKMClient products={products || []} />

                <div className="text-center mt-12">
                    <Link
                        href="/produk"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-lg shadow-lg shadow-amber-500/20 transition-all group"
                    >
                        <span>Lihat Semua Produk</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
