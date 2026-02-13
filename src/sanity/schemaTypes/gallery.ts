import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'gallery',
    title: 'Galeri',
    type: 'document',
    fields: [
        defineField({
            name: 'caption',
            title: 'Keterangan Gambar',
            type: 'string',
        }),
        defineField({
            name: 'image',
            title: 'Foto',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
    ],
});
