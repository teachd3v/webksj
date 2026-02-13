import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-4">
            <h2 className="text-4xl font-bold mb-4 font-display text-amber-500">404 - Halaman Tidak Ditemukan</h2>
            <p className="text-gray-400 mb-8 max-w-md text-center">
                Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
            </p>
            <Link
                href="/"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold transition-colors"
            >
                Kembali ke Beranda
            </Link>
        </div>
    );
}
