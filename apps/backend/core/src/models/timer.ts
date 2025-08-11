import { RAPID_PLAYER_TIME_IN_MINUTES } from '../config/constants';

export class Timer {
    constructor(public remainingMs = RAPID_PLAYER_TIME_IN_MINUTES * 60 * 1000) {
        this.remainingMs = remainingMs;
    }

    decrementTimer(timeMs: number) {
        this.remainingMs -= timeMs;
    }
}
