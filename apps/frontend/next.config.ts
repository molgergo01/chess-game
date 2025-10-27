import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
