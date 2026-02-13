
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { navLinks } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                'fixed top-0 left-0 w-full z-50 transition-all duration-500',
                scrolled
                    ? 'glass-dark py-3'
                    : 'bg-transparent py-6'
            )}
        >
            <div className="container mx-auto px-6 flex justify-between items-center text-white">
                <Link href="/" className="flex items-center gap-2 text-3xl font-extrabold tracking-tighter hover:text-amber-500 transition-colors duration-300 font-display">
                    <Image src="/images/logo.png" alt="KSJ Logo" width={40} height={40} className="object-contain" />
                    <span>KSJ<span className="text-amber-500">.</span></span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium hover:text-amber-400 transition-colors uppercase tracking-widest relative group"
                        >
                            {link.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    ))}
                    <a href="#join" className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full text-sm font-bold shadow-lg shadow-amber-900/20 hover:shadow-amber-600/40 hover:scale-105 transition-all duration-300">
                        GABUNG
                    </a>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden focus:outline-none text-white hover:text-amber-500 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={32} /> : <Menu size={32} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-black/95 absolute top-full left-0 w-full overflow-hidden border-b border-white/10"
                    >
                        <div className="py-8 flex flex-col items-center space-y-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="text-white hover:text-amber-400 text-xl font-display font-medium tracking-wide"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
