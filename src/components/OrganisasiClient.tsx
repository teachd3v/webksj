
'use client';

import { motion } from 'framer-motion';
import { Shield, Trophy, User } from 'lucide-react';

interface Pengurus {
    name: string;
    role: string;
}

interface Bidang {
    title: string;
    leader: string;
    members: string[];
}

export default function OrganisasiClient({
    pengurusInti,
    bidangList
}: {
    pengurusInti: Pengurus[],
    bidangList: Bidang[]
}) {
    return (
        <div className="flex flex-col gap-20">
            {/* Core Leadership (Pengurus Inti) */}
            <section>
                <div className="text-center mb-12">
                    <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-amber-500 mb-2">PENGURUS HARIAN</h2>
                    <div className="w-12 h-0.5 bg-amber-500/30 mx-auto" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pengurusInti.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-neutral-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 text-center hover:border-amber-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                <User size={20} className="text-amber-500" />
                            </div>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">{item.role}</p>
                            <h3 className="text-white font-bold tracking-wide">{item.name}</h3>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Departments (Bidang) */}
            <section className="space-y-16">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-amber-500 mb-2">BIDANG PENGEMBANGAN</h2>
                    <div className="w-12 h-0.5 bg-amber-500/30 mx-auto" />
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {bidangList.map((bidang, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-neutral-900/40 border border-white/5 rounded-[32px] overflow-hidden"
                        >
                            <div className="bg-neutral-800/50 p-6 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xl font-bold font-display uppercase tracking-wider text-white">
                                    {bidang.title}
                                </h3>
                                <Shield className="text-amber-500/50" size={20} />
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Bidang Leader */}
                                <div className="flex items-center gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <Trophy size={18} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Ketua Bidang</p>
                                        <p className="text-white font-bold text-lg">{bidang.leader}</p>
                                    </div>
                                </div>

                                {/* Members List */}
                                <div className="grid grid-cols-2 gap-4">
                                    {bidang.members.map((member, mIndex) => (
                                        <div key={mIndex} className="flex items-center gap-3 text-sm text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
                                            {member}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>
        </div>
    );
}
