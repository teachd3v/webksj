export default function Loading() {
    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm uppercase tracking-widest">Memuat...</p>
            </div>
        </div>
    );
}
