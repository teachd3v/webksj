
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Perguruan } from '@/data/mockData';

interface DirectoryClientProps {
    schools: Perguruan[];
}

export default function DirectoryClient({ schools }: DirectoryClientProps) {
    const [selectedSchool, setSelectedSchool] = useState<Perguruan | null>(null);

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6"
            >
                {schools.length > 0 ? schools.map((school, index) => (
                    <motion.button
                        key={school._id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedSchool(school)}
                        className="group bg-neutral-800/50 backdrop-blur-sm p-6 rounded-2xl hover:bg-neutral-800 transition-all flex flex-col items-center justify-center aspect-[4/5] border border-white/5 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                    >
                        <div className="w-20 h-20 bg-neutral-700/50 rounded-full mb-6 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner overflow-hidden relative">
                            {school.logo ? (
                                <Image src={school.logo} alt={school.name} fill className="object-cover" />
                            ) : '🥋'}
                        </div>
                        <h3 className="text-lg font-bold text-white text-center leading-tight group-hover:text-amber-500 transition-colors font-display">
                            {school.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">{school.style}</p>
                    </motion.button>
                )) : (
                    <p className="col-span-full text-center text-gray-500 italic">Belum ada data perguruan.</p>
                )}
            </motion.div>

            <AnimatePresence>
                {selectedSchool && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSchool(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    >
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-neutral-900 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl relative border border-white/10 z-[101]"
                        >
                            <div className="h-32 bg-gradient-to-r from-amber-700 to-orange-600 relative">
                                <button
                                    onClick={() => setSelectedSchool(null)}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                                >
                                    <X size={20} />
                                </button>
                                <div className="absolute -bottom-12 left-8 w-24 h-24 bg-neutral-900 rounded-2xl p-1 border-4 border-neutral-900">
                                    <div className="w-full h-full bg-neutral-800 rounded-xl flex items-center justify-center text-4xl overflow-hidden relative">
                                        {selectedSchool.logo ? (
                                            <Image src={selectedSchool.logo} alt={selectedSchool.name} fill className="object-cover" />
                                        ) : '🥋'}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-16 pb-8 px-8">
                                <div className="mb-6">
                                    <h3 className="text-3xl font-bold text-white font-display mb-1">{selectedSchool.name}</h3>
                                    <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm font-bold tracking-wide border border-amber-500/20">
                                        {selectedSchool.style}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Anggota</p>
                                            <p className="text-lg font-bold text-white">{selectedSchool.members}</p>
                                        </div>
                                    </div>
                                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                            <MapPin size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Lokasi</p>
                                            <p className="text-lg font-bold text-white">{selectedSchool.location}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedSchool.slug ? (
                                    <Link
                                        href={`/perguruan/${selectedSchool.slug}`}
                                        className="block w-full py-4 bg-white text-black rounded-xl font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 text-center"
                                    >
                                        Lihat Profil Lengkap
                                    </Link>
                                ) : (
                                    <div className="w-full py-4 bg-neutral-800 text-gray-500 rounded-xl font-bold uppercase tracking-widest text-center cursor-not-allowed border border-white/5">
                                        Profil Belum Tersedia
                                        <p className="text-[10px] lowercase normal-case font-normal mt-1 text-gray-600">
                                            (Slug belum digenerate di Sanity)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
