import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'product',
    title: 'Katalog UMKM',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Nama Produk',
            type: 'string',
        }),
        defineField({
            name: 'price',
            title: 'Harga',
            type: 'string',
        }),
        defineField({
            name: 'image',
            title: 'Gambar Produk',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'whatsappLink',
            title: 'Link WhatsApp Penjual',
            type: 'url',
        }),
    ],
});
