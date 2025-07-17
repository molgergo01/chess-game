class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
    }
}

export default UnauthorizedError;
