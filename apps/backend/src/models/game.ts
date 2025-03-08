export interface MoveData {
    from: string;
    to: string;
    gameId: string;
}

export interface MoveCallback {
    (response: { success: boolean; position: string }): void;
}

export interface PositionData {
    gameId: string;
}

export interface PositionCallback {
    (response: { position: string }): void;
}
