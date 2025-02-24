import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function middleware(req: NextRequest) {
    axios
        .post('http://localhost:8080/api/auth/verify', {
            headers: {
                Cookie: req.headers.get('cookie')
            }
        })
        .catch((e) => {
            console.error(e.response?.statusText);
            return NextResponse.redirect(new URL('/login', req.url));
        })
        .then(() => {
            if (req.nextUrl.pathname === '/login') {
                return NextResponse.redirect(new URL('/', req.url));
            }
        });

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|board-login.png).*)']
};
