class InvalidMoveError extends Error {
    constructor(message = 'Invalid Move') {
        super(message);
    }
}

export default InvalidMoveError;
