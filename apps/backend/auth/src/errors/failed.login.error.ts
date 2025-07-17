class FailedLoginError extends Error {
    constructor(message = 'Failed Login') {
        super(message);
    }
}

export default FailedLoginError;
