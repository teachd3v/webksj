
import { sanityFetch } from '@/sanity/lib/fetch';
import { PRODUCTS_QUERY } from '@/sanity/lib/queries';
import type { Product } from '@/data/mockData';
import UMKMClient from './UMKMClient';

export default async function UMKM() {
    const products = await sanityFetch<Product[]>({ query: PRODUCTS_QUERY });

    return (
        <section id="umkm" className="py-24 bg-neutral-900 border-t border-white/5 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">Karya <span className="text-amber-500">Komunitas</span></h2>
                    <p className="mt-4 text-gray-400">Produk lokal berkualitas dari tangan-tangan terampil warga KSJ.</p>
                </div>

                <UMKMClient products={products || []} />
            </div>
        </section>
    );
}
