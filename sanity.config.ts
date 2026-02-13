
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
                        // Singleton: Site Settings
                        S.listItem()
                            .title('Site Settings')
                            .id('siteSettings')
                            .child(
                                S.document()
                                    .schemaType('siteSettings')
                                    .documentId('siteSettings')
                                    .title('Site Settings')
                            ),
                        // Singleton: Stats Settings
                        S.listItem()
                            .title('Stats Settings')
                            .id('statsSettings')
                            .child(
                                S.document()
                                    .schemaType('statsSettings')
                                    .documentId('statsSettings')
                                    .title('Stats Settings')
                            ),
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
                            (listItem) => !['siteSettings', 'statsSettings', 'organisasi', 'media.tag'].includes(listItem.getId() || '')
                        ),
                    ]),
        }),
        visionTool({ defaultApiVersion: apiVersion }),
    ],
    document: {
        // Handle singleton actions safely
        actions: (prev, context) => {
            const singletonTypes = ['siteSettings', 'statsSettings', 'organisasi'];
            if (singletonTypes.includes(context.schemaType)) {
                return prev.filter(({ action }) =>
                    action === 'publish' || action === 'discardChanges' || action === 'restore'
                );
            }
            return prev;
        },
    },
});
