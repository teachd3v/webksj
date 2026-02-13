import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PRODUCTS_QUERY } from '@/sanity/lib/queries';
import type { Product } from '@/data/mockData';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import UMKMClient from '@/components/UMKMClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Katalog Produk UMKM | KSJ',
    description: 'Katalog lengkap produk UMKM dari anggota Kampung Silat Jampang.',
};

export default async function ProdukPage() {
    const products = await sanityFetch<Product[]>({ query: PRODUCTS_QUERY });

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <Link
                        href="/#umkm"
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-12 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Beranda
                    </Link>

                    <div className="mb-20">
                        <span className="text-amber-500 font-bold tracking-[0.3em] uppercase text-sm mb-4 block">Katalog Lengkap</span>
                        <h1 className="text-4xl md:text-7xl font-bold font-display tracking-tight mb-6">
                            Produk <span className="text-amber-500">UMKM.</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            Koleksi lengkap produk lokal berkualitas dari tangan-tangan terampil warga Kampung Silat Jampang.
                        </p>
                    </div>

                    <UMKMClient products={products || []} />
                </div>
            </div>

            <Footer />
        </main>
    );
}
