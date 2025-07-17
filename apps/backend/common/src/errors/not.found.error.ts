class NotFoundError extends Error {
    constructor(message = 'Not Found') {
        super(message);
    }
}

export default NotFoundError;
