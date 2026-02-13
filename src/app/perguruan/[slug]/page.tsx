
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';
import { PERGURUAN_DETAIL_QUERY } from '@/sanity/lib/queries';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Users, Phone, ArrowLeft, Trophy, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableText, type PortableTextBlock } from '@portabletext/react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const school = await sanityFetch<{name: string; style: string; logo?: string}>({
        query: PERGURUAN_DETAIL_QUERY,
        params: { slug }
    });

    return {
        title: school?.name ? `${school.name} | KSJ` : 'Perguruan | KSJ',
        description: school ? `${school.name} - Perguruan ${school.style} di Kampung Silat Jampang` : 'Perguruan silat di Kampung Silat Jampang',
        openGraph: {
            title: school?.name,
            images: school?.logo ? [school.logo] : [],
        },
    };
}

export default async function PerguruanDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    if (!slug || slug === 'null' || slug === 'undefined') {
        notFound();
    }

    const school = await sanityFetch<{_id: string; name: string; style: string; members: number; location: string; description?: PortableTextBlock[]; history?: PortableTextBlock[]; masterName?: string; contact?: string; logo?: string} | null>({
        query: PERGURUAN_DETAIL_QUERY,
        params: { slug }
    });

    if (!school) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            {/* Header Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-600/10 to-transparent pointer-events-none" />
                <div className="absolute top-20 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] pointer-events-none" />

                <div className="container mx-auto px-6 relative z-10">
                    <Link
                        href="/#directory"
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-12 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Direktori
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 md:items-end">
                        <div className="w-32 h-32 md:w-48 md:h-48 bg-neutral-900 rounded-3xl border border-white/10 p-2 shadow-2xl">
                            <div className="w-full h-full bg-neutral-800 rounded-2xl flex items-center justify-center text-6xl overflow-hidden relative">
                                {school.logo ? (
                                    <Image src={school.logo} alt={school.name} fill className="object-cover" />
                                ) : '🥋'}
                            </div>
                        </div>

                        <div className="flex-1">
                            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm font-bold tracking-widest uppercase border border-amber-500/20 mb-4">
                                {school.style}
                            </span>
                            <h1 className="text-4xl md:text-7xl font-bold font-display tracking-tight text-white mb-4">
                                {school.name}
                            </h1>
                            <div className="flex flex-wrap gap-6 text-gray-400">
                                <span className="flex items-center gap-2"><MapPin size={18} className="text-amber-500" /> {school.location}</span>
                                <span className="flex items-center gap-2"><Users size={18} className="text-amber-500" /> {school.members} Anggota</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs Style */}
            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-3 gap-16">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-16">
                        <section>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 font-display">
                                <ShieldCheck className="text-amber-500" /> Profil Perguruan
                            </h2>
                            <div className="prose prose-invert prose-amber max-w-none text-gray-400 text-lg leading-relaxed">
                                {school.description ? (
                                    <PortableText value={school.description} />
                                ) : (
                                    <p>Informasi profil sedang diperbarui oleh pengurus perguruan.</p>
                                )}
                            </div>
                        </section>

                        {school.history && (
                            <section>
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 font-display">
                                    <Trophy className="text-amber-500" /> Sejarah & Warisan
                                </h2>
                                <div className="prose prose-invert prose-amber max-w-none text-gray-400 text-lg leading-relaxed">
                                    <PortableText value={school.history} />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        {school.masterName && (
                            <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 sticky top-32">
                                <h3 className="text-xl font-bold mb-6 font-display border-b border-white/10 pb-4">Dewan Guru</h3>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-3xl">👤</div>
                                    <div>
                                        <p className="font-bold text-white text-lg">{school.masterName}</p>
                                        <p className="text-amber-500 text-sm font-medium">Guru Besar</p>
                                    </div>
                                </div>

                                {school.contact && (
                                    <a
                                        href={`https://wa.me/${school.contact}`}
                                        target="_blank"
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg"
                                    >
                                        <Phone size={20} /> Hubungi Kami
                                    </a>
                                )}
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            <Footer />
        </main>
    );
}
