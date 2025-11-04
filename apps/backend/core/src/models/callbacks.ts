export type MoveCallback = {
    (response: { success: boolean; position: string }): void;
};

export type JoinChatRoomCallback = (response: { success: boolean }) => void;
