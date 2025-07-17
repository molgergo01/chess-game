const env = {
    REST_URLS: {
        CORE:
            `http://${process.env.NEXT_PUBLIC_CORE_ADDRESS}` ||
            'http://localhost:8080',
        MATCHMAKING:
            `http://${process.env.NEXT_PUBLIC_MATCHMAKING_ADDRESS}` ||
            'http://localhost:8081',
        AUTH:
            `http://${process.env.NEXT_PUBLIC_AUTH_ADDRESS}` ||
            'http://localhost:8082'
    },
    WS_URLS: {
        CORE:
            `ws://${process.env.NEXT_PUBLIC_CORE_ADDRESS}` ||
            'http://localhost:8080',
        MATCHMAKING:
            `ws://${process.env.NEXT_PUBLIC_MATCHMAKING_ADDRESS}` ||
            'http://localhost:8080'
    }
};

export default env;
