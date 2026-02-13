import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'statsSettings',
    title: 'Stats Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'totalPerguruan',
            title: 'Total Perguruan',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'totalAliran',
            title: 'Total Aliran',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
        defineField({
            name: 'totalAnggota',
            title: 'Total Anggota',
            type: 'number',
            validation: (Rule) => Rule.required().min(0),
        }),
    ],
});
