class NotPlayersTurnError extends Error {
    constructor(message = "Not player's turn") {
        super(message);
    }
}

export default NotPlayersTurnError;
