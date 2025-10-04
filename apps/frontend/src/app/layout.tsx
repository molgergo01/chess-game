import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import NavBar from '@/components/layout/navbar';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/hooks/auth/useAuth';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export const metadata: Metadata = {
    title: 'Chess Game',
    description: 'Online Chess Game created for ELTE thesis'
};

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <AuthProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <div className="w-[100vw] h-[100vh] overflow-hidden flex flex-col">
                            <NavBar className="hidden sm:block !flex-none" />
                            {children}
                        </div>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
