import HeroClient from './HeroClient';

export default function Hero() {
    return (
        <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-neutral-900 z-10" />
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-105"
                >
                    <source src="/videos/silat-hero.mp4" type="video/mp4" />
                </video>
            </div>

            <HeroClient settings={null} />
        </section>
    );
}
