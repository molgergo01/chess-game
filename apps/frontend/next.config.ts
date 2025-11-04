import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'standalone',
    async redirects() {
        return [
            {
                source: '/games',
                destination: '/games/history',
                permanent: true
            },
            {
                source: '/',
                destination: '/play',
                permanent: true
            }
        ];
    }
};

export default nextConfig;
