import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Only protect /studio routes
    if (!request.nextUrl.pathname.startsWith('/studio')) {
        return NextResponse.next();
    }

    const authHeader = request.headers.get('authorization');

    if (authHeader) {
        const [scheme, encoded] = authHeader.split(' ');

        if (scheme === 'Basic' && encoded) {
            const decoded = atob(encoded);
            const [user, pass] = decoded.split(':');

            const validUser = process.env.STUDIO_AUTH_USER || 'admin';
            const validPass = process.env.STUDIO_AUTH_PASS || 'ksjadmin2024';

            if (user === validUser && pass === validPass) {
                return NextResponse.next();
            }
        }
    }

    return new NextResponse('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Sanity Studio"',
        },
    });
}

export const config = {
    matcher: '/studio/:path*',
};
