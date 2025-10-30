export type MoveCallback = {
    (response: { success: boolean; position: string }): void;
};
