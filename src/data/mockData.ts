// This file now serves as a fallback or type definition provider.
// Real data will be fetched from Sanity when available.

export const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Tentang Kami', href: '/#about' },
    { name: 'Perguruan', href: '/#directory' },
    { name: 'Berita', href: '/#berita-section' },
    { name: 'UMKM', href: '/#umkm' },
    { name: 'Galeri', href: '/#gallery' },
];

export const stats = [
    { label: 'Total Perguruan', value: 62 },
    { label: 'Total Aliran', value: 25 },
    { label: 'Total Anggota', value: 5040 },
];

// Types for dynamic data
export interface Perguruan {
    _id: string;
    name: string;
    slug?: string;
    style: string;
    members: number;
    location: string;
    logo?: string;
}

export interface NewsItem {
    _id: string;
    title: string;
    slug: string;
    date: string;
    excerpt: string;
    image?: string;
}

export interface Product {
    _id: string;
    name: string;
    price: string;
    image?: string;
    whatsappLink?: string;
}

export interface GalleryItem {
    _id: string;
    caption: string;
    image: string;
}
