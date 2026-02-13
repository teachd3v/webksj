import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'news',
    title: 'Berita & Kegiatan',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Judul',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'date',
            title: 'Tanggal',
            type: 'date',
        }),
        defineField({
            name: 'excerpt',
            title: 'Ringkasan',
            type: 'text',
        }),
        defineField({
            name: 'content',
            title: 'Isi Berita',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'image',
            title: 'Gambar Utama',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
    ],
});
