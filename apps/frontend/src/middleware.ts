import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import env from '@/lib/config/env';

export async function middleware(req: NextRequest) {
    try {
        await axios.post(
            `${env.REST_URLS.AUTH}/api/auth/verify`,
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
            console.warn(e.response?.data.message);
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
