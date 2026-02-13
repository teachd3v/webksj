
import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'organisasi',
    title: 'Struktur Organisasi',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Judul Halaman',
            type: 'string',
            initialValue: 'PENGURUS KAMPUNG SILAT JAMPANG',
        }),
        defineField({
            name: 'pengurusInti',
            title: 'Pengurus Inti',
            description: 'Jajaran pimpinan pusat (Ketua Umum, Sekretaris, dll)',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        {
                            name: 'role',
                            type: 'string',
                            title: 'Jabatan',
                            options: {
                                list: [
                                    { title: 'Ketua Umum', value: 'Ketua Umum' },
                                    { title: 'Sekretaris', value: 'Sekretaris' },
                                    { title: 'Bendahara', value: 'Bendahara' },
                                    { title: 'Koordinator KSJ', value: 'Koordinator KSJ' },
                                ]
                            }
                        },
                        { name: 'name', type: 'string', title: 'Nama Lengkap' },
                    ],
                    preview: {
                        select: {
                            title: 'name',
                            subtitle: 'role'
                        }
                    }
                }
            ]
        }),
        defineField({
            name: 'bidangList',
            title: 'Daftar Bidang',
            description: 'Bidang-bidang yang memiliki Ketua dan Anggota',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'bidang',
                    title: 'Bidang',
                    fields: [
                        { name: 'title', type: 'string', title: 'Nama Bidang (e.g. SILAT PRESTASI)' },
                        { name: 'leader', type: 'string', title: 'Ketua Bidang' },
                        {
                            name: 'members',
                            title: 'Daftar Anggota',
                            type: 'array',
                            of: [{ type: 'string' }]
                        }
                    ],
                    preview: {
                        select: {
                            title: 'title',
                            subtitle: 'leader'
                        }
                    }
                }
            ]
        }),
        // Legacy fields to suppress warnings
        defineField({ name: 'sections', type: 'array', of: [{ type: 'object', fields: [{ name: 'temp', type: 'string' }] }], hidden: true }),
        defineField({ name: 'description', type: 'text', hidden: true }),
        defineField({ name: 'footerQuote', type: 'text', hidden: true }),
    ],
});
