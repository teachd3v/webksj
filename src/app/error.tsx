'use client';

export default function Error({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                    <span className="text-3xl">!</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-display mb-3">Terjadi Kesalahan</h2>
                <p className="text-gray-400 mb-8">
                    Maaf, terjadi kesalahan saat memuat halaman. Silakan coba lagi.
                </p>
                <button
                    onClick={reset}
                    className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold uppercase tracking-wider transition-all"
                >
                    Coba Lagi
                </button>
            </div>
        </div>
    );
}
