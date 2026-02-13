

import Image from 'next/image';
import Link from 'next/link';

export default function Directory() {
    return (
        <section id="directory" className="py-24 bg-neutral-900 relative overflow-hidden">
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-amber-900/10 rounded-full blur-[100px]"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 font-display text-white">Direktori <span className="text-amber-500">Perguruan</span></h2>
                    <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
                        Jaringan persaudaraan silat yang tergabung dalam ekosistem KSJ.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center space-y-8">
                    {/* Fixed aspect ratio container corresponding to 1440x209 (~6.89 ratio) */}
                    <div className="relative w-full max-w-6xl mx-auto aspect-[1440/209] rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                        <div className="absolute inset-0 bg-neutral-900/20 group-hover:bg-neutral-900/10 transition-colors duration-500" />
                        <Image
                            src="/images/62-logo-perguruan.png"
                            alt="Logo Perguruan KSJ"
                            fill
                            className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    <Link
                        href="/perguruan"
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-lg shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 group"
                    >
                        <span>Lihat Semua Perguruan</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </Link>
                </div>
            </div>
        </section>
    );
}
