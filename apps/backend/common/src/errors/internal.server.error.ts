class InternalServerError extends Error {
    constructor(message = 'Internal Server Error') {
        super(message);
    }
}

export default InternalServerError;
