import MatchmakingScheduler from '../../src/scheduler/matchmaking.scheduler';
import MatchmakingService from '../../src/services/matchmaking.service';
import { CronJob } from 'cron';

jest.mock('../../src/services/matchmaking.service');
jest.mock('cron');

describe('Matchmaking Scheduler', () => {
    let mockMatchmakingService: jest.Mocked<MatchmakingService>;
    let matchmakingScheduler: MatchmakingScheduler;
    let mockCronJob: jest.Mocked<CronJob>;

    beforeEach(() => {
        mockMatchmakingService = new MatchmakingService(
            null as never,
            null as never,
            null as never,
            null as never,
            null as never
        ) as jest.Mocked<MatchmakingService>;
        mockMatchmakingService.matchMake = jest.fn();

        mockCronJob = {
            start: jest.fn()
        } as unknown as jest.Mocked<CronJob>;

        (CronJob.from as jest.Mock) = jest.fn().mockReturnValue(mockCronJob);

        matchmakingScheduler = new MatchmakingScheduler(mockMatchmakingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    describe('Constructor', () => {
        it('should create cron job with correct configuration', () => {
            expect(CronJob.from).toHaveBeenCalledWith({
                name: 'matchmaking-cron-job',
                cronTime: '*/5 * * * * *',
                onTick: expect.any(Function),
                start: false
            });
        });

        it('should call matchmakingService.matchMake when cron job ticks', async () => {
            const cronConfig = (CronJob.from as jest.Mock).mock.calls[0][0];
            const onTickFunction = cronConfig.onTick;

            await onTickFunction();

            expect(mockMatchmakingService.matchMake).toHaveBeenCalled();
        });
    });

    describe('start', () => {
        it('should start the cron job', () => {
            matchmakingScheduler.start();

            expect(mockCronJob.start).toHaveBeenCalled();
        });
    });
});
