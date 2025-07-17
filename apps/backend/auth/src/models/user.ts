export class User {
    id: string;
    name: string;
    email: string;

    constructor(
        id: string | undefined,
        name: string | undefined,
        email: string | undefined
    ) {
        if (!id || !name || !email) {
            throw new Error('User must have an id, name and email');
        }
        this.id = id;
        this.name = name;
        this.email = email;
    }
}
