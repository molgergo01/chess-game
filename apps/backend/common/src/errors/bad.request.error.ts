class BadRequestError extends Error {
    constructor(message = 'Bad Request') {
        super(message);
    }
}

export default BadRequestError;
