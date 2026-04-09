
import { defineConfig } from 'sanity';
import { structureTool, type StructureBuilder } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schema } from './src/sanity/schemaTypes';
import { apiVersion, dataset, projectId } from './src/sanity/env';

export default defineConfig({
    name: 'ksj-studio',
    basePath: '/studio',
    projectId,
    dataset,
    schema,
    plugins: [
        structureTool({
            structure: (S: StructureBuilder) =>
                S.list()
                    .title('KSJ')
                    .items([
                        // Singleton: Struktur Organisasi
                        S.listItem()
                            .title('Struktur Organisasi')
                            .id('organisasi')
                            .child(
                                S.document()
                                    .schemaType('organisasi')
                                    .documentId('organisasi')
                                    .title('Struktur Organisasi')
                            ),
                        S.divider(),
                        // Filter out singletons from the main list
                        ...S.documentTypeListItems().filter(
                            (listItem) => !['organisasi', 'media.tag'].includes(listItem.getId() || '')
                        ),
                    ]),
        }),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
    document: {
        // Handle singleton actions safely
        actions: (prev, context) => {
            const singletonTypes = ['organisasi'];
            if (singletonTypes.includes(context.schemaType)) {
                return prev.filter(({ action }) =>
                    action === 'publish' || action === 'discardChanges' || action === 'restore'
                );
            }
            return prev;
        },
    },
});
