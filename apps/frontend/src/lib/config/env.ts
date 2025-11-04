const env = {
    REST_URLS: {
        CORE: process.env.NEXT_PUBLIC_CORE_ADDRESS || 'http://localhost:8080',
        MATCHMAKING: process.env.NEXT_PUBLIC_MATCHMAKING_ADDRESS || 'http://localhost:8081',
        AUTH: process.env.NEXT_PUBLIC_AUTH_ADDRESS || 'http://localhost:8082'
    },
    WS_URLS: {
        CORE:
            process.env.NEXT_PUBLIC_CORE_ADDRESS?.replace('https://', 'wss://').replace('http://', 'ws://') ||
            'ws://localhost:8080',
        MATCHMAKING:
            process.env.NEXT_PUBLIC_MATCHMAKING_ADDRESS?.replace('https://', 'wss://').replace('http://', 'ws://') ||
            'ws://localhost:8081'
    }
};

export default env;
