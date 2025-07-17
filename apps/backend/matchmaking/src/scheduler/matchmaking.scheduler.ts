import { CronJob } from 'cron';
import MatchmakingService from '../services/matchmaking.service';
import { inject, injectable } from 'inversify';

@injectable()
class MatchmakingScheduler {
    private matchmakingCronJob: CronJob;

    constructor(
        @inject(MatchmakingService)
        public readonly matchmakingService: MatchmakingService
    ) {
        this.matchmakingCronJob = CronJob.from({
            name: 'matchmaking-cron-job',
            cronTime: '*/5 * * * * *',
            onTick: async function () {
                await matchmakingService.matchMake();
            },
            start: false
        });
    }

    start() {
        this.matchmakingCronJob.start();
    }
}

export default MatchmakingScheduler;
