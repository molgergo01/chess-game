import { CronJob } from 'cron';
import MatchmakingService from '../services/matchmaking.service';
import { inject, injectable } from 'inversify';

@injectable()
class MatchmakingScheduler {
    private matchmakingCronJob: CronJob;
    private failureCount = 0;
    private readonly MAX_CONSECUTIVE_FAILURES = 10;

    constructor(
        @inject(MatchmakingService)
        public readonly matchmakingService: MatchmakingService
    ) {
        this.matchmakingCronJob = CronJob.from({
            name: 'matchmaking-cron-job',
            cronTime: '*/5 * * * * *',
            onTick: this.runMatchmaking.bind(this),
            start: false
        });
    }

    private async runMatchmaking() {
        try {
            await this.matchmakingService.matchMake(null);
            this.failureCount = 0;
        } catch (error) {
            this.failureCount++;
            console.error(
                `Matchmaking scheduler failed (${this.failureCount}/${this.MAX_CONSECUTIVE_FAILURES}):`,
                error
            );

            if (this.failureCount >= this.MAX_CONSECUTIVE_FAILURES) {
                console.error('Matchmaking scheduler exceeded max failures, stopping...');
                this.matchmakingCronJob.stop();
            }
        }
    }

    start() {
        this.matchmakingCronJob.start();
    }
}

export default MatchmakingScheduler;
