
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Stats from '@/components/Stats';
import Directory from '@/components/Directory';
import Blog from '@/components/Blog';
import UMKM from '@/components/UMKM';
import Gallery from '@/components/Gallery';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 overflow-x-hidden">
      <Navbar />
      <Hero />
      <About />
      <Stats />
      <Directory />
      <Blog />
      <UMKM />
      <Gallery />
      <Footer />
    </main>
  );
}
