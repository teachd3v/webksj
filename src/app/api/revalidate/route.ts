import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

// Map: tipe dokumen Sanity → path yang perlu di-revalidate di Next.js
const TYPE_PATH_MAP: Record<string, string[]> = {
    news: ["/", "/berita"],
    product: ["/", "/produk"],
    organisasi: ["/", "/organisasi"],
    perguruan: ["/", "/perguruan"],
    gallery: ["/"],
};

export async function POST(req: NextRequest) {
    const secret = req.nextUrl.searchParams.get("secret");

    // 1. Validasi secret token
    if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
        return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const documentType = body?._type as string | undefined;

        // 2. Tentukan path mana yang perlu di-revalidate
        // Jika tipe dokumen dikenal, revalidate path terkait. 
        // Jika tidak dikenal (fallback), revalidate home.
        const pathsToRevalidate = documentType && TYPE_PATH_MAP[documentType]
            ? TYPE_PATH_MAP[documentType]
            : ["/"];

        // 3. Eksekusi revalidation
        pathsToRevalidate.forEach((path) => {
            revalidatePath(path);
            console.log(`[Revalidate] Success for path: ${path}`);
        });

        return NextResponse.json({
            revalidated: true,
            now: Date.now(),
            type: documentType,
            paths: pathsToRevalidate,
        });
    } catch (err) {
        return NextResponse.json({ 
            message: "Error revalidating", 
            error: err instanceof Error ? err.message : String(err) 
        }, { status: 500 });
    }
}
