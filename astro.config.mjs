import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    site: 'https://kampungsilatjampang.id',
    output: 'server',
    session: {
        driver: 'memory',
    },
    adapter: cloudflare({
        imageService: 'passthrough',
    }),
    integrations: [react()],
    vite: {
        plugins: [tailwindcss()],
    },
});
