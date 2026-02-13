
'use client';

import { motion } from 'framer-motion';

interface StatsClientProps {
    stats: Array<{ label: string; value: number }>;
}

export default function StatsClient({ stats }: StatsClientProps) {

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl bg-gradient-to-r from-amber-700 to-orange-800 p-12 md:p-16 text-white shadow-2xl relative overflow-hidden"
        >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat mix-blend-overlay"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500 rounded-full blur-[100px] opacity-50"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 divide-y md:divide-y-0 md:divide-x divide-white/20">
                {stats.map((stat, index) => (
                    <div key={index} className="text-center px-4 pt-8 md:pt-0">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            whileInView={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 + (index * 0.1), duration: 0.5, type: 'spring' }}
                            className="text-6xl md:text-7xl font-bold font-display mb-2 drop-shadow-lg"
                        >
                            {stat.value}
                        </motion.div>
                        <p className="text-sm md:text-base uppercase tracking-[0.2em] font-medium text-orange-200">{stat.label}</p>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
