import RatingService from '../../src/services/rating.service';
import UsersRepository from '../../src/repositories/users.repository';
import GamesRepository from '../../src/repositories/games.repository';
import { Winner } from '../../src/models/game';

jest.mock('../../src/repositories/users.repository');
jest.mock('../../src/repositories/games.repository');

describe('Rating Service', () => {
    let mockUsersRepository: jest.Mocked<UsersRepository>;
    let mockGamesRepository: jest.Mocked<GamesRepository>;
    let ratingService: RatingService;

    beforeEach(() => {
        mockUsersRepository = new UsersRepository() as jest.Mocked<UsersRepository>;
        mockUsersRepository.findEloById = jest.fn();
        mockUsersRepository.updateEloById = jest.fn();

        mockGamesRepository = new GamesRepository() as jest.Mocked<GamesRepository>;
        mockGamesRepository.countAllNonDrawsByUserId = jest.fn();

        ratingService = new RatingService(mockUsersRepository, mockGamesRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Adjust Ratings', () => {
        it('should return unchanged ratings when game is a draw', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';
            const whiteElo = 1500;
            const blackElo = 1600;

            mockUsersRepository.findEloById.mockResolvedValueOnce(whiteElo);
            mockUsersRepository.findEloById.mockResolvedValueOnce(blackElo);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.DRAW);

            expect(result).toEqual({
                whiteNewRating: 1500,
                whiteRatingChange: 0,
                blackNewRating: 1600,
                blackRatingChange: 0
            });

            expect(mockGamesRepository.countAllNonDrawsByUserId).not.toHaveBeenCalled();
            expect(mockUsersRepository.updateEloById).not.toHaveBeenCalled();
        });

        it('should calculate correct ratings when white wins with K=40', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(1500);
            mockUsersRepository.findEloById.mockResolvedValueOnce(1500);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(15);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(20);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.WHITE);

            expect(result).toEqual({
                whiteNewRating: 1520,
                whiteRatingChange: 20,
                blackNewRating: 1480,
                blackRatingChange: -20
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 1520);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 1480);
        });

        it('should calculate correct ratings when white wins with K=20', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(2200);
            mockUsersRepository.findEloById.mockResolvedValueOnce(1800);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(50);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(10);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.WHITE);

            expect(result).toEqual({
                whiteNewRating: 2202,
                whiteRatingChange: 2,
                blackNewRating: 1796,
                blackRatingChange: -4
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 2202);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 1796);
        });

        it('should calculate correct ratings when white wins with K=10', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(2500);
            mockUsersRepository.findEloById.mockResolvedValueOnce(1900);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(100);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(10);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.WHITE);

            expect(result).toEqual({
                whiteNewRating: 2500,
                whiteRatingChange: 0,
                blackNewRating: 1899,
                blackRatingChange: -1
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 2500);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 1899);
        });

        it('should calculate correct ratings when black wins with K=40', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(1400);
            mockUsersRepository.findEloById.mockResolvedValueOnce(1600);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(25);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(30);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.BLACK);

            expect(result).toEqual({
                whiteNewRating: 1390,
                whiteRatingChange: -10,
                blackNewRating: 1610,
                blackRatingChange: 10
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 1390);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 1610);
        });

        it('should calculate correct ratings when black wins with K=20', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(1700);
            mockUsersRepository.findEloById.mockResolvedValueOnce(2100);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(5);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(80);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.BLACK);

            expect(result).toEqual({
                whiteNewRating: 1696,
                whiteRatingChange: -4,
                blackNewRating: 2102,
                blackRatingChange: 2
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 1696);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 2102);
        });

        it('should calculate correct ratings when black wins with K=10', async () => {
            const whitePlayerId = '1234';
            const blackPlayerId = '5678';

            mockUsersRepository.findEloById.mockResolvedValueOnce(2000);
            mockUsersRepository.findEloById.mockResolvedValueOnce(2700);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(10);
            mockGamesRepository.countAllNonDrawsByUserId.mockResolvedValueOnce(150);

            const result = await ratingService.adjustRatings(whitePlayerId, blackPlayerId, Winner.BLACK);

            expect(result).toEqual({
                whiteNewRating: 1999,
                whiteRatingChange: -1,
                blackNewRating: 2700,
                blackRatingChange: 0
            });

            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(whitePlayerId, 1999);
            expect(mockUsersRepository.updateEloById).toHaveBeenCalledWith(blackPlayerId, 2700);
        });
    });
});
