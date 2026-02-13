
import { sanityFetch } from '@/sanity/lib/fetch';
import { STATS_SETTINGS_QUERY } from '@/sanity/lib/queries';
import { stats as mockStats } from '@/data/mockData';
import StatsClient from './StatsClient';

export default async function Stats() {
    const statsSettings = await sanityFetch<{totalPerguruan: number; totalAliran: number; totalAnggota: number} | null>({ query: STATS_SETTINGS_QUERY });

    // Use Sanity data if available, otherwise fallback to mock data
    const stats = statsSettings
        ? [
            { label: 'Total Perguruan', value: statsSettings.totalPerguruan },
            { label: 'Total Aliran', value: statsSettings.totalAliran },
            { label: 'Total Anggota', value: statsSettings.totalAnggota },
        ]
        : mockStats;

    return (
        <section className="py-12 bg-neutral-950 relative -mt-10 z-20">
            <div className="container mx-auto px-6">
                <StatsClient stats={stats} />
            </div>
        </section>
    );
}
