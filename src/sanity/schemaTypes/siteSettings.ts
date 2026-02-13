import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'heroTagline',
            title: 'Hero Tagline',
            type: 'string',
            description: 'Teks utama di hero section (default: PUSAT BUDAYA SILAT NUSANTARA)',
        }),
        defineField({
            name: 'heroDescription',
            title: 'Hero Description',
            type: 'text',
            rows: 3,
            description: 'Deskripsi di bawah tagline hero',
        }),
    ],
});
