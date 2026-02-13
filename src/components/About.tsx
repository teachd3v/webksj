
'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function About() {
    return (
        <section id="about" className="py-32 bg-neutral-950 text-white relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-amber-900/10 blur-[120px]" />
            <div className="absolute bottom-0 left-0 w-1/3 h-full bg-blue-900/10 blur-[120px]" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-1 w-12 bg-amber-500"></div>
                            <span className="text-amber-500 uppercase tracking-widest text-sm font-bold">Sekapur Sirih</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-bold mb-8 font-display leading-tight">
                            Rawat Tradisi, Cetak<br /> <span className="text-amber-500">Generasi Tangguh.</span>
                        </h2>

                        <div className="space-y-6 text-lg text-gray-400 font-light leading-relaxed">
                            <p>
                                Hadir sejak 2008, <strong className="text-white">Kampung Silat Jampang</strong> mendedikasikan diri sebagai pusat silaturahmi pencak silat di Jabodetabek. Saat ini, keluarga besar kami meliputi 62 perguruan dengan total 5.040 siswa aktif dan 25 aliran silat.
                            </p>
                            <p>
                                Bersama, kami berkomitmen merawat tradisi dan mencetak generasi tangguh.
                            </p>
                        </div>

                        <div className="mt-10 p-6 glass rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Visi Kami
                            </h3>
                            <p className="text-gray-400 italic">&quot;Menjadikan Kampung Silat Jampang sebagai barometer pelestarian dan pengembangan pencak silat dunia.&quot;</p>
                        </div>
                    </motion.div>

                    {/* Structure / Image Area */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl opacity-20 blur-2xl"></div>
                        <div className="relative bg-neutral-900 aspect-[4/5] rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center p-8 text-center group">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                            <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center mb-6 border border-neutral-700 shadow-xl z-10">
                                <span className="text-4xl">👑</span>
                            </div>
                            <h4 className="text-2xl font-bold font-display text-white z-10">Struktur Pengurus</h4>
                            <p className="text-gray-500 mt-2 z-10">Dewan Guru & Pengelola KSJ</p>

                            <Link href="/organisasi" className="mt-8 px-6 py-2 border border-amber-500/30 text-amber-500 rounded-full hover:bg-amber-500 hover:text-white transition-all text-sm uppercase tracking-wider z-10">
                                Lihat Bagan Lengkap
                            </Link>
                        </div>
                        {/* Parallax elements could go here */}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
