export type PlayerLeaderboard = {
    users: Array<User>;
    totalCount: number;
};

type User = {
    userId: string;
    rank: number;
    name: string;
    elo: number;
    avatarUrl: string | null;
};
