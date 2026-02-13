
'use client';

import { Facebook, Instagram, Twitter, MapPin, Phone, ArrowUp } from 'lucide-react';

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-neutral-950 text-white pt-24 pb-10 border-t border-white/5 relative overflow-hidden">
            {/* Big Background Text */}
            <div className="absolute top-0 left-0 w-full overflow-hidden select-none pointer-events-none opacity-[0.03]">
                <h1 className="text-[15vw] font-black text-white leading-none whitespace-nowrap">KAMPUNG SILAT</h1>
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 mb-20">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2 space-y-8">
                        <h2 className="text-4xl font-extrabold tracking-tighter font-display">KSJ<span className="text-amber-600">.</span></h2>
                        <p className="text-gray-400 max-w-sm leading-relaxed text-lg">
                            Melestarikan budaya, memberdayakan ekonomi, dan membangun karakter generasi muda melalui silat.
                        </p>
                        <div className="flex space-x-4">
                            {[Instagram, Facebook, Twitter].map((Icon, i) => (
                                <a key={i} href="#" className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-amber-600 hover:border-amber-600 transition-all duration-300 group">
                                    <Icon size={20} className="text-gray-400 group-hover:text-white transition-colors" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold font-display uppercase tracking-widest text-white">Menu</h3>
                        <ul className="space-y-4 text-gray-400">
                            {['Home', 'About Us', 'Directory', 'News', 'Shop'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="hover:text-amber-500 transition-colors flex items-center gap-2 group">
                                        <span className="w-0 group-hover:w-2 h-[1px] bg-amber-500 transition-all"></span>
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold font-display uppercase tracking-widest text-white">Hubungi Kami</h3>
                        <ul className="space-y-6 text-gray-400">
                            <li className="flex items-start gap-4 group">
                                <div className="bg-neutral-900 p-3 rounded-lg group-hover:bg-amber-600/20 transition-colors">
                                    <MapPin className="text-amber-500 shrink-0" size={20} />
                                </div>
                                <span className="text-sm leading-relaxed">Jl. Parung Bogor Km 42, Jampang, Kemang, Bogor, Jawa Barat.</span>
                            </li>
                            <li className="flex items-center gap-4 group">
                                <div className="bg-neutral-900 p-3 rounded-lg group-hover:bg-amber-600/20 transition-colors">
                                    <Phone className="text-amber-500 shrink-0" size={20} />
                                </div>
                                <span>+62 812-3456-7890</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-sm">
                        &copy; {new Date().getFullYear()} Kampung Silat Jampang. All rights reserved.
                    </p>
                    <button
                        onClick={scrollToTop}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors uppercase tracking-wider font-bold"
                    >
                        Back to Top <ArrowUp size={16} />
                    </button>
                </div>
            </div>
        </footer>
    );
}
