class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
    }
}

export default ForbiddenError;
