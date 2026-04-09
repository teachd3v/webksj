import StatsClient from './StatsClient';

const stats = [
    { label: 'Total Perguruan', value: 62 },
    { label: 'Total Aliran', value: 25 },
    { label: 'Total Anggota', value: 5040 },
];

export default function Stats() {

    return (
        <section className="py-12 bg-neutral-950 relative -mt-10 z-20">
            <div className="container mx-auto px-6">
                <StatsClient stats={stats} />
            </div>
        </section>
    );
}
