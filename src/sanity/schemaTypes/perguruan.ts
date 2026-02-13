import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'perguruan',
    title: 'Perguruan',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Nama Perguruan',
            type: 'string',
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'name',
                maxLength: 96,
            },
        }),
        defineField({
            name: 'style',
            title: 'Aliran Silat',
            type: 'string',
        }),
        defineField({
            name: 'members',
            title: 'Jumlah Anggota',
            type: 'number',
        }),
        defineField({
            name: 'location',
            title: 'Lokasi',
            type: 'string',
        }),
        defineField({
            name: 'logo',
            title: 'Logo',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'masterName',
            title: 'Nama Guru Besar',
            type: 'string',
        }),
        defineField({
            name: 'contact',
            title: 'Nomor WhatsApp (628xxx)',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Profil / Tentang Perguruan',
            type: 'array',
            of: [{ type: 'block' }],
        }),
        defineField({
            name: 'history',
            title: 'Sejarah Perguruan',
            type: 'array',
            of: [{ type: 'block' }],
        }),
    ],
});
