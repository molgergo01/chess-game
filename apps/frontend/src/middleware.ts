import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = await fetch('http://localhost:8080/api/auth/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: req.headers.get('cookie') || '' // Pass cookies manually
        }
    });

    if (res.status === 401 && req.nextUrl.pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', req.url));
    } else if (res.status === 200 && req.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
