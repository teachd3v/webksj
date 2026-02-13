import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';

export const metadata: Metadata = {
    title: 'Direktori Perguruan | KSJ',
    description: 'Daftar lengkap perguruan silat yang tergabung dalam ekosistem Kampung Silat Jampang.',
};
import { PERGURUAN_QUERY } from '@/sanity/lib/queries';
import type { Perguruan } from '@/data/mockData';
import DirectoryClient from '@/components/DirectoryClient';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default async function PerguruanPage() {
    const schools = await sanityFetch<Perguruan[]>({ query: PERGURUAN_QUERY });

    return (
        <main className="min-h-screen bg-neutral-900 text-neutral-50">
            <Navbar />
            <section className="pt-32 pb-24">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">Direktori <span className="text-amber-500">Perguruan</span></h1>
                        <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
                            Daftar lengkap perguruan silat yang tergabung dalam ekosistem KSJ.
                        </p>
                    </div>
                    <DirectoryClient schools={schools || []} />
                </div>
            </section>
            <Footer />
        </main>
    );
}
