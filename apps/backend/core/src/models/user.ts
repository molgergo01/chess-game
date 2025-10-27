export type User = {
    id: string;
    name: string;
    email: string;
    elo: number;
    avatarUrl: string | null;
};

export type LeaderboardUser = {
    id: string;
    rank: number;
    name: string;
    elo: number;
    avatarUrl: string | null;
};

export type UserResult = {
    users: Array<LeaderboardUser>;
    totalCount: number;
};
