
import { sanityFetch } from '@/sanity/lib/fetch';
import { GALLERY_QUERY } from '@/sanity/lib/queries';
import type { GalleryItem } from '@/data/mockData';
import GalleryClient from './GalleryClient';

export default async function Gallery() {
    const items = await sanityFetch<GalleryItem[]>({ query: GALLERY_QUERY });

    return (
        <section id="gallery" className="py-24 bg-black relative">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-end mb-12 px-4">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-white font-display uppercase tracking-tighter">Galeri <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-red-600">Aksi</span></h2>
                    </div>
                    <div className="hidden md:block w-32 h-1 bg-white/10 rounded-full mb-4"></div>
                </div>

                <GalleryClient items={items || []} />
            </div>
        </section>
    );
}
