import { Winner } from './game';
import { PlayerTimes } from './player';

export type GetGameIdCallback = {
    (response: { gameId: string | null }): void;
};

export type GetTimesCallback = {
    (response: { playerTimes: PlayerTimes }): void;
};

export interface MoveCallback {
    (response: { success: boolean; position: string }): void;
}

export interface PositionCallback {
    (response: { position: string; gameOver: boolean; winner: Winner | null }): void;
}
