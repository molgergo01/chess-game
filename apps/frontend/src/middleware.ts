import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

export async function middleware(req: NextRequest) {
    try {
        await axios.post(
            'http://localhost:8080/api/auth/verify',
            {},
            {
                headers: {
                    Cookie: req.headers.get('cookie')
                }
            }
        );

        if (req.nextUrl.pathname === '/login') {
            return NextResponse.redirect(new URL('/', req.url));
        }
    } catch (e) {
        if (e instanceof AxiosError) {
            console.log(e.response?.statusText);
        }
        if (req.nextUrl.pathname !== '/login') {
            return NextResponse.redirect(new URL('/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|board-login.png).*)']
};
