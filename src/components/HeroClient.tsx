
'use client';

import { motion } from 'framer-motion';

interface HeroClientProps {
    settings: {heroTagline?: string; heroDescription?: string} | null;
}

export default function HeroClient({ settings }: HeroClientProps) {
    return (
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto flex flex-col items-center">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="mb-6"
            >
                <span className="inline-block py-1 px-3 border border-amber-500/50 rounded-full text-amber-400 text-sm tracking-[0.2em] font-medium uppercase bg-amber-900/20 backdrop-blur-sm mb-4">
                    Sejak 2008
                </span>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none tracking-tight font-display drop-shadow-2xl">
                    {settings?.heroTagline || 'PUSAT BUDAYA'} <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">
                        {settings?.heroTagline ? '' : 'SILAT NUSANTARA'}
                    </span>
                </h1>
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-lg md:text-2xl text-gray-300 mb-10 max-w-2xl font-light leading-relaxed drop-shadow-md"
            >
                {settings?.heroDescription || 'Kampung Silat Jampang — Mengikat persaudaraan, melestarikan warisan leluhur, membangun karakter bangsa.'}
            </motion.p>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col md:flex-row gap-4"
            >
                <a href="#directory" className="px-10 py-4 bg-amber-600 hover:bg-amber-700 hover:scale-105 text-white rounded-full transition-all font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                    Cari Perguruan
                </a>
                <a href="#about" className="px-10 py-4 border border-white/20 bg-white/5 hover:bg-white/10 hover:scale-105 text-white rounded-full transition-all font-bold uppercase tracking-wider backdrop-blur-sm">
                    Tentang Kami
                </a>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 z-20"
            >
            </motion.div>
        </div>
    );
}
