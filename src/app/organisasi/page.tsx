
import type { Metadata } from 'next';
import { sanityFetch } from '@/sanity/lib/fetch';

export const metadata: Metadata = {
    title: 'Struktur Organisasi | KSJ',
    description: 'Struktur pengurus dan bidang pengembangan Kampung Silat Jampang.',
};
import { ORGANISASI_QUERY } from '@/sanity/lib/queries';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import OrganisasiClient from '@/components/OrganisasiClient';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function OrganisasiPage() {
    const data = await sanityFetch<{title: string; pengurusInti: {name: string; role: string}[]; bidangList: {title: string; leader: string; members: string[]}[]} | null>({ query: ORGANISASI_QUERY });

    // Fallback data matching the new simplified schema
    const displayData = data || {
        title: "PENGURUS KAMPUNG SILAT JAMPANG",
        pengurusInti: [
            { name: "HERMAN BUDIANTO", role: "Ketua Umum" },
            { name: "SAHRAWARDI", role: "Sekretaris" },
            { name: "JABALLUDIN", role: "Bendahara" },
            { name: "SHEGI JUNIAR DANI", role: "Koordinator KSJ" }
        ],
        bidangList: [
            {
                title: "SILAT PRESTASI",
                leader: "IMANG",
                members: ["SUPRIYATNA", "M KHAIRUL", "M NUR", "ADUL"]
            },
            {
                title: "SILAT TRADISIONAL",
                leader: "ANGGA",
                members: ["OBOY", "NURHASAN", "RAHMAT", "ROKIB", "ADOEL"]
            },
            {
                title: "LITBANK / SIDEC",
                leader: "SABTADJI",
                members: ["Tono Hartono", "AGUS", "ILHAM", "ELFRIDO"]
            },
            {
                title: "EKONOMI SILAT",
                leader: "DODIK",
                members: ["JAYADI", "BAGIO", "HERDI", "HENDRO"]
            }
        ]
    };

    return (
        <main className="min-h-screen bg-neutral-950 text-white">
            <Navbar />

            <div className="pt-32 pb-20">
                <div className="container mx-auto px-6">
                    <Link
                        href="/#about"
                        className="inline-flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors mb-12 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Kembali ke Tentang Kami
                    </Link>

                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 tracking-tight">
                            {displayData.title}
                        </h1>
                        <div className="w-24 h-1 bg-amber-500 mx-auto rounded-full" />
                    </div>

                    <OrganisasiClient
                        pengurusInti={displayData.pengurusInti || []}
                        bidangList={displayData.bidangList || []}
                    />
                </div>
            </div>

            <Footer />
        </main>
    );
}
