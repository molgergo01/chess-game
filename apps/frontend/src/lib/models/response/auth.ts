export type GetMeResponse = {
    user: AuthUser;
};

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    elo: number;
    avatarUrl: string | null;
};
