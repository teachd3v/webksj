import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
    title: 'Kolaborasi — Kampung Silat Jampang',
    description: 'Bergabunglah bersama KSJ sebagai sponsor kegiatan silat atau mitra pelatihan silat untuk sekolah dan komunitas.',
};

const WA_NUMBER = '628121490022';

const kolaborasiTypes = [
    {
        id: 'sponsor',
        icon: '🏆',
        title: 'Sponsor Kegiatan Silat',
        subtitle: 'Dukung pelestarian budaya silat Nusantara',
        description:
            'Jadikan brand Anda bagian dari perjalanan melestarikan seni bela diri warisan leluhur. Kegiatan KSJ mencakup turnamen, festival budaya, dan pertunjukan silat yang dihadiri ratusan hingga ribuan penonton dari berbagai daerah.',
        benefits: [
            'Eksposur brand di spanduk, backdrop, dan publikasi acara',
            'Sebutan sponsor di seluruh media sosial KSJ',
            'Akses eksklusif ke jaringan pegiat silat & komunitas budaya',
            'Sertifikat penghargaan kontribusi budaya nasional',
        ],
        ctaText: 'Hubungi Kami',
        waMessage: 'Halo, saya ingin bekerjasama sebagai sponsor kegiatan yang diselenggarakan KSJ',
        accent: 'from-amber-600 to-orange-600',
        borderAccent: 'border-amber-500/30',
        iconBg: 'bg-amber-900/30',
    },
    {
        id: 'mitra',
        icon: '🎓',
        title: 'Mitra Pelatihan Silat',
        subtitle: 'Hadirkan silat di sekolah & komunitas Anda',
        description:
            'Program pelatihan silat KSJ dirancang khusus untuk sekolah, pesantren, dan komunitas. Dipandu oleh pelatih berpengalaman dan bersertifikat, program ini membentuk karakter, kedisiplinan, dan kebanggaan budaya pada peserta didik.',
        benefits: [
            'Kurikulum pelatihan terstruktur sesuai usia & kebutuhan',
            'Pelatih bersertifikat dan berpengalaman',
            'Fleksibel — jadwal menyesuaikan agenda sekolah/komunitas',
            'Sertifikat resmi bagi peserta yang menyelesaikan program',
        ],
        ctaText: 'Hubungi Kami',
        waMessage: 'Halo, saya ingin bekerjasama sebagai mitra pelatihan silat untuk sekolah/komunitas bersama KSJ',
        accent: 'from-orange-600 to-red-700',
        borderAccent: 'border-orange-500/30',
        iconBg: 'bg-orange-900/30',
    },
];

export default function KolaborasiPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-neutral-950 text-white">
                {/* Hero */}
                <section className="relative pt-36 pb-20 px-6 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(217,119,6,0.15),_transparent_60%)] pointer-events-none" />
                    <div className="container mx-auto max-w-3xl relative">
                        <span className="inline-block py-1 px-3 border border-amber-500/50 rounded-full text-amber-400 text-sm tracking-[0.2em] font-medium uppercase bg-amber-900/20 backdrop-blur-sm mb-6">
                            Kerjasama
                        </span>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none mb-6 font-display">
                            Kolaborasi{' '}
                            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-orange-500">
                                Bersama KSJ
                            </span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl leading-relaxed">
                            Kami membuka peluang kerjasama yang saling menguntungkan — baik untuk mendukung kegiatan silat maupun menghadirkan pelatihan silat di lingkungan Anda.
                        </p>
                    </div>
                </section>

                {/* Cards */}
                <section className="container mx-auto px-6 pb-24 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-8">
                        {kolaborasiTypes.map((item) => {
                            const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(item.waMessage)}`;
                            return (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border ${item.borderAccent} bg-neutral-900/60 backdrop-blur-sm p-8 flex flex-col gap-6 hover:border-amber-500/60 transition-colors duration-300`}
                                >
                                    <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center text-3xl`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="text-amber-400 text-xs font-semibold uppercase tracking-widest mb-1">{item.subtitle}</p>
                                        <h2 className="text-2xl font-black font-display">{item.title}</h2>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed text-sm">{item.description}</p>
                                    <ul className="flex flex-col gap-3">
                                        {item.benefits.map((benefit) => (
                                            <li key={benefit} className="flex items-start gap-3 text-sm text-gray-300">
                                                <span className="mt-0.5 text-amber-500 shrink-0">✓</span>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="mt-auto pt-2">
                                        <Link
                                            href={waUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-2 w-full justify-center px-6 py-3 rounded-full bg-linear-to-r ${item.accent} font-bold text-sm uppercase tracking-wider hover:scale-105 hover:shadow-lg transition-all duration-300`}
                                        >
                                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                            </svg>
                                            {item.ctaText}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
