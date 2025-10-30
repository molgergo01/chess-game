import { inject, injectable } from 'inversify';
import UsersRepository from '../repositories/users.repository';
import { RatingChange, Winner } from '../models/game';
import GamesRepository from '../repositories/games.repository';

@injectable()
class RatingService {
    constructor(
        @inject(UsersRepository)
        private readonly usersRepository: UsersRepository,
        @inject(GamesRepository)
        private readonly gamesRepository: GamesRepository
    ) {}

    async adjustRatings(whitePlayerId: string, blackPlayerId: string, winner: Winner): Promise<RatingChange> {
        const whitePlayerRating = await this.usersRepository.findEloById(whitePlayerId);
        const blackPlayerRating = await this.usersRepository.findEloById(blackPlayerId);

        if (winner === Winner.DRAW) {
            return {
                whiteNewRating: whitePlayerRating,
                whiteRatingChange: 0,
                blackNewRating: blackPlayerRating,
                blackRatingChange: 0
            };
        }

        const whiteNumberOfGamesPlayed = await this.gamesRepository.countAllNonDrawsByUserId(whitePlayerId);
        const blackNumberOfGamesPlayed = await this.gamesRepository.countAllNonDrawsByUserId(blackPlayerId);

        const whiteKFactor = this.getKFactor(whitePlayerRating, whiteNumberOfGamesPlayed);
        const blackKFactor = this.getKFactor(blackPlayerRating, blackNumberOfGamesPlayed);

        const whiteScore = winner === Winner.WHITE ? 1 : 0;
        const blackScore = winner === Winner.BLACK ? 1 : 0;

        const whiteExpected = this.calculateExpectedRating(whitePlayerRating, blackPlayerRating);
        const blackExpected = this.calculateExpectedRating(blackPlayerRating, whitePlayerRating);

        const whiteRatingChange = Math.round(whiteKFactor * (whiteScore - whiteExpected));
        const blackRatingChange = Math.round(blackKFactor * (blackScore - blackExpected));

        const whiteNewRating = whitePlayerRating + whiteRatingChange;
        const blackNewRating = blackPlayerRating + blackRatingChange;

        await this.usersRepository.updateEloById(whitePlayerId, whiteNewRating);
        await this.usersRepository.updateEloById(blackPlayerId, blackNewRating);

        return {
            whiteNewRating: whiteNewRating,
            whiteRatingChange,
            blackNewRating: blackNewRating,
            blackRatingChange
        };
    }

    private calculateExpectedRating(playerRating: number, opponentRating: number): number {
        return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    }

    private getKFactor(rating: number, numberOfGamesPlayed: number): number {
        if (numberOfGamesPlayed <= 30) {
            return 40;
        }
        return rating <= 2400 ? 20 : 10;
    }
}

export default RatingService;
