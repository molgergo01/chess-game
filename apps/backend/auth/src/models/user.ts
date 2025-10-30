export class User {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;

    constructor(
        id: string | undefined,
        name: string | undefined,
        email: string | undefined,
        avatarUrl: string | null | undefined
    ) {
        if (!id || !name || !email) {
            throw new Error('User must have an id, name and email');
        }
        this.id = id;
        this.name = name;
        this.email = email;
        if (avatarUrl) {
            this.avatarUrl = avatarUrl;
        } else {
            this.avatarUrl = null;
        }
    }
}

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    elo: number;
    avatarUrl: string | null;
};
