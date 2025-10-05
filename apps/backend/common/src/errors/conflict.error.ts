class ConflictError extends Error {
    constructor(message = 'Conflict') {
        super(message);
    }
}

export default ConflictError;
