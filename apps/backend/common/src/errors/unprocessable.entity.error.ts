class UnprocessableEntityError extends Error {
    constructor(message = 'Unprocessable Entity') {
        super(message);
    }
}

export default UnprocessableEntityError;
